import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { RatingModule } from 'primeng/rating';
import { FormsModule } from '@angular/forms';
import { ConfirmationService, SharedModule } from 'primeng/api';
import { RatingApi } from './rating-api';
import { NotificationService } from '../../core/services/notification';
import { PageHeader } from '../../shared/ui/page-header/page-header';
import { EmptyState } from '../../shared/ui/empty-state/empty-state';
import { Rating } from '../../core/models/rating.model';

@Component({
  selector: 'app-rating-list',
  imports: [
    ButtonModule,
    TableModule,
    RatingModule,
    FormsModule,
    PageHeader,
    EmptyState,
    RouterLink,
    SharedModule,
    DatePipe,
  ],
  templateUrl: './rating-list.html',
})
export class RatingList implements OnInit {
  private readonly api = inject(RatingApi);
  private readonly confirm = inject(ConfirmationService);
  private readonly notify = inject(NotificationService);

  ratings = signal<Rating[]>([]);
  loading = signal(true);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.api.list().subscribe({
      next: (data: Rating[]) => {
        this.ratings.set(data ?? []);
        this.loading.set(false);
      },
      error: () => {
        this.notify.error('Error al cargar calificaciones');
        this.loading.set(false);
      },
    });
  }

  confirmDelete(rating: Rating): void {
    this.confirm.confirm({
      message: `¿Eliminar la calificación #${rating.id} del viaje #${rating.trip_id}?`,
      header: 'Confirmar eliminación',
      icon: 'pi pi-trash',
      accept: () => this.delete(rating.id),
    });
  }

  private delete(id: number): void {
    this.api.remove(id).subscribe({
      next: () => {
        this.notify.success('Calificación eliminada correctamente');
        this.load();
      },
      error: (err) => {
        const detail = err?.error?.detail ?? err?.error?.error ?? 'No se pudo eliminar la calificación.';
        this.notify.error(detail);
      },
    });
  }
}

