import { Money, Timestamps } from './api.model';

/** Tabla `settlements` — /api/liquidaciones. Listar, consultar y crear. */
export interface Settlement extends Timestamps {
  id: number;
  driver_id: number;
  date_from: string;
  date_to: string;
  generated_at: string;
  total_amount: Money;
  status: string;
  notes: string | null;
}

/** Pendiente de confirmar contra Swagger (POST /api/liquidaciones) antes de ISS-06. */
export interface SettlementPayload {
  driver_id: number;
  date_from: string;
  date_to: string;
  notes?: string | null;
}
