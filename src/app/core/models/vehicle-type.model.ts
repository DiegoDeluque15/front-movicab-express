import { Status, Timestamps } from './api.model';

/** Tabla `vehicle_types` — /api/tipos-vehiculo */
export interface VehicleType extends Timestamps {
  id: number;
  name: string;
  description: string | null;
  status: Status;
}

export interface VehicleTypePayload {
  name: string;
  description?: string | null;
  status?: Status;
}
