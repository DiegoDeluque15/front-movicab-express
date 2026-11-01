import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { ConfirmationService } from 'primeng/api';

import { PageHeader } from '../../shared/ui/page-header/page-header';
import { NotificationService } from '../../core/services/notification';
import { RbacApiService } from './rbac-api.service';
import {
  User,
  Role,
  Resource,
  RoleUser,
  ResourceRole,
} from '../../core/models/rbac.model';

@Component({
  selector: 'app-rbac-admin',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TableModule,
    ButtonModule,
    TagModule,
    DialogModule,
    SelectModule,
    InputTextModule,
    PageHeader,
  ],
  templateUrl: './rbac-admin.html',
})
export class RbacAdmin implements OnInit {
  private readonly api = inject(RbacApiService);
  private readonly notify = inject(NotificationService);
  private readonly confirm = inject(ConfirmationService);
  private readonly fb = inject(FormBuilder);

  // Tab activo
  activeTab = signal<'users' | 'roles' | 'resources' | 'assignments' | 'grants'>('users');

  // Estados de datos
  users = signal<User[]>([]);
  roles = signal<Role[]>([]);
  resources = signal<Resource[]>([]);
  assignments = signal<RoleUser[]>([]);
  grants = signal<ResourceRole[]>([]);
  loading = signal(false);

  // Filtros
  grantRoleFilter = signal<number | null>(null);

  // Diálogos y modales
  userDialog = signal(false);
  roleDialog = signal(false);
  resourceDialog = signal(false);
  assignDialog = signal(false);
  grantDialog = signal(false);

  // Formularios
  userForm = this.fb.group({
    username: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  roleForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    description: [''],
  });

  resourceForm = this.fb.group({
    method: ['GET', [Validators.required]],
    path: ['', [Validators.required]],
    description: [''],
  });

  assignForm = this.fb.group({
    user_id: [null as number | null, [Validators.required]],
    role_id: [null as number | null, [Validators.required]],
  });

  grantForm = this.fb.group({
    role_id: [null as number | null, [Validators.required]],
    resource_id: [null as number | null, [Validators.required]],
  });

  httpMethods = [
    { label: 'GET', value: 'GET' },
    { label: 'POST', value: 'POST' },
    { label: 'PUT', value: 'PUT' },
    { label: 'PATCH', value: 'PATCH' },
    { label: 'DELETE', value: 'DELETE' },
  ];

  ngOnInit(): void {
    this.loadAll();
  }

  loadAll(): void {
    this.loadUsers();
    this.loadRoles();
    this.loadResources();
    this.loadAssignments();
    this.loadGrants();
  }

  loadUsers(): void {
    this.loading.set(true);
    this.api.listUsers().subscribe({
      next: (data) => {
        this.users.set(data || []);
        this.loading.set(false);
      },
      error: () => {
        this.notify.error('Error al cargar usuarios');
        this.loading.set(false);
      },
    });
  }

  loadRoles(): void {
    this.api.listRoles().subscribe({
      next: (data) => this.roles.set(data || []),
      error: () => this.notify.error('Error al cargar roles'),
    });
  }

  loadResources(): void {
    this.api.listResources().subscribe({
      next: (data) => this.resources.set(data || []),
      error: () => this.notify.error('Error al cargar catálogo de recursos'),
    });
  }

  loadAssignments(): void {
    this.api.listAssignments().subscribe({
      next: (data) => this.assignments.set(data || []),
      error: () => this.notify.error('Error al cargar asignaciones de rol'),
    });
  }

  loadGrants(): void {
    const roleId = this.grantRoleFilter() ?? undefined;
    this.api.listGrants(roleId).subscribe({
      next: (data) => this.grants.set(data || []),
      error: () => this.notify.error('Error al cargar concesiones de permisos'),
    });
  }

  // ================= USERS ACTIONS =================
  openCreateUser(): void {
    this.userForm.reset();
    this.userDialog.set(true);
  }

  saveUser(): void {
    if (this.userForm.invalid) return;
    const val = this.userForm.value;
    this.api.createUser({
      username: val.username!,
      email: val.email!,
      password: val.password!,
      status: 'active',
    }).subscribe({
      next: () => {
        this.notify.success('Usuario creado exitosamente');
        this.userDialog.set(false);
        this.loadUsers();
      },
      error: (err) => this.notify.error(err?.error?.error || 'Error al crear usuario'),
    });
  }

