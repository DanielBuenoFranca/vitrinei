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
    let isActive = true;

    // Hydrates profile + roles for a given user. Runs OUTSIDE the auth callback
    // (deferred via setTimeout) to avoid the well-known Supabase deadlock where
    // calling supabase from inside onAuthStateChange blocks the auth lock and
    // freezes subsequent requests — that was the root cause of "master roles
    // not loaded" in the preview iframe.
    const hydrate = async (currentUser: User | null) => {
      if (!currentUser) {
        if (!isActive) return;
        setRoles([]);
        setDisplayName(null);
        setProfile(null);
        setUserStatus(null);
        setMustResetPassword(false);
        setLoading(false);
        return;
      }

      const mustReset = currentUser.user_metadata?.must_reset_password === true;
      if (isActive) setMustResetPassword(mustReset);

      try {
        const [profileRes, rolesRes] = await Promise.all([
          supabase.from('profiles').select('*').eq('user_id', currentUser.id).maybeSingle(),
          supabase.from('user_roles').select('role').eq('user_id', currentUser.id),
        ]);

        if (!isActive) return;

        if (profileRes.data) {
          setDisplayName(profileRes.data.display_name);
          setUserStatus(profileRes.data.status);
          setProfile(profileRes.data);

          if (profileRes.data.status === 'inactive' || profileRes.data.status === 'banned') {
            const msg = profileRes.data.status === 'inactive'
              ? 'Sua conta está desativada. Entre em contato com o suporte.'
              : 'Sua conta foi banida do sistema.';
            toast.error(msg);
            // Defer signOut so we don't recurse into the auth callback synchronously.
            setTimeout(() => { supabase.auth.signOut(); }, 0);
            setLoading(false);
            return;
          }
        }

        if (rolesRes.data && rolesRes.data.length > 0) {
          const userRoles = rolesRes.data.map(r => r.role as AppRole);
          console.log('AuthContext: Roles fetched for', currentUser.id, userRoles);
          setRoles(userRoles);
        } else if (rolesRes.error) {
          console.error('AuthContext: Error fetching roles:', rolesRes.error);
          setRoles([]);
          toast.error('Erro ao carregar permissões: ' + rolesRes.error.message);
        } else {
          console.log('AuthContext: No roles found for', currentUser.id);
          setRoles([]);
          // One retry after 1.5s in case of transient timing (e.g. trigger still inserting role)
          setTimeout(async () => {
            if (!isActive) return;
            const retryRes = await supabase.from('user_roles').select('role').eq('user_id', currentUser.id);
            if (isActive && retryRes.data && retryRes.data.length > 0) {
              const retryRoles = retryRes.data.map(r => r.role as AppRole);
              setRoles(retryRoles);
              console.log('AuthContext: Roles recovered on retry:', retryRoles);
            }
          }, 1500);
        }
      } catch (err) {
        console.error('AuthContext: hydrate error', err);
      } finally {
        if (isActive) setLoading(false);
      }
    };

    // 1) Subscribe FIRST — never await/use supabase inside this callback.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      console.log('AuthContext: onAuthStateChange event:', event, 'Session:', !!newSession);

      if (event === 'SIGNED_OUT') {
        setSession(null);
        setUser(null);
        setRoles([]);
        setDisplayName(null);
        setProfile(null);
        setMustResetPassword(false);
        setUserStatus(null);
        setLoading(false);
        return;
      }

      // Synchronous state updates only here.
      setSession(newSession);
      setUser(newSession?.user ?? null);

      // Defer ALL Supabase calls to escape the auth lock.
      if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        setLoading(true);
        setTimeout(() => { hydrate(newSession?.user ?? null); }, 0);
      }
    });

    // 2) THEN check existing session (covers cases where INITIAL_SESSION doesn't fire fast enough).
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      console.log('AuthContext: Initial session check', !!initialSession);
      setSession(initialSession);
      setUser(initialSession?.user ?? null);
      setTimeout(() => { hydrate(initialSession?.user ?? null); }, 0);
    }).catch((err) => {
      console.error('AuthContext: Error getting initial session', err);
      setLoading(false);
    });

    return () => {
      isActive = false;
      subscription.unsubscribe();
    };
  }, []);

  const fetchRoles = async (userId: string) => {
    const { data } = await supabase.from('user_roles').select('role').eq('user_id', userId);
    if (data) {
      setRoles(data.map(r => r.role as AppRole));
      return data.map(r => r.role as AppRole);
    }
    return [];
  };

  const signOut = async () => {
    console.log('AuthContext: signOut initiated');
    try {
      setUser(null);
      setSession(null);
      setRoles([]);
      setDisplayName(null);
      setProfile(null);
      setMustResetPassword(false);
      setUserStatus(null);
      
      localStorage.clear();
      sessionStorage.clear();
      
      document.cookie.split(";").forEach((c) => {
        document.cookie = c
          .replace(/^ +/, "")
          .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });
      
      supabase.auth.signOut().catch(err => console.warn('Supabase signOut error (ignoring):', err));
      window.location.replace('/auth');
      
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