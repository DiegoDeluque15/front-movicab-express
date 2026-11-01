import { Component, computed, input } from '@angular/core';
import { Tag } from 'primeng/tag';
import { Status } from '../../../core/models/api.model';

@Component({
  host: { class: 'inline-block' },
  selector: 'app-status-tag',
  imports: [Tag],
  templateUrl: './status-tag.html',
  styleUrl: './status-tag.css',
})
export class StatusTag {
  readonly status = input.required<Status>();

  readonly label = computed(() => (this.status() === 'active' ? 'Activo' : 'Inactivo'));
  readonly severity = computed<'success' | 'danger'>(() =>
    this.status() === 'active' ? 'success' : 'danger',
  );
}
