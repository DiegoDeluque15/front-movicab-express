/** Credenciales para inicio de sesión */
export interface LoginRequest {
  identifier: string;
  password: string;
}

/** Par de tokens devuelto por POST /api/sesion/login y /refresh */
export interface SessionTokens {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  refresh_expires_in: number;
}

/** Perfil público del usuario devuelto por GET /api/sesion/perfil */
export interface ProfileUser {
  id: number;
  username: string;
  email: string;
  avatar: string | null;
  status: string;
}

/** Permiso granular devuelto por GET /api/permisos */
export interface EffectivePermission {
  method: string;
  path: string;
  role_name?: string;
  description?: string;
}

/** Payload decodificado del JWT (claims) */
export interface JwtPayload {
  sub?: string;
  userId?: string | number;
  id?: number;
  email?: string;
  username?: string;
  role?: string;
  iat?: number;
  exp?: number;
}
