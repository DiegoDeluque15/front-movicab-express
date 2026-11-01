import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DecimalPipe, DatePipe } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { SharedModule } from 'primeng/api';
import { SettlementApi } from './settlement-api';
import { DriverApi } from '../drivers/driver-api';
import { NotificationService } from '../../core/services/notification';
import { PageHeader } from '../../shared/ui/page-header/page-header';
import { EmptyState } from '../../shared/ui/empty-state/empty-state';
import { Settlement } from '../../core/models/settlement.model';
import { Driver } from '../../core/models/driver.model';

@Component({
  selector: 'app-settlement-list',
  imports: [
    ButtonModule,
    TableModule,
    TagModule,
    PageHeader,
    EmptyState,
    RouterLink,
    SharedModule,
    DecimalPipe,
    DatePipe,
  ],
  templateUrl: './settlement-list.html',
})
export class SettlementList implements OnInit {
  private readonly api = inject(SettlementApi);
  private readonly driverApi = inject(DriverApi);
  private readonly notify = inject(NotificationService);

  settlements = signal<Settlement[]>([]);
  drivers = signal<Driver[]>([]);
  loading = signal(true);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.driverApi.list().subscribe({
      next: (drivers) => this.drivers.set(drivers),
    });

    this.api.list().subscribe({
      next: (data: Settlement[]) => {
        this.settlements.set(data ?? []);
        this.loading.set(false);
      },
      error: () => {
        this.notify.error('Error al cargar la lista de liquidaciones');
        this.loading.set(false);
      },
    });
  }

  getDriverName(driverId: number): string {
    const driver = this.drivers().find((d) => d.id === driverId);
    return driver?.name ?? `Conductor #${driverId}`;
  }
}

