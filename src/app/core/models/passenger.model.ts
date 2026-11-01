import { Status, Timestamps } from './api.model';

/** Tabla `passengers` — /api/pasajeros. El backend devuelve el hash de password: la UI no lo modela. */
export interface Passenger extends Timestamps {
  id: number;
  name: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  user_id?: number | null;
  status: Status;
}

export interface PassengerPayload {
  name: string;
  address?: string | null;
  phone: string;
  email: string;
  password?: string;
  status?: Status;
}

/** Payload para registro público de pasajeros: POST /api/pasajeros/registro */
export interface PassengerRegisterPayload {
  name: string;
  email: string;
  password: string;
  phone: string;
  address?: string;
}

/** Respuesta de registro público de pasajeros */
export interface PassengerRegisterResponse {
  message: string;
  passenger: {
    id: number;
    name: string;
    email: string;
    phone: string;
    address: string;
    status: string;
    user_id: number;
    username: string;
  };
}
