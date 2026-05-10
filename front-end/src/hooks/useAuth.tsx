import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { authApi, setToken, removeToken, isAuthenticated } from "@/lib/api";

// Types
export type AppRole = "admin" | "coach" | "member";

export interface Profile {
  id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  address: string | null;
  date_of_birth: string | null;
  emergency_contact: string | null;
  emergency_phone: string | null;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  role: AppRole | null;
  loading: boolean;
  isLoading: boolean; // Alias for compatibility
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, firstName?: string, lastName?: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  role: null,
  loading: true,
  isLoading: true,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
  refreshUserData: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  // Vérifier l'authentification au démarrage
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      if (!isAuthenticated()) {
        setLoading(false);
        return;
      }

      const data = await authApi.me();
      
      setUser({ id: data.id, email: data.email });
      setProfile(data.profile);
      setRole(data.role as AppRole);
    } catch (error) {
      console.error("Auth check failed:", error);
      removeToken();
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    const data = await authApi.login({ email, password });
    
    setToken(data.token);
    setUser({ id: data.user.id, email: data.user.email });
    setProfile(data.user.profile);
    setRole(data.user.role as AppRole);
  };

  const signUp = async (email: string, password: string, firstName?: string, lastName?: string) => {
    const data = await authApi.register({ email, password, firstName, lastName });
    
    setToken(data.token);
    setUser({ id: data.user.id, email: data.user.email });
    setProfile(null);
    setRole("member");
  };

  const signOut = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      // Ignorer les erreurs de déconnexion
    }
    
    removeToken();
    setUser(null);
    setProfile(null);
    setRole(null);
  };

  const refreshUserData = async () => {
    if (!isAuthenticated()) return;
    
    try {
      const data = await authApi.me();
      setUser({ id: data.id, email: data.email });
      setProfile(data.profile);
      setRole(data.role as AppRole);
    } catch (error) {
      console.error("Failed to refresh user data:", error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        role,
        loading,
        isLoading: loading,
        signIn,
        signUp,
        signOut,
        refreshUserData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
