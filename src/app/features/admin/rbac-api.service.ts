import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  User,
  UserPayload,
  Role,
  RolePayload,
  Resource,
  ResourcePayload,
  RoleUser,
  RoleUserPayload,
  ResourceRole,
  ResourceRolePayload,
} from '../../core/models/rbac.model';

@Injectable({ providedIn: 'root' })
export class RbacApiService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  // ================= USERS =================
  listUsers(): Observable<User[]> {
    return this.http
      .get<{ users: User[] }>(`${this.base}/usuarios`)
      .pipe(map((r) => r.users));
  }

  getUser(id: number): Observable<User> {
    return this.http
      .get<{ user: User }>(`${this.base}/usuarios/${id}`)
      .pipe(map((r) => r.user));
  }

  createUser(payload: UserPayload): Observable<User> {
    return this.http
      .post<{ user: User }>(`${this.base}/usuarios`, payload)
      .pipe(map((r) => r.user));
  }

  updateUser(id: number, payload: Partial<UserPayload>): Observable<User> {
    return this.http
      .patch<{ user: User }>(`${this.base}/usuarios/${id}`, payload)
      .pipe(map((r) => r.user));
  }

  deactivateUser(id: number): Observable<unknown> {
    return this.http.patch(`${this.base}/usuarios/${id}/deactivate`, {});
  }

  // ================= ROLES =================
  listRoles(): Observable<Role[]> {
    return this.http
      .get<{ roles: Role[] }>(`${this.base}/roles`)
      .pipe(map((r) => r.roles));
  }

  getRole(id: number): Observable<Role> {
    return this.http
      .get<{ role: Role }>(`${this.base}/roles/${id}`)
      .pipe(map((r) => r.role));
  }

  createRole(payload: RolePayload): Observable<Role> {
    return this.http
      .post<{ role: Role }>(`${this.base}/roles`, payload)
      .pipe(map((r) => r.role));
  }

  updateRole(id: number, payload: Partial<RolePayload>): Observable<Role> {
    return this.http
      .patch<{ role: Role }>(`${this.base}/roles/${id}`, payload)
      .pipe(map((r) => r.role));
  }

  deactivateRole(id: number): Observable<unknown> {
    return this.http.patch(`${this.base}/roles/${id}/deactivate`, {});
  }

  // ================= RECURSOS =================
  listResources(): Observable<Resource[]> {
    return this.http
      .get<{ resources: Resource[] }>(`${this.base}/recursos`)
      .pipe(map((r) => r.resources));
  }

  getResource(id: number): Observable<Resource> {
    return this.http
      .get<{ resource: Resource }>(`${this.base}/recursos/${id}`)
      .pipe(map((r) => r.resource));
  }

  createResource(payload: ResourcePayload): Observable<Resource> {
    return this.http
      .post<{ resource: Resource }>(`${this.base}/recursos`, payload)
      .pipe(map((r) => r.resource));
  }

  updateResource(id: number, payload: Partial<ResourcePayload>): Observable<Resource> {
    return this.http
      .patch<{ resource: Resource }>(`${this.base}/recursos/${id}`, payload)
      .pipe(map((r) => r.resource));
  }

  deactivateResource(id: number): Observable<unknown> {
    return this.http.patch(`${this.base}/recursos/${id}/deactivate`, {});
  }

  // ================= ASIGNACIONES ROL-USUARIO =================
  listAssignments(): Observable<RoleUser[]> {
    return this.http
      .get<{ assignments: RoleUser[] }>(`${this.base}/asignaciones-rol`)
      .pipe(map((r) => r.assignments));
  }

  assignRole(payload: RoleUserPayload): Observable<RoleUser> {
    return this.http
      .post<{ assignment: RoleUser }>(`${this.base}/asignaciones-rol`, payload)
      .pipe(map((r) => r.assignment));
  }

  deactivateAssignment(id: number): Observable<unknown> {
    return this.http.patch(`${this.base}/asignaciones-rol/${id}/deactivate`, {});
  }

  reactivateAssignment(id: number): Observable<unknown> {
    return this.http.patch(`${this.base}/asignaciones-rol/${id}/reactivate`, {});
  }

  // ================= CONCESIONES RECURSO-ROL =================
  listGrants(roleId?: number, resourceId?: number): Observable<ResourceRole[]> {
    let params = new HttpParams();
    if (roleId) params = params.set('role_id', roleId.toString());
    if (resourceId) params = params.set('resource_id', resourceId.toString());

    return this.http
      .get<{ grants: ResourceRole[] }>(`${this.base}/concesiones-rol`, { params })
      .pipe(map((r) => r.grants));
  }

  grantResource(payload: ResourceRolePayload): Observable<ResourceRole> {
    return this.http
      .post<{ grant: ResourceRole }>(`${this.base}/concesiones-rol`, payload)
      .pipe(map((r) => r.grant));
  }

  deactivateGrant(id: number): Observable<unknown> {
    return this.http.patch(`${this.base}/concesiones-rol/${id}/deactivate`, {});
  }

  reactivateGrant(id: number): Observable<unknown> {
    return this.http.patch(`${this.base}/concesiones-rol/${id}/reactivate`, {});
  }
}
