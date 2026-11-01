export type Status = 'active' | 'inactive';
export type Money = number | string;

export interface ApiError {
  error: string;
  detail?: string;
}

export interface Timestamps {
  createdAt?: string;
  updatedAt?: string;
  created_at?: string;
  updated_at?: string;
}

/** DECIMAL llega como string ("50.00"): se normaliza en un solo lugar. */
export function toNumber(value: Money | null | undefined): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}
