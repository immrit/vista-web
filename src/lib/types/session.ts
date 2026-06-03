export interface DeviceInfo {
  browser?: string;
  os?: string;
  device?: string;
  userAgent?: string;
}

export interface ActiveSession {
  id: string;
  user_id: string;
  device_id?: string;
  session_token: string;
  device_info: DeviceInfo;
  ip_address: string | null;
  user_agent?: string | null;
  last_activity: string;
  created_at: string;
  is_active: boolean;
  is_current?: boolean;
  app_version: string | null;
  platform: string | null;
  fcm_token: string | null;
  location_city: string | null;
  location_country: string | null;
  location_region: string | null;
  device_model: string | null;
  network_type: string | null;
  device_os: string | null;
  location: string | null;
  expires_at: string;
}

export interface CreateSessionInput {
  user_id: string;
  session_token: string;
  device_info: DeviceInfo;
  ip_address?: string;
  app_version?: string;
  platform?: string;
  location?: string;
}



