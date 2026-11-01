import { Status, Timestamps } from './api.model';

/** Tabla `shifts` — /api/turnos */
export interface Shift extends Timestamps {
  id: number;
  name: string;
  description: string | null;
  driver_id: number;
  vehicle_id: number;
  status: Status;
  driver?: { id: number; name: string } | null;
  vehicle?: { id: number; name: string; company_id: number } | null;
}

export interface ShiftPayload {
  name: string;
  description?: string | null;
  driver_id: number;
  vehicle_id: number;
  status?: Status;
}
