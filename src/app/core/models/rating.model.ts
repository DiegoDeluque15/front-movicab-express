import { Status, Timestamps } from './api.model';

/** Tabla `ratings` — /api/calificaciones. Una por trip; score de 1 a 5. */
export interface Rating extends Timestamps {
  id: number;
  trip_id: number;
  score: number;
  comment: string | null;
  status: Status;
}

export interface RatingPayload {
  trip_id: number;
  score: number;
  comment?: string | null;
}
