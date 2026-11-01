import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { SelectButtonModule } from 'primeng/selectbutton';
import { PassengerApi } from './passenger-api';
import { NotificationService } from '../../core/services/notification';
import { PageHeader } from '../../shared/ui/page-header/page-header';
import { PassengerPayload } from '../../core/models/passenger.model';

@Component({
    selector: 'app-passenger-form',
    imports: [
        ReactiveFormsModule,
        ButtonModule,
        InputTextModule,
        PasswordModule,
        SelectButtonModule,
        PageHeader,
        RouterLink,
    ],
    templateUrl: './passenger-form.html',
})
export class PassengerForm implements OnInit {
    private readonly fb = inject(FormBuilder);
    private readonly api = inject(PassengerApi);
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly notify = inject(NotificationService);

    readonly isEdit = signal(false);
    readonly loading = signal(false);
    readonly saving = signal(false);
    private passengerId: number | null = null;

    readonly statusOptions = [
        { label: 'Activo', value: 'active' },
        { label: 'Inactivo', value: 'inactive' },
    ];

    readonly form: FormGroup = this.fb.group({
        name: ['', [Validators.required, Validators.minLength(3)]],
        email: ['', [Validators.required, Validators.email]],
        password: [''],
        phone: ['', [Validators.required, Validators.pattern(/^[0-9+()\- ]{7,20}$/)]],
        address: [''],
        status: ['active', [Validators.required]],
    });

    ngOnInit(): void {
        const idParam = this.route.snapshot.paramMap.get('id');
        if (idParam) {
            this.passengerId = Number(idParam);
            this.isEdit.set(true);
            this.loadPassenger(this.passengerId);
        } else {
            // Al crear, la contraseña es obligatoria
            this.form.get('password')?.setValidators([Validators.required, Validators.minLength(6)]);
            this.form.get('password')?.updateValueAndValidity();
        }
    }

    private loadPassenger(id: number): void {
        this.loading.set(true);
        this.api.get(id).subscribe({
            next: (passenger) => {
                this.form.patchValue({
                    name: passenger.name ?? '',
                    email: passenger.email ?? '',
                    phone: passenger.phone ?? '',
                    address: passenger.address ?? '',
                    status: passenger.status ?? 'active',
                });
                this.loading.set(false);
            },
            error: () => {
                this.notify.error('Error al cargar datos del pasajero');
                this.loading.set(false);
                this.router.navigate(['/passengers']);
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
        const payload: PassengerPayload = {
            name: rawValue.name,
            email: rawValue.email,
            phone: rawValue.phone,
            address: rawValue.address || null,
            status: rawValue.status,
        };

        // Si tiene contraseña la enviamos
        if (rawValue.password) {
            payload.password = rawValue.password;
        }

        if (this.isEdit() && this.passengerId) {
            this.api.update(this.passengerId, payload).subscribe({
                next: () => {
                    this.notify.success('Pasajero actualizado correctamente');
                    this.router.navigate(['/passengers']);
                },
                error: (err) => {
                    this.notify.error(err?.error?.error ?? 'Error al actualizar pasajero');
                    this.saving.set(false);
                },
            });
        } else {
            this.api.create(payload).subscribe({
                next: () => {
                    this.notify.success('Pasajero creado correctamente');
                    this.router.navigate(['/passengers']);
                },
                error: (err) => {
                    this.notify.error(err?.error?.error ?? 'Error al crear pasajero');
                    this.saving.set(false);
                },
            });
        }
    }
}

