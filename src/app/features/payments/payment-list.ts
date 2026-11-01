import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DecimalPipe, DatePipe, UpperCasePipe } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { SharedModule } from 'primeng/api';
import { PaymentApi } from './payment-api';
import { NotificationService } from '../../core/services/notification';
import { PageHeader } from '../../shared/ui/page-header/page-header';
import { EmptyState } from '../../shared/ui/empty-state/empty-state';
import { Payment } from '../../core/models/payment.model';

@Component({
  selector: 'app-payment-list',
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
    UpperCasePipe,
  ],
  templateUrl: './payment-list.html',
})
export class PaymentList implements OnInit {
  private readonly api = inject(PaymentApi);
  private readonly notify = inject(NotificationService);

  payments = signal<Payment[]>([]);
  loading = signal(true);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.api.list().subscribe({
      next: (data: Payment[]) => {
        console.log('Pagos recibidos del API:', data);
        this.payments.set(data ?? []);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error en PaymentApi.list():', err);
        this.notify.error('Error al cargar la lista de pagos');
        this.loading.set(false);
      },
    });
  }

  getMethodSeverity(method: string): 'success' | 'info' | 'warn' | 'secondary' {
    switch (method?.toLowerCase()) {
      case 'efectivo':
        return 'success';
      case 'tarjeta':
        return 'info';
      case 'transferencia':
        return 'warn';
      default:
        return 'secondary';
    }
  }
}

