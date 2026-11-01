import { Money, Timestamps } from './api.model';

/** Valores de dato definidos por el backend: se envían y comparan tal cual. */
export type TripStatus = 'solicitada' | 'aceptada' | 'en_curso' | 'cerrada' | 'cancelada';

/** Espejo de TRANSITIONS del backend; una transición inválida responde 409. */
export const TRIP_TRANSITIONS: Record<TripStatus, TripStatus[]> = {
  solicitada: ['aceptada', 'cancelada'],
  aceptada: ['en_curso', 'cancelada'],
  en_curso: ['cerrada', 'cancelada'],
  cerrada: [],
  cancelada: [],
};

export const TRIP_STATUS_LABEL: Record<TripStatus, string> = {
  solicitada: 'Solicitada',
  aceptada: 'Aceptada',
  en_curso: 'En curso',
  cerrada: 'Cerrada',
  cancelada: 'Cancelada',
};

/** Coordenadas geográficas estándar */
export interface GeoCoordinates {
  lat: number;
  lng: number;
  address?: string;
}

/** Modelo de cotización previa devuelta por POST /api/carreras/cotizar */
export interface TripQuotation {
  quote_token: string;
  origin_address?: string | null;
  origin_lat?: number;
  origin_lng?: number;
  destination_address?: string | null;
  destination_lat?: number;
  destination_lng?: number;
  distance_km?: number;
  duration_min?: number | null;
  estimated_price?: number;
  fare_rule_applied?: string;
  expires_at: string;
  fare: {
    id: number;
    name: string;
    base_value: number;
    price_per_km: number;
    minimum_fare: number;
  };
  route: {
    distance_km: number;
    duration_min: number;
    is_real_route: boolean;
    provider: string;
    notes?: string;
  };
  pricing: {
    base_value: number;
    price_per_km: number;
    distance_cost: number;
    minimum_fare: number;
    estimated_price: number;
  };
}

export interface QuoteRequestPayload {
  origin: GeoCoordinates;
  destination: GeoCoordinates;
  fare_id?: number;
}

export interface QuoteResponse {
  quotation: TripQuotation;
}

/** Resultado de asignación de conductor (automática o manual) */
export interface AssignmentResult {
  success: boolean;
  assigned: boolean;
  type: 'auto' | 'manual';
  driver_id?: number | null;
  vehicle_id?: number | null;
  shift_id?: number | null;
  driver_name?: string | null;
  vehicle_plate?: string | null;
  reason: string;
}

/** Payload para solicitar carrera: POST /api/carreras/solicitar */
export interface TripRequestPayload {
  quote_token?: string;
  origin?: GeoCoordinates;
  destination?: GeoCoordinates;
  fare_id?: number;
  notes?: string | null;
  passenger_id?: number;
}

export interface TripRequestResponse {
  message: string;
  trip: Trip;
  assignment: AssignmentResult;
}

/** Payload para cancelar carrera: PATCH /api/carreras/:id/cancelar */
export interface TripCancelPayload {
  reason?: string;
}

/** Tabla `trips` — /api/carreras */
export interface Trip extends Timestamps {
  id: number;
  passenger_id: number;
  shift_id: number | null;
  driver_id?: number | null;
  vehicle_id?: number | null;
  fare_id: number;
  origin_address?: string | null;
  origin_lat?: number | null;
  origin_lng?: number | null;
  destination_address?: string | null;
  destination_lat?: number | null;
  destination_lng?: number | null;
  estimated_distance_km?: number | null;
  estimated_duration_min?: number | null;
  estimated_price?: Money | null;
  final_price?: Money | null;
  fare_rule_applied?: string | null;
  assignment_type?: 'unassigned' | 'auto' | 'manual' | null;
  assignment_status?: 'pending' | 'assigned' | null;
  assignment_notes?: string | null;
  started_at: string | null;
  ended_at: string | null;
  total: Money | null;
  status: TripStatus;
  notes: string | null;
  settlement_id: number | null;
  passenger?: {
    id: number;
    name: string | null;
    phone?: string | null;
    email?: string | null;
    user_id?: number;
  } | null;
  shift?: { id: number; name: string } | null;
  driver?: {
    id: number;
    name: string | null;
    user_id?: number;
    current_lat?: number | null;
    current_lng?: number | null;
  } | null;
  vehicle?: {
    id: number;
    name: string | null;
    plate?: string | null;
  } | null;
  fare?: {
    id: number;
    name: string;
    base_value: Money;
    price_per_km?: Money;
    minimum_fare?: Money;
  } | null;
}

/** Flujo legacy / administrativo de creación: POST /api/carreras */
export interface TripCreatePayload {
  passenger_id: number;
  shift_id?: number | null;
  fare_id: number;
  driver_id?: number | null;
  vehicle_id?: number | null;
  notes?: string | null;
}

/** PATCH /:id solo modifica notes */
export interface TripUpdatePayload {
  notes: string | null;
}

/** PATCH /:id/estado: cambio controlado de estado */
export interface TripStatusPayload {
  status: TripStatus;
}
