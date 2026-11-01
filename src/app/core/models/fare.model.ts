import { Money, Status, Timestamps } from './api.model';

/** Tabla `fares` — /api/tarifas */
export interface Fare extends Timestamps {
  id: number;
  name: string;
  calculation_rule: string | null;
  base_value: Money;
  valid_from: string;
  valid_until: string;
  status: Status;
}

export interface FarePayload {
  name: string;
  calculation_rule?: string | null;
  base_value: number;
  valid_from: string;
  valid_until: string;
  status?: Status;
}
