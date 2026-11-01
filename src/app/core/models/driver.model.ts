import { Status, Timestamps } from './api.model';

/** Tabla `drivers` — /api/conductores */
export interface Driver extends Timestamps {
  id: number;
  name: string;
  description: string | null;
  company_id: number | null;
  status: Status;
  company?: { id: number; tax_id: string; legal_name: string } | null;
}

export interface DriverPayload {
  name: string;
  description?: string | null;
  company_id?: number | null;
  status?: Status;
}
