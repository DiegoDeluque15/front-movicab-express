import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ConfirmationService, SharedModule } from 'primeng/api';
import { PassengerApi } from './passenger-api';
import { NotificationService } from '../../core/services/notification';
import { PageHeader } from '../../shared/ui/page-header/page-header';
import { EmptyState } from '../../shared/ui/empty-state/empty-state';
import { Passenger } from '../../core/models/passenger.model';

@Component({
  selector: 'app-passenger-list',
  imports: [ButtonModule, TableModule, TagModule, PageHeader, EmptyState, RouterLink, SharedModule],
  templateUrl: './passenger-list.html',
})
export class PassengerList implements OnInit {
  private readonly api = inject(PassengerApi);
  private readonly confirm = inject(ConfirmationService);
  private readonly notify = inject(NotificationService);

  passengers = signal<Passenger[]>([]);
  loading = signal(true);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.api.list().subscribe({
      next: (data: Passenger[]) => {
        console.log('PASAJEROS RECIBIDOS:', data);
        this.passengers.set(data ?? []);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('ERROR AL CARGAR:', err);
        this.notify.error('Error al cargar pasajeros');
        this.loading.set(false);
      },
    });
  }

  confirmDelete(passenger: Passenger): void {
    this.confirm.confirm({
      message: `¿Eliminar a ${passenger.name}?`,
      header: 'Confirmar eliminación',
      icon: 'pi pi-trash',
      accept: () => this.delete(passenger.id),
    });
  }

  private delete(id: number): void {
    this.api.remove(id).subscribe({
      next: () => {
        this.notify.success('Pasajero eliminado');
        this.load();
      },
      error: () => this.notify.error('Error al eliminar'),
    });
  }
}

