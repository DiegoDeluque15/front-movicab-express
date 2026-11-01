import { Component, inject, signal, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { DatePickerModule } from 'primeng/datepicker';
import { SelectButtonModule } from 'primeng/selectbutton';
import { TextareaModule } from 'primeng/textarea';
import { FareApi } from './fare-api';
import { FarePayload } from '../../core/models/fare.model';
import { Status } from '../../core/models/api.model';
import { NotificationService } from '../../core/services/notification';
import { PageHeader } from '../../shared/ui/page-header/page-header';

@Component({
    selector: 'app-fare-form',
    imports: [
        ReactiveFormsModule,
        ButtonModule,
        InputTextModule,
        InputNumberModule,
        DatePickerModule,
        SelectButtonModule,
        TextareaModule,
        PageHeader,
    ],
    templateUrl: './fare-form.html',
})
export class FareForm implements OnInit {
    private readonly fb = inject(FormBuilder);
    private readonly api = inject(FareApi);
    private readonly router = inject(Router);
    private readonly route = inject(ActivatedRoute);
    private readonly notify = inject(NotificationService);

    editId: number | null = null;
    loading = signal(false);

    statusOptions = [
        { label: 'Activa', value: 'active' },
        { label: 'Inactiva', value: 'inactive' },
    ];

    form = this.fb.group({
        name: ['', [Validators.required, Validators.minLength(2)]],
        calculation_rule: [''],
        base_value: [null as number | null, [Validators.required, Validators.min(0)]],
        valid_from: [null as Date | null, Validators.required],
        valid_until: [null as Date | null, Validators.required],
        status: ['active'],
    });

    get isEdit(): boolean {
        return this.editId !== null;
    }

    ngOnInit(): void {
        const idParam = this.route.snapshot.paramMap.get('id');
        this.editId = idParam ? +idParam : null;

        if (this.editId) {
            this.api.get(this.editId).subscribe({
                next: (fare) => {
                    this.form.patchValue({
                        name: fare.name,
                        calculation_rule: fare.calculation_rule ?? '',
                        base_value: parseFloat(fare.base_value as any),
                        valid_from: new Date(fare.valid_from),
                        valid_until: new Date(fare.valid_until),
                        status: fare.status,
                    });
                },
                error: () => this.notify.error('No se pudo cargar la tarifa'),
            });
        }
    }

    submit(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        this.loading.set(true);
        const raw = this.form.getRawValue();

        const payload: FarePayload = {
            name: raw.name!,
            calculation_rule: raw.calculation_rule || null,
            base_value: raw.base_value!,
            valid_from: (raw.valid_from as Date).toISOString().split('T')[0],
            valid_until: (raw.valid_until as Date).toISOString().split('T')[0],
            status: (raw.status as Status) ?? 'active',
        };

        const request$ = this.isEdit
            ? this.api.update(this.editId!, payload)
            : this.api.create(payload);

        request$.subscribe({
            next: () => {
                this.notify.success(this.isEdit ? 'Tarifa actualizada' : 'Tarifa creada');
                this.router.navigate(['/fares']);
            },
            error: (err) => {
                const detail = err?.error?.detail ?? err?.error?.error ?? 'Error al guardar la tarifa';
                this.notify.error(detail);
                this.loading.set(false);
            },
        });
    }

    cancel(): void {
        this.router.navigate(['/fares']);
    }
}

