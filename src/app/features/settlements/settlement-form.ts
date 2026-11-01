import { Component, inject, signal, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { TextareaModule } from 'primeng/textarea';
import { SettlementApi } from './settlement-api';
import { DriverApi } from '../drivers/driver-api';
import { NotificationService } from '../../core/services/notification';
import { PageHeader } from '../../shared/ui/page-header/page-header';
import { Driver } from '../../core/models/driver.model';
import { SettlementPayload } from '../../core/models/settlement.model';

@Component({
  selector: 'app-settlement-form',
  imports: [
    ReactiveFormsModule,
    ButtonModule,
    SelectModule,
    DatePickerModule,
    TextareaModule,
    PageHeader,
  ],
  templateUrl: './settlement-form.html',
})
export class SettlementForm implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(SettlementApi);
  private readonly driverApi = inject(DriverApi);
  private readonly router = inject(Router);
  private readonly notify = inject(NotificationService);

  loading = signal(false);
  drivers = signal<Driver[]>([]);

  form = this.fb.group({
    driver_id: [null as number | null, Validators.required],
    date_from: [null as Date | null, Validators.required],
    date_to: [null as Date | null, Validators.required],
    notes: [''],
  });

  ngOnInit(): void {
    this.driverApi.list().subscribe({
      next: (drivers) => this.drivers.set(drivers),
      error: () => this.notify.error('Error al cargar conductores'),
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    const raw = this.form.getRawValue();

    const payload: SettlementPayload = {
      driver_id: raw.driver_id!,
      date_from: (raw.date_from as Date).toISOString().split('T')[0],
      date_to: (raw.date_to as Date).toISOString().split('T')[0],
      notes: raw.notes || null,
    };

    this.api.create(payload).subscribe({
      next: () => {
        this.notify.success('Liquidación generada con éxito');
        this.router.navigate(['/settlements']);
      },
      error: (err) => {
        const detail = err?.error?.detail ?? err?.error?.error ?? 'Error al generar liquidación';
        this.notify.error(detail);
        this.loading.set(false);
      },
    });
  }

  cancel(): void {
    this.router.navigate(['/settlements']);
  }
}

