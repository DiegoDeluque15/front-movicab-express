import { Money, Timestamps } from './api.model';

/** Tabla `payments` — /api/pagos. Inmutable: listar, consultar y crear. Referencia polimórfica sin FK. */
export interface Payment extends Timestamps {
  id: number;
  reference_type: string;
  reference_id: number;
  payment_method: string;
  amount: Money;
  paid_at: string;
  status: string;
}

export interface PaymentPayload {
  reference_type?: string;
  reference_id: number;
  payment_method: string;
  amount: number;
  paid_at?: string;
}
