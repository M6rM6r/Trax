export interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: string;
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
