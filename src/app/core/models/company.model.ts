import { Status, Timestamps } from './api.model';

/** Tabla `companies` — /api/empresas */
export interface Company extends Timestamps {
  id: number;
  tax_id: string;
  legal_name: string;
  primary_contact: string | null;
  status: Status;
}

export interface CompanyPayload {
  tax_id: string;
  legal_name: string;
  primary_contact?: string | null;
  status?: Status;
}
