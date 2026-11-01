import { Component, inject, signal, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { InputNumberModule } from 'primeng/inputnumber';
import { SharedModule } from 'primeng/api';
import { PaymentApi } from './payment-api';
import { TripApi } from '../trips/trip-api';
import { NotificationService } from '../../core/services/notification';
import { PageHeader } from '../../shared/ui/page-header/page-header';
import { Trip } from '../../core/models/trip.model';

@Component({
  selector: 'app-payment-form',
  imports: [
    ReactiveFormsModule,
    CommonModule,
    ButtonModule,
    SelectModule,
    InputNumberModule,
    SharedModule,
    PageHeader,
  ],
  templateUrl: './payment-form.html',
})
export class PaymentForm implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(PaymentApi);
  private readonly tripApi = inject(TripApi);
  private readonly router = inject(Router);
  private readonly notify = inject(NotificationService);

  loading = signal(false);
  trips = signal<Trip[]>([]);

  paymentMethods = [
    { label: 'Efectivo', value: 'efectivo' },
    { label: 'Tarjeta de Crédito / Débito', value: 'tarjeta' },
    { label: 'Transferencia Bancaria', value: 'transferencia' },
  ];

  form = this.fb.group({
    reference_type: ['Trip', Validators.required],
    reference_id: [null as number | null, Validators.required],
    payment_method: ['efectivo', Validators.required],
    amount: [null as number | null, [Validators.required, Validators.min(0.01)]],
  });

  ngOnInit(): void {
    this.tripApi.list().subscribe({
      next: (trips) => {
        this.trips.set(trips);
      },
      error: () => this.notify.error('Error al cargar carreras para el pago'),
    });

    // Al seleccionar una carrera, si ya tiene un total definido, autorrellenar el monto
    this.form.get('reference_id')?.valueChanges.subscribe((tripId) => {
      if (!tripId) return;
      const trip = this.trips().find((t) => t.id === tripId);
      if (trip && trip.total !== null && trip.total !== undefined) {
        this.form.patchValue({ amount: parseFloat(trip.total as any) });
      }
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    const raw = this.form.getRawValue();

    const payload = {
      reference_type: raw.reference_type!,
      reference_id: raw.reference_id!,
      payment_method: raw.payment_method!,
      amount: raw.amount!,
    };

    this.api.create(payload).subscribe({
      next: () => {
        this.notify.success('Pago registrado correctamente');
        this.router.navigate(['/payments']);
      },
      error: (err) => {
        const detail = err?.error?.detail ?? err?.error?.error ?? 'Error al registrar el pago';
        this.notify.error(detail);
        this.loading.set(false);
      },
    });
  }

  cancel(): void {
    this.router.navigate(['/payments']);
  }
}

