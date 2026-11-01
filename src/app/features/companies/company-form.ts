import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectButtonModule } from 'primeng/selectbutton';
import { CompanyApi } from './company-api';
import { NotificationService } from '../../core/services/notification';
import { PageHeader } from '../../shared/ui/page-header/page-header';
import { CompanyPayload } from '../../core/models/company.model';

@Component({
    selector: 'app-company-form',
    imports: [
        ReactiveFormsModule,
        ButtonModule,
        InputTextModule,
        SelectButtonModule,
        PageHeader,
        RouterLink,
    ],
    templateUrl: './company-form.html',
})
export class CompanyForm implements OnInit {
    private readonly fb = inject(FormBuilder);
    private readonly api = inject(CompanyApi);
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly notify = inject(NotificationService);

    readonly isEdit = signal(false);
    readonly loading = signal(false);
    readonly saving = signal(false);
    private companyId: number | null = null;

    readonly statusOptions = [
        { label: 'Activo', value: 'active' },
        { label: 'Inactivo', value: 'inactive' },
    ];

    readonly form: FormGroup = this.fb.group({
        legal_name: ['', [Validators.required, Validators.minLength(2)]],
        tax_id: ['', [Validators.required, Validators.minLength(3)]],
        primary_contact: [''],
        status: ['active', [Validators.required]],
    });

    ngOnInit(): void {
        const idParam = this.route.snapshot.paramMap.get('id');
        if (idParam) {
            this.companyId = Number(idParam);
            this.isEdit.set(true);
            this.loadCompany(this.companyId);
        }
    }

    private loadCompany(id: number): void {
        this.loading.set(true);
        this.api.get(id).subscribe({
            next: (comp) => {
                this.form.patchValue({
                    legal_name: comp.legal_name,
                    tax_id: comp.tax_id,
                    primary_contact: comp.primary_contact ?? '',
                    status: comp.status ?? 'active',
                });
                this.loading.set(false);
            },
            error: () => {
                this.notify.error('Error al cargar datos de la empresa');
                this.loading.set(false);
                this.router.navigate(['/companies']);
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
        const payload: CompanyPayload = {
            legal_name: rawValue.legal_name,
            tax_id: rawValue.tax_id,
            primary_contact: rawValue.primary_contact || null,
            status: rawValue.status,
        };

        if (this.isEdit() && this.companyId) {
            this.api.update(this.companyId, payload).subscribe({
                next: () => {
                    this.notify.success('Empresa actualizada correctamente');
                    this.router.navigate(['/companies']);
                },
                error: (err) => {
                    this.notify.error(err?.error?.error ?? 'Error al actualizar empresa');
                    this.saving.set(false);
                },
            });
        } else {
            this.api.create(payload).subscribe({
                next: () => {
                    this.notify.success('Empresa creada correctamente');
                    this.router.navigate(['/companies']);
                },
                error: (err) => {
                    this.notify.error(err?.error?.error ?? 'Error al registrar empresa');
                    this.saving.set(false);
                },
            });
        }
    }
}