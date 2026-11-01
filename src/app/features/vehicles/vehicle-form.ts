import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { SelectButtonModule } from 'primeng/selectbutton';
import { VehicleApi } from './vehicle-api';
import { CompanyApi } from '../companies/company-api';
import { VehicleTypeApi } from '../vehicle-types/vehicle-type-api';
import { NotificationService } from '../../core/services/notification';
import { PageHeader } from '../../shared/ui/page-header/page-header';
import { VehiclePayload } from '../../core/models/vehicle.model';
import { Company } from '../../core/models/company.model';
import { VehicleType } from '../../core/models/vehicle-type.model';

@Component({
    selector: 'app-vehicle-form',
    imports: [
        ReactiveFormsModule,
        ButtonModule,
        InputTextModule,
        TextareaModule,
        SelectModule,
        SelectButtonModule,
        PageHeader,
        RouterLink,
    ],
    templateUrl: './vehicle-form.html',
})
export class VehicleForm implements OnInit {
    private readonly fb = inject(FormBuilder);
    private readonly api = inject(VehicleApi);
    private readonly companyApi = inject(CompanyApi);
    private readonly vehicleTypeApi = inject(VehicleTypeApi);
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly notify = inject(NotificationService);

    readonly isEdit = signal(false);
    readonly loading = signal(false);
    readonly saving = signal(false);
    private vehicleId: number | null = null;

    companies = signal<Company[]>([]);
    vehicleTypes = signal<VehicleType[]>([]);

    readonly statusOptions = [
        { label: 'Activo', value: 'active' },
        { label: 'Inactivo', value: 'inactive' },
    ];

    readonly form: FormGroup = this.fb.group({
        name: ['', [Validators.required, Validators.minLength(2)]],
        description: [''],
        company_id: [null, [Validators.required]],
        vehicle_type_id: [null],
        status: ['active', [Validators.required]],
    });

    ngOnInit(): void {
        this.loadCatalogues();
        const idParam = this.route.snapshot.paramMap.get('id');
        if (idParam) {
            this.vehicleId = Number(idParam);
            this.isEdit.set(true);
            this.loadVehicle(this.vehicleId);
        }
    }

    private loadCatalogues(): void {
        forkJoin({
            companies: this.companyApi.list(),
            types: this.vehicleTypeApi.list(),
        }).subscribe({
            next: ({ companies, types }) => {
                this.companies.set(companies ?? []);
                this.vehicleTypes.set(types ?? []);
            },
            error: () => this.notify.error('Error al cargar catálogos de empresas y tipos'),
        });
    }

    private loadVehicle(id: number): void {
        this.loading.set(true);
        this.api.get(id).subscribe({
            next: (veh) => {
                this.form.patchValue({
                    name: veh.name,
                    description: veh.description ?? '',
                    company_id: veh.company_id,
                    vehicle_type_id: veh.vehicle_type_id,
                    status: veh.status ?? 'active',
                });
                this.loading.set(false);
            },
            error: () => {
                this.notify.error('Error al cargar datos del vehículo');
                this.loading.set(false);
                this.router.navigate(['/vehicles']);
            },
        });
    }

    onSubmit(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        this.saving.set(true);
        const rawValue = this.form.value;
        const payload: VehiclePayload = {
            name: rawValue.name,
            description: rawValue.description || null,
            company_id: Number(rawValue.company_id),
            vehicle_type_id: rawValue.vehicle_type_id ? Number(rawValue.vehicle_type_id) : null,
            status: rawValue.status,
        };

        if (this.isEdit() && this.vehicleId) {
            this.api.update(this.vehicleId, payload).subscribe({
                next: () => {
                    this.notify.success('Vehículo actualizado correctamente');
                    this.router.navigate(['/vehicles']);
                },
                error: (err) => {
                    this.notify.error(err?.error?.error ?? 'Error al actualizar vehículo');
                    this.saving.set(false);
                },
            });
        } else {
            this.api.create(payload).subscribe({
                next: () => {
                    this.notify.success('Vehículo registrado correctamente');
                    this.router.navigate(['/vehicles']);
                },
                error: (err) => {
                    this.notify.error(err?.error?.error ?? 'Error al registrar vehículo');
                    this.saving.set(false);
                },
            });
        }
    }
}
