import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ConfirmationService, SharedModule } from 'primeng/api';
import { ShiftApi } from './shift-api';
import { NotificationService } from '../../core/services/notification';
import { PageHeader } from '../../shared/ui/page-header/page-header';
import { EmptyState } from '../../shared/ui/empty-state/empty-state';
import { Shift } from '../../core/models/shift.model';

@Component({
    selector: 'app-shift-list',
    imports: [ButtonModule, TableModule, TagModule, PageHeader, EmptyState, RouterLink, SharedModule],
    templateUrl: './shift-list.html',
})
export class ShiftList implements OnInit {
    private readonly api = inject(ShiftApi);
    private readonly confirm = inject(ConfirmationService);
    private readonly notify = inject(NotificationService);

    shifts = signal<Shift[]>([]);
    loading = signal(true);

    ngOnInit(): void {
        this.load();
    }

    load(): void {
        this.loading.set(true);
        this.api.list().subscribe({
            next: (data: Shift[]) => {
                this.shifts.set(data ?? []);
                this.loading.set(false);
            },
            error: () => {
                this.notify.error('Error al cargar la lista de turnos');
                this.loading.set(false);
            },
        });
    }

    confirmDelete(shift: Shift): void {
        this.confirm.confirm({
            message: `¿Eliminar el turno "${shift.name}"?`,
            header: 'Confirmar eliminación',
            icon: 'pi pi-trash',
            accept: () => this.delete(shift.id),
        });
    }

    private delete(id: number): void {
        this.api.remove(id).subscribe({
            next: () => {
                this.notify.success('Turno eliminado correctamente');
                this.load();
            },
            error: (err) => {
                const detail = err?.error?.detail ?? err?.error?.error ?? 'No se pudo eliminar: el turno tiene registros asociados.';
                this.notify.error(detail);
            },
        });
    }
}

