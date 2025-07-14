// Perfil de usuario público
export interface User {
  id: string;
  full_name?: string;
  avatar_url?: string;
  email?: string;
}

// Usuario de autenticación de Supabase
export interface AuthUser {
  id: string;
  email: string;
  user_metadata?: {
    full_name?: string;
    avatar_url?: string;
  };
}
