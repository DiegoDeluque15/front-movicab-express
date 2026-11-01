/** Roles disponibles en el sistema */
export type UserRole = 'admin' | 'operator' | 'driver';

/** Representación del usuario autenticado en sesión */
export interface AuthUser {
    id: string;
    email: string;
    role: UserRole;
}
