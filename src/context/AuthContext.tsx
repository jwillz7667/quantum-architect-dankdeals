// src/context/AuthContext.tsx
import { createContext } from 'react';
import type { User, Session, AuthError } from '@supabase/supabase-js';

export interface AuthResult {
  error: AuthError | null;
  rateLimited?: boolean;
  lockedUntil?: number;
}

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: { is_admin?: boolean } | null;
  signUp: (
    email: string,
    password: string,
    firstName?: string,
    lastName?: string
  ) => Promise<AuthResult>;
  signIn: (
    email: string,
    password: string
  ) => Promise<AuthResult>;
  signOut: () => Promise<{ error: AuthError | null }>;
  loading: boolean;
  csrfToken: string;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined); 