import { Component, inject, signal, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { SelectButtonModule } from 'primeng/selectbutton';
import { TextareaModule } from 'primeng/textarea';
import { ShiftApi } from './shift-api';
import { DriverApi } from '../drivers/driver-api';
import { VehicleApi } from '../vehicles/vehicle-api';
import { NotificationService } from '../../core/services/notification';
import { PageHeader } from '../../shared/ui/page-header/page-header';
import { Driver } from '../../core/models/driver.model';
import { Vehicle } from '../../core/models/vehicle.model';
import { forkJoin } from 'rxjs';

@Component({
    selector: 'app-shift-form',
    imports: [
        ReactiveFormsModule,
        ButtonModule,
        InputTextModule,
        SelectModule,
        SelectButtonModule,
        TextareaModule,
        PageHeader,
    ],
    templateUrl: './shift-form.html',
})
export class ShiftForm implements OnInit {
    private readonly fb = inject(FormBuilder);
    private readonly api = inject(ShiftApi);
    private readonly driverApi = inject(DriverApi);
    private readonly vehicleApi = inject(VehicleApi);
    private readonly router = inject(Router);
    private readonly route = inject(ActivatedRoute);
    private readonly notify = inject(NotificationService);

    editId: number | null = null;
    loading = signal(false);
    drivers = signal<Driver[]>([]);
    vehicles = signal<Vehicle[]>([]);

    statusOptions = [
        { label: 'Activo', value: 'active' },
        { label: 'Inactivo', value: 'inactive' },
    ];

    form = this.fb.group({
        name: ['', [Validators.required, Validators.minLength(2)]],
        description: [''],
        driver_id: [null as number | null, Validators.required],
        vehicle_id: [null as number | null, Validators.required],
        status: ['active'],
    });

    get isEdit(): boolean {
        return this.editId !== null;
    }

    ngOnInit(): void {
        const idParam = this.route.snapshot.paramMap.get('id');
        this.editId = idParam ? +idParam : null;

        forkJoin({
            drivers: this.driverApi.list(),
            vehicles: this.vehicleApi.list(),
        }).subscribe(({ drivers, vehicles }) => {
            this.drivers.set(drivers);
            this.vehicles.set(vehicles);

            if (this.editId) {
                this.api.get(this.editId).subscribe({
                    next: (shift) => {
                        this.form.patchValue({
                            name: shift.name,
                            description: shift.description ?? '',
                            driver_id: shift.driver_id,
                            vehicle_id: shift.vehicle_id,
                            status: shift.status,
                        });
                    },
                    error: () => this.notify.error('No se pudo cargar el turno'),
                });
            }
        });
    }

    submit(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        this.loading.set(true);
        const payload = this.form.getRawValue() as any;

        const request$ = this.isEdit
            ? this.api.update(this.editId!, payload)
            : this.api.create(payload);

        request$.subscribe({
            next: () => {
                this.notify.success(this.isEdit ? 'Turno actualizado' : 'Turno creado');
                this.router.navigate(['/shifts']);
            },
            error: (err) => {
                const detail = err?.error?.detail ?? err?.error?.error ?? 'Error al guardar el turno';
                this.notify.error(detail);
                this.loading.set(false);
            },
        });
    }

    cancel(): void {
        this.router.navigate(['/shifts']);
    }
}

