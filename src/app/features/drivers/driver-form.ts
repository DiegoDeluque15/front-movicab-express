import { Component, inject, signal, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { SelectButtonModule } from 'primeng/selectbutton';
import { TextareaModule } from 'primeng/textarea';
import { DriverApi } from './driver-api';
import { CompanyApi } from '../companies/company-api';
import { NotificationService } from '../../core/services/notification';
import { PageHeader } from '../../shared/ui/page-header/page-header';
import { Company } from '../../core/models/company.model';
import { forkJoin } from 'rxjs';

@Component({
    selector: 'app-driver-form',
    imports: [
        ReactiveFormsModule,
        ButtonModule,
        InputTextModule,
        SelectModule,
        SelectButtonModule,
        TextareaModule,
        PageHeader,
    ],
    templateUrl: './driver-form.html',
})
export class DriverForm implements OnInit {
    private readonly fb = inject(FormBuilder);
    private readonly api = inject(DriverApi);
    private readonly companyApi = inject(CompanyApi);
    private readonly router = inject(Router);
    private readonly route = inject(ActivatedRoute);
    private readonly notify = inject(NotificationService);

    editId: number | null = null;
    loading = signal(false);
    companies = signal<Company[]>([]);

    statusOptions = [
        { label: 'Activo', value: 'active' },
        { label: 'Inactivo', value: 'inactive' },
    ];

    form = this.fb.group({
        name: ['', [Validators.required, Validators.minLength(2)]],
        description: [''],
        company_id: [null as number | null],
        status: ['active'],
    });

    get isEdit(): boolean {
        return this.editId !== null;
    }

    ngOnInit(): void {
        const idParam = this.route.snapshot.paramMap.get('id');
        this.editId = idParam ? +idParam : null;

        forkJoin({
            companies: this.companyApi.list(),
        }).subscribe(({ companies }) => {
            this.companies.set(companies);

            if (this.editId) {
                this.api.get(this.editId).subscribe({
                    next: (driver) => {
                        this.form.patchValue({
                            name: driver.name,
                            description: driver.description ?? '',
                            company_id: driver.company_id,
                            status: driver.status,
                        });
                    },
                    error: () => this.notify.error('No se pudo cargar el conductor'),
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
                this.notify.success(this.isEdit ? 'Conductor actualizado' : 'Conductor creado');
                this.router.navigate(['/drivers']);
            },
            error: (err) => {
                const detail = err?.error?.detail ?? err?.error?.error ?? 'Error al guardar el conductor';
                this.notify.error(detail);
                this.loading.set(false);
            },
        });
    }

    cancel(): void {
        this.router.navigate(['/drivers']);
    }
}

