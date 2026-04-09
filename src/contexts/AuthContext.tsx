import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { User, Session } from '@supabase/supabase-js';

type AppRole = 'master' | 'admin' | 'moderator' | 'user' | 'client' | 'provider' | 'mixed';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  isMaster: boolean;
  roles: AppRole[];
  displayName: string | null;
  mustResetPassword: boolean;
  signOut: () => Promise<void>;
  requireAuth: (action?: string) => boolean;
  clearMustResetPassword: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null, session: null, loading: true, isAdmin: false, isMaster: false, roles: [], displayName: null, mustResetPassword: false,
  signOut: async () => {}, requireAuth: () => false, clearMustResetPassword: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [mustResetPassword, setMustResetPassword] = useState(false);

  const isAdmin = roles.includes('admin') || roles.includes('master');
  const isMaster = roles.includes('master');

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      if (session?.user) {
        const mustReset = session.user.user_metadata?.must_reset_password === true;
        setMustResetPassword(mustReset);
        setTimeout(() => {
          fetchRoles(session.user.id);
          fetchDisplayName(session.user.id);
        }, 0);
      } else {
        setRoles([]);
        setDisplayName(null);
        setMustResetPassword(false);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      if (session?.user) {
        const mustReset = session.user.user_metadata?.must_reset_password === true;
        setMustResetPassword(mustReset);
        fetchRoles(session.user.id);
        fetchDisplayName(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchRoles = async (userId: string) => {
    const { data } = await supabase.from('user_roles').select('role').eq('user_id', userId);
    if (data) {
      setRoles(data.map(r => r.role as AppRole));
    }
  };

  const fetchDisplayName = async (userId: string) => {
    const { data } = await supabase.from('profiles').select('display_name').eq('user_id', userId).maybeSingle();
    if (data) setDisplayName(data.display_name);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setRoles([]);
    setDisplayName(null);
  };

  const requireAuth = (action?: string): boolean => {
    if (user) return true;
    toast.info(action || 'Faça login para continuar', {
      action: { label: 'Entrar', onClick: () => { window.location.href = '/auth'; } },
    });
    return false;
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, isAdmin, isMaster, roles, displayName, signOut, requireAuth }}>
      {children}
    </AuthContext.Provider>
  );
};
