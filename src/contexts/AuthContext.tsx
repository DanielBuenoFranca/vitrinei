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
  profile: any | null;
  mustResetPassword: boolean;
  signOut: () => Promise<void>;
  requireAuth: (action?: string) => boolean;
  clearMustResetPassword: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null, session: null, loading: true, isAdmin: false, isMaster: false, roles: [], displayName: null, profile: null, mustResetPassword: false,
  signOut: async () => {}, requireAuth: () => false, clearMustResetPassword: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
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
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', session.user.id)
          .maybeSingle();


        if (profileData) {
          setDisplayName(profileData.display_name);
          setUserStatus(profileData.status);
          setProfile(profileData);

          
          // Check if user is deactivated
          if (profileData.status === 'inactive' || profileData.status === 'banned') {
            const msg = profileData.status === 'inactive' 

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
        setProfile(null);
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
        
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', session.user.id)
          .maybeSingle();


        if (profileData) {
          setDisplayName(profileData.display_name);
          setUserStatus(profileData.status);
          setProfile(profileData);
          
          if (profileData.status === 'inactive' || profileData.status === 'banned') {

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
    console.log('AuthContext: signOut initiated');
    try {
      // 1. Limpeza imediata de estado local para resposta instantânea da UI
      setUser(null);
      setSession(null);
      setRoles([]);
      setDisplayName(null);
      setProfile(null);

      setMustResetPassword(false);
      setUserStatus(null);
      
      // 2. Limpeza de storage
      localStorage.clear();
      sessionStorage.clear();
      
      // 3. Chamada de signOut do Supabase (não aguardamos para não travar o redirecionamento)
      supabase.auth.signOut().catch(err => console.warn('Supabase signOut error (ignoring):', err));
      
      // 4. Redirecionamento forçado imediato
      console.log('AuthContext: Redirecting to /auth');
      window.location.replace('/auth');
      
      // Fallback de segurança caso window.location não funcione imediatamente
      setTimeout(() => {
        window.location.href = '/auth';
      }, 500);
    } catch (error) {
      console.error('Error during signOut process:', error);
      window.location.href = '/auth';
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
    <AuthContext.Provider value={{ user, session, loading, isAdmin, isMaster, roles, displayName, profile, mustResetPassword, signOut, requireAuth, clearMustResetPassword }}>
      {children}
    </AuthContext.Provider>
  );
};
