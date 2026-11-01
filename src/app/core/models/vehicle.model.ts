import { Status, Timestamps } from './api.model';

/** Tabla `vehicles` — /api/vehiculos */
export interface Vehicle extends Timestamps {
  id: number;
  name: string;
  description: string | null;
  company_id: number;
  vehicle_type_id: number | null;
  status: Status;
  company?: { id: number; tax_id: string; legal_name: string } | null;
  vehicle_type?: { id: number; name: string } | null;
}

export interface VehiclePayload {
  name: string;
  description?: string | null;
  company_id: number;
  vehicle_type_id?: number | null;
  status?: Status;
}
