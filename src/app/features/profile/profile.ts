import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { InputTextModule } from 'primeng/inputtext';
import { SharedModule } from 'primeng/api';
import { AuthService } from '../../core/auth/auth.service';
import { SessionStore } from '../../core/auth/session.store';
import { PageHeader } from '../../shared/ui/page-header/page-header';
import { ProfileUser, EffectivePermission } from '../../core/auth/auth.model';

@Component({
  selector: 'app-profile',
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    TableModule,
    TagModule,
    InputTextModule,
    SharedModule,
    PageHeader,
  ],
  templateUrl: './profile.html',
})
export class Profile implements OnInit {
  private readonly auth = inject(AuthService);
  readonly session = inject(SessionStore);

  user = signal<ProfileUser | null>(null);
  permissions = signal<EffectivePermission[]>([]);
  loading = signal(true);
  searchTerm = signal('');

  ngOnInit(): void {
    this.user.set(this.session.user());
    this.permissions.set(this.session.permissions());

    // Actualizamos con datos frescos desde el backend
    this.auth.fetchProfile().subscribe({
      next: (res) => {
        this.user.set(res.user);
        this.session.updateProfile(res.user);
      },
    });

    this.auth.fetchPermissions().subscribe({
      next: (res) => {
        this.permissions.set(res.permissions);
        this.session.updatePermissions(res.permissions);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  get filteredPermissions(): EffectivePermission[] {
    const term = this.searchTerm().toLowerCase().trim();
    if (!term) return this.permissions();

    return this.permissions().filter(
      (p) =>
        p.path.toLowerCase().includes(term) ||
        p.method.toLowerCase().includes(term) ||
        (p.role_name && p.role_name.toLowerCase().includes(term))
    );
  }

  getMethodSeverity(method: string): 'info' | 'success' | 'warn' | 'danger' | 'secondary' {
    switch (method.toUpperCase()) {
      case 'GET':
        return 'info';
      case 'POST':
        return 'success';
      case 'PUT':
      case 'PATCH':
        return 'warn';
      case 'DELETE':
        return 'danger';
      default:
        return 'secondary';
    }
  }

  logout(): void {
    this.auth.logout();
  }
}

