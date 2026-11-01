import { Trip } from './trip.model';

export interface AvailableShiftResource {
  shift_id: number;
  shift_name: string;
  driver: {
    id: number;
    name: string;
    current_lat?: number | null;
    current_lng?: number | null;
  };
  vehicle: {
    id: number;
    plate: string;
  };
}

export interface AvailableResourcesResponse {
  available_shifts: AvailableShiftResource[];
}

export interface ManualAssignPayload {
  driver_id: number;
  vehicle_id: number;
  notes?: string;
}

export interface ManualAssignResponse {
  message: string;
  result: {
    success: boolean;
    assigned: boolean;
    type: 'manual';
    driver_id: number;
    vehicle_id: number;
    shift_id: number;
    driver_name: string;
    vehicle_plate: string;
    reason: string;
  };
  trip: Trip;
}