  toggleUserStatus(user: User): void {
    this.confirm.confirm({
      message: `¿Desea cambiar el estado del usuario "${user.username}"?`,
      header: 'Confirmar acción',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.api.deactivateUser(user.id).subscribe({
          next: () => {
            this.notify.success('Estado de usuario modificado');
            this.loadUsers();
          },
          error: (err) => this.notify.error(err?.error?.error || 'No se pudo modificar el usuario'),
        });
      },
    });
  }

  // ================= ROLES ACTIONS =================
  openCreateRole(): void {
    this.roleForm.reset();
    this.roleDialog.set(true);
  }

  saveRole(): void {
    if (this.roleForm.invalid) return;
    const val = this.roleForm.value;
    this.api.createRole({
      name: val.name!,
      description: val.description || null,
      status: 'active',
    }).subscribe({
      next: () => {
        this.notify.success('Rol creado exitosamente');
        this.roleDialog.set(false);
        this.loadRoles();
      },
      error: (err) => this.notify.error(err?.error?.error || 'Error al crear rol'),
    });
  }

  // ================= RESOURCES ACTIONS =================
  openCreateResource(): void {
    this.resourceForm.reset({ method: 'GET', path: '', description: '' });
    this.resourceDialog.set(true);
  }

  saveResource(): void {
    if (this.resourceForm.invalid) return;
    const val = this.resourceForm.value;
    this.api.createResource({
      method: val.method!,
      path: val.path!,
      description: val.description || null,
      status: 'active',
    }).subscribe({
      next: () => {
        this.notify.success('Recurso registrado exitosamente');
        this.resourceDialog.set(false);
        this.loadResources();
      },
      error: (err) => this.notify.error(err?.error?.error || 'Error al registrar recurso'),
    });
  }

  // ================= ASSIGNMENTS ACTIONS =================
  openCreateAssign(): void {
    this.assignForm.reset();
    this.assignDialog.set(true);
  }

  saveAssignment(): void {
    if (this.assignForm.invalid) return;
    const val = this.assignForm.value;
    this.api.assignRole({
      user_id: val.user_id!,
      role_id: val.role_id!,
    }).subscribe({
      next: () => {
        this.notify.success('Rol asignado al usuario');
        this.assignDialog.set(false);
        this.loadAssignments();
      },
      error: (err) => this.notify.error(err?.error?.error || 'Error al asignar rol'),
    });
  }

  toggleAssignment(assign: RoleUser): void {
    const isDeactivating = assign.status === 'active';
    const action$ = isDeactivating
      ? this.api.deactivateAssignment(assign.id)
      : this.api.reactivateAssignment(assign.id);

    action$.subscribe({
      next: () => {
        this.notify.success(
          isDeactivating ? 'Asignación de rol revocada' : 'Asignación de rol reactivada'
        );
        this.loadAssignments();
      },
      error: (err) => this.notify.error(err?.error?.error || 'Error al cambiar estado'),
    });
  }

  // ================= GRANTS ACTIONS =================
  openCreateGrant(): void {
    this.grantForm.reset({
      role_id: this.grantRoleFilter() ?? null,
      resource_id: null,
    });
    this.grantDialog.set(true);
  }

  saveGrant(): void {
    if (this.grantForm.invalid) return;
    const val = this.grantForm.value;
    this.api.grantResource({
      role_id: val.role_id!,
      resource_id: val.resource_id!,
    }).subscribe({
      next: () => {
        this.notify.success('Permiso concedido al rol');
        this.grantDialog.set(false);
        this.loadGrants();
      },
      error: (err) => this.notify.error(err?.error?.error || 'Error al conceder permiso'),
    });
  }

  toggleGrant(grant: ResourceRole): void {
    const isRevoking = grant.status === 'active';
    const action$ = isRevoking
      ? this.api.deactivateGrant(grant.id)
      : this.api.reactivateGrant(grant.id);

    action$.subscribe({
      next: () => {
        this.notify.success(
          isRevoking ? 'Permiso revocado del rol' : 'Permiso reactivado en el rol'
        );
        this.loadGrants();
      },
      error: (err) => this.notify.error(err?.error?.error || 'Error al cambiar estado'),
    });
  }

  getMethodSeverity(method: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    switch (method.toUpperCase()) {
      case 'GET': return 'success';
      case 'POST': return 'info';
      case 'PUT': return 'warn';
      case 'PATCH': return 'warn';
      case 'DELETE': return 'danger';
      default: return 'secondary';
    }
  }
}
