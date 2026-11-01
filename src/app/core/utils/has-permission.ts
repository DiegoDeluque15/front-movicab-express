import { EffectivePermission } from '../auth/auth.model';

/**
 * Devuelve `true` si la lista de permisos efectivos contiene
 * al menos uno que coincida con el método y la ruta dados.
 *
 * La comparación de ruta usa coincidencia exacta o prefijo de segmento
 * para cubrir rutas parametrizadas (/api/pasajeros coincide con /api/pasajeros/:id).
 *
 * @param permissions  Lista de EffectivePermission del SessionStore
 * @param method       Método HTTP en mayúsculas: 'GET', 'POST', etc.
 * @param path         Ruta del recurso, p. ej. '/api/pasajeros'
 */
export function hasPermission(
  permissions: EffectivePermission[],
  method: string,
  path: string,
): boolean {
  const m = method.toUpperCase();
  return permissions.some((p) => {
    if (p.method.toUpperCase() !== m) return false;
    // Coincidencia exacta
    if (p.path === path) return true;
    // Coincidencia de prefijo de segmento: /api/pasajeros cubre /api/pasajeros/:id
    if (p.path.startsWith(path + '/') || p.path.startsWith(path + '/:')) return true;
    return false;
  });
}
