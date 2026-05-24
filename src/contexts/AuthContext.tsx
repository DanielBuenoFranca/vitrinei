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
  const [userStatus, setUserStatus] = useState<string | null>(null);

  const isAdmin = roles.includes('admin') || roles.includes('master');
  const isMaster = roles.includes('master');

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        const mustReset = session.user.user_metadata?.must_reset_password === true;
        setMustResetPassword(mustReset);
        
        // Fetch profile data including status
        const { data: profile } = await supabase
          .from('profiles')
          .select('display_name, status')
          .eq('user_id', session.user.id)
          .maybeSingle();

        if (profile) {
          setDisplayName(profile.display_name);
          setUserStatus(profile.status);
          
          // Check if user is deactivated
          if (profile.status === 'inactive' || profile.status === 'banned') {
            const msg = profile.status === 'inactive' 
              ? 'Sua conta está desativada. Entre em contato com o suporte.' 
              : 'Sua conta foi banida do sistema.';
            toast.error(msg);
            await supabase.auth.signOut();
            return;
          }
        }
        
        fetchRoles(session.user.id);
      } else {
        setRoles([]);
        setDisplayName(null);
        setUserStatus(null);
        setMustResetPassword(false);
      }
      setLoading(false);
    });

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        const mustReset = session.user.user_metadata?.must_reset_password === true;
        setMustResetPassword(mustReset);
        
        const { data: profile } = await supabase
          .from('profiles')
          .select('display_name, status')
          .eq('user_id', session.user.id)
          .maybeSingle();

        if (profile) {
          setDisplayName(profile.display_name);
          setUserStatus(profile.status);
          
          if (profile.status === 'inactive' || profile.status === 'banned') {
            await supabase.auth.signOut();
            setLoading(false);
            return;
          }
        }
        
        fetchRoles(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchRoles = async (userId: string) => {
    const { data } = await supabase.from('user_roles').select('role').eq('user_id', userId);
    if (data) {
      setRoles(data.map(r => r.role as AppRole));
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setRoles([]);
      setDisplayName(null);
      setMustResetPassword(false);
      setUserStatus(null);
      toast.success('Sessão encerrada com sucesso!');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Erro ao encerrar sessão.');
    }
  };

  const clearMustResetPassword = async () => {
    await supabase.auth.updateUser({ data: { must_reset_password: false } });
    setMustResetPassword(false);
  };

  const requireAuth = (action?: string): boolean => {
    if (user) return true;
    toast.info(action || 'Faça login para continuar', {
      action: { label: 'Entrar', onClick: () => { window.location.href = '/auth'; } },
    });
    return false;
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, isAdmin, isMaster, roles, displayName, mustResetPassword, signOut, requireAuth, clearMustResetPassword }}>
      {children}
    </AuthContext.Provider>
  );
};
