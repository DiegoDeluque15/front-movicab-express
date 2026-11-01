import { Component, inject, signal, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { TripApi } from './trip-api';
import { PassengerApi } from '../passengers/passenger-api';
import { ShiftApi } from '../shifts/shift-api';
import { FareApi } from '../fares/fare-api';
import { NotificationService } from '../../core/services/notification';
import { PageHeader } from '../../shared/ui/page-header/page-header';
import { Passenger } from '../../core/models/passenger.model';
import { Shift } from '../../core/models/shift.model';
import { Fare } from '../../core/models/fare.model';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-trip-form',
  imports: [
    ReactiveFormsModule,
    ButtonModule,
    SelectModule,
    TextareaModule,
    PageHeader,
  ],
  templateUrl: './trip-form.html',
})
export class TripForm implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(TripApi);
  private readonly passengerApi = inject(PassengerApi);
  private readonly shiftApi = inject(ShiftApi);
  private readonly fareApi = inject(FareApi);
  private readonly router = inject(Router);
  private readonly notify = inject(NotificationService);

  loading = signal(false);
  passengers = signal<Passenger[]>([]);
  shifts = signal<Shift[]>([]);
  fares = signal<Fare[]>([]);

  form = this.fb.group({
    passenger_id: [null as number | null, Validators.required],
    shift_id: [null as number | null, Validators.required],
    fare_id: [null as number | null, Validators.required],
    notes: [''],
  });

  ngOnInit(): void {
    forkJoin({
      passengers: this.passengerApi.list(),
      shifts: this.shiftApi.list(),
      fares: this.fareApi.list(),
    }).subscribe({
      next: ({ passengers, shifts, fares }) => {
        this.passengers.set(passengers);
        this.shifts.set(shifts);
        this.fares.set(fares);

        // Preseleccionar la primera tarifa activa si existe
        const activeFare = fares.find((f) => f.status === 'active');
        if (activeFare) {
          this.form.patchValue({ fare_id: activeFare.id });
        }
      },
      error: () => this.notify.error('Error al cargar catálogos para la carrera'),
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
      passenger_id: raw.passenger_id!,
      shift_id: raw.shift_id!,
      fare_id: raw.fare_id!,
      notes: raw.notes || null,
    };

    this.api.create(payload).subscribe({
      next: () => {
        this.notify.success('Carrera solicitada con éxito');
        this.router.navigate(['/trips']);
      },
      error: (err) => {
        const detail = err?.error?.detail ?? err?.error?.error ?? 'Error al crear la carrera';
        this.notify.error(detail);
        this.loading.set(false);
      },
    });
  }

  cancel(): void {
    this.router.navigate(['/trips']);
  }
}

