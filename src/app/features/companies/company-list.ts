import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ConfirmationService, SharedModule } from 'primeng/api';
import { CompanyApi } from './company-api';
import { NotificationService } from '../../core/services/notification';
import { PageHeader } from '../../shared/ui/page-header/page-header';
import { EmptyState } from '../../shared/ui/empty-state/empty-state';
import { Company } from '../../core/models/company.model';

@Component({
    selector: 'app-company-list',
    imports: [ButtonModule, TableModule, TagModule, PageHeader, EmptyState, RouterLink, SharedModule],
    templateUrl: './company-list.html',
})
export class CompanyList implements OnInit {
    private readonly api = inject(CompanyApi);
    private readonly confirm = inject(ConfirmationService);
    private readonly notify = inject(NotificationService);

    companies = signal<Company[]>([]);
    loading = signal(true);

    ngOnInit(): void {
        this.load();
    }

    load(): void {
        this.loading.set(true);
        this.api.list().subscribe({
            next: (data: Company[]) => {
                this.companies.set(data ?? []);
                this.loading.set(false);
            },
            error: () => {
                this.notify.error('Error al cargar la lista de empresas');
                this.loading.set(false);
            },
        });
    }

    confirmDelete(company: Company): void {
        this.confirm.confirm({
            message: `¿Eliminar la empresa "${company.legal_name}"?`,
            header: 'Confirmar eliminación',
            icon: 'pi pi-trash',
            accept: () => this.delete(company.id),
        });
    }

    private delete(id: number): void {
        this.api.remove(id).subscribe({
            next: () => {
                this.notify.success('Empresa eliminada correctamente');
                this.load();
            },
            error: (err) => {
                const detail = err?.error?.detail ?? err?.error?.error ?? 'No se pudo eliminar: la empresa tiene registros asociados.';
                this.notify.error(detail);
            },
        });
    }
}