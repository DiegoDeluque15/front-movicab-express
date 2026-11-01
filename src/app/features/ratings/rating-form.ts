import { Component, inject, signal, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { RatingModule } from 'primeng/rating';
import { TextareaModule } from 'primeng/textarea';
import { SharedModule } from 'primeng/api';
import { RatingApi } from './rating-api';
import { TripApi } from '../trips/trip-api';
import { NotificationService } from '../../core/services/notification';
import { PageHeader } from '../../shared/ui/page-header/page-header';
import { Trip } from '../../core/models/trip.model';

@Component({
  selector: 'app-rating-form',
  imports: [
    ReactiveFormsModule,
    ButtonModule,
    SelectModule,
    RatingModule,
    TextareaModule,
    SharedModule,
    PageHeader,
  ],
  templateUrl: './rating-form.html',
})
export class RatingForm implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(RatingApi);
  private readonly tripApi = inject(TripApi);
  private readonly router = inject(Router);
  private readonly notify = inject(NotificationService);

  loading = signal(false);
  trips = signal<Trip[]>([]);

  form = this.fb.group({
    trip_id: [null as number | null, Validators.required],
    score: [5, [Validators.required, Validators.min(1), Validators.max(5)]],
    comment: [''],
  });

  ngOnInit(): void {
    this.tripApi.list().subscribe({
      next: (trips) => {
        // Preferiblemente carreras que estén cerradas
        this.trips.set(trips);
      },
      error: () => this.notify.error('Error al cargar carreras'),
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
      trip_id: raw.trip_id!,
      score: raw.score!,
      comment: raw.comment || null,
    };

    this.api.create(payload).subscribe({
      next: () => {
        this.notify.success('Calificación registrada con éxito');
        this.router.navigate(['/ratings']);
      },
      error: (err) => {
        const detail = err?.error?.detail ?? err?.error?.error ?? 'Error al registrar calificación';
        this.notify.error(detail);
        this.loading.set(false);
      },
    });
  }

  cancel(): void {
    this.router.navigate(['/ratings']);
  }
}

