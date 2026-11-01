import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectButtonModule } from 'primeng/selectbutton';
import { VehicleTypeApi } from './vehicle-type-api';
import { NotificationService } from '../../core/services/notification';
import { PageHeader } from '../../shared/ui/page-header/page-header';
import { VehicleTypePayload } from '../../core/models/vehicle-type.model';

@Component({
    selector: 'app-vehicle-type-form',
    imports: [
        ReactiveFormsModule,
        ButtonModule,
        InputTextModule,
        TextareaModule,
        SelectButtonModule,
        PageHeader,
        RouterLink,
    ],
    templateUrl: './vehicle-type-form.html',
})
export class VehicleTypeForm implements OnInit {
    private readonly fb = inject(FormBuilder);
    private readonly api = inject(VehicleTypeApi);
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly notify = inject(NotificationService);

    readonly isEdit = signal(false);
    readonly loading = signal(false);
    readonly saving = signal(false);
    private typeId: number | null = null;

    readonly statusOptions = [
        { label: 'Activo', value: 'active' },
        { label: 'Inactivo', value: 'inactive' },
    ];

    readonly form: FormGroup = this.fb.group({
        name: ['', [Validators.required, Validators.minLength(2)]],
        description: [''],
        status: ['active', [Validators.required]],
    });

    ngOnInit(): void {
        const idParam = this.route.snapshot.paramMap.get('id');
        if (idParam) {
            this.typeId = Number(idParam);
            this.isEdit.set(true);
            this.loadType(this.typeId);
        }
    }

    private loadType(id: number): void {
        this.loading.set(true);
        this.api.get(id).subscribe({
            next: (type) => {
                this.form.patchValue({
                    name: type.name,
                    description: type.description ?? '',
                    status: type.status ?? 'active',
                });
                this.loading.set(false);
            },
            error: () => {
                this.notify.error('Error al cargar datos del tipo de vehículo');
                this.loading.set(false);
                this.router.navigate(['/vehicle-types']);
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
        const payload: VehicleTypePayload = {
            name: rawValue.name,
            description: rawValue.description || null,
            status: rawValue.status,
        };

        if (this.isEdit() && this.typeId) {
            this.api.update(this.typeId, payload).subscribe({
                next: () => {
                    this.notify.success('Tipo de vehículo actualizado correctamente');
                    this.router.navigate(['/vehicle-types']);
                },
                error: (err) => {
                    this.notify.error(err?.error?.error ?? 'Error al actualizar tipo de vehículo');
                    this.saving.set(false);
                },
            });
        } else {
            this.api.create(payload).subscribe({
                next: () => {
                    this.notify.success('Tipo de vehículo creado correctamente');
                    this.router.navigate(['/vehicle-types']);
                },
                error: (err) => {
                    this.notify.error(err?.error?.error ?? 'Error al crear tipo de vehículo');
                    this.saving.set(false);
                },
            });
        }
    }
}