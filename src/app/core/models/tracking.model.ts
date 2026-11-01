import { Timestamps } from './api.model';

export interface TripLocation extends Timestamps {
  id?: number;
  trip_id: number;
  driver_id: number;
  lat: number;
  lng: number;
  heading?: number | null;
  speed?: number | null;
  recorded_at: string;
}

export interface RecordLocationPayload {
  lat: number;
  lng: number;
  heading?: number | null;
  speed?: number | null;
  recorded_at?: string;
}

export interface TrackingStatusResponse {
  trip_id: number;
  status: string;
  driver: {
    id: number;
    name: string;
    is_available: boolean;
  } | null;
  vehicle: {
    id: number;
    plate: string;
  } | null;
  last_location: {
    lat: number;
    lng: number;
    heading?: number | null;
    speed?: number | null;
    recorded_at: string;
  } | null;
  recent_history: Array<{
    lat: number;
    lng: number;
    heading?: number | null;
    speed?: number | null;
    recorded_at: string;
  }>;
  tracking_active: boolean;
}

/** Eventos emitidos por el servidor WebSocket `/ws/tracking` */
export interface WsLocationUpdatedEvent {
  event: 'location_updated';
  trip_id: number;
  driver_id: number;
  lat: number;
  lng: number;
  heading?: number | null;
  speed?: number | null;
  recorded_at: string;
}

export interface WsStatusChangedEvent {
  event: 'status_changed';
  trip_id: number;
  previous_status: string;
  new_status: string;
  timestamp: string;
}

export interface WsAuthenticatedEvent {
  event: 'authenticated';
  user: {
    id: number;
    username: string;
    roles: string[];
    driverId?: number;
    passengerId?: number;
  };
}

export interface WsSubscribedEvent {
  event: 'subscribed';
  trip_id: number;
  status: string;
  message: string;
}

export interface WsUnsubscribedEvent {
  event: 'unsubscribed';
  trip_id: number;
}

export interface WsLocationAckEvent {
  event: 'location_ack';
  location_id: number;
  timestamp: string;
}

export interface WsErrorEvent {
  event: 'error' | 'auth_failed';
  message: string;
}

