export interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: string;
  employee_id?: string | null;
  assigned_geofence_id?: string | null;
  permissions: Permission[];
  created_at: string;
  profile_image: string;
}

export interface Permission {
  id: number;
  permission: string;
  title: string;
  group: string;
}
