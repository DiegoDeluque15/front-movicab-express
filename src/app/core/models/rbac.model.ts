import { Status, Timestamps } from './api.model';

export interface User extends Timestamps {
  id: number;
  username: string;
  email: string;
  avatar?: string | null;
  status: Status;
}

export interface UserPayload {
  username: string;
  email: string;
  password?: string;
  avatar?: string | null;
  status?: Status;
}

export interface Role extends Timestamps {
  id: number;
  name: string;
  description?: string | null;
  status: Status;
}

export interface RolePayload {
  name: string;
  description?: string | null;
  status?: Status;
}

export interface Resource extends Timestamps {
  id: number;
  method: string;
  path: string;
  description?: string | null;
  status: Status;
}

export interface ResourcePayload {
  method: string;
  path: string;
  description?: string | null;
  status?: Status;
}

export interface RoleUser extends Timestamps {
  id: number;
  user_id: number;
  role_id: number;
  status: Status;
  user?: { id: number; username: string; email: string };
  role?: { id: number; name: string; description?: string };
}

export interface RoleUserPayload {
  user_id: number;
  role_id: number;
}

export interface ResourceRole extends Timestamps {
  id: number;
  role_id: number;
  resource_id: number;
  status: Status;
  role?: { id: number; name: string };
  resource?: { id: number; method: string; path: string; description?: string };
}

export interface ResourceRolePayload {
  role_id: number;
  resource_id: number;
}
