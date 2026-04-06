import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export type AppRole = 'master' | 'admin' | 'moderator' | 'user' | 'client' | 'provider' | 'mixed';

export type ProfileType = 'master' | 'admin' | 'provider' | 'client' | 'mixed' | 'visitor';

const PROFILE_LABELS: Record<ProfileType, string> = {
  master: 'Administrador Geral',
  admin: 'Administrador',
  provider: 'Prestador Fornecedor',
  client: 'Cliente Comprador',
  mixed: 'Misto (Cliente + Prestador)',
  visitor: 'Visitante',
};

const ROLE_LABELS: Record<AppRole, string> = {
  master: 'Administrador Geral',
  admin: 'Administrador',
  moderator: 'Moderador',
  user: 'Usuário',
  client: 'Cliente Comprador',
  provider: 'Prestador Fornecedor',
  mixed: 'Misto',
};

/**
 * Permission matrix: which profile can access which features
 */
const PERMISSIONS: Record<string, ProfileType[]> = {
  // Admin features
  'admin.panel': ['master', 'admin'],
  'admin.users': ['master'],
  'admin.clear_data': ['master'],
  'admin.crud': ['master', 'admin'],

  // Provider features
  'provider.storefront': ['master', 'admin', 'provider', 'mixed'],
  'provider.services': ['master', 'admin', 'provider', 'mixed'],
  'provider.products': ['master', 'admin', 'provider', 'mixed'],
  'provider.mei': ['master', 'admin', 'provider', 'mixed'],

  // Client features
  'client.purchase': ['master', 'admin', 'client', 'mixed'],
  'client.hire': ['master', 'admin', 'client', 'mixed'],
  'client.wallet': ['master', 'admin', 'client', 'mixed', 'provider'],
  'client.referrals': ['master', 'admin', 'client', 'mixed', 'provider'],

  // Import
  'admin.import': ['master', 'admin'],
};

export function usePermissions() {
  const { user, roles, isMaster, isAdmin } = useAuth();

  const getProfileType = (): ProfileType => {
    if (!user) return 'visitor';
    if (roles.includes('master')) return 'master';
    if (roles.includes('admin')) return 'admin';
    if (roles.includes('mixed')) return 'mixed';
    if (roles.includes('provider')) return 'provider';
    if (roles.includes('client')) return 'client';
    // fallback: 'user' role → client
    return 'client';
  };

  const profileType = getProfileType();
  const profileLabel = PROFILE_LABELS[profileType];

  const can = (permission: string): boolean => {
    if (!user) return false;
    if (isMaster) return true; // master can do everything
    const allowed = PERMISSIONS[permission];
    if (!allowed) return false;
    return allowed.includes(profileType);
  };

  const requirePermission = (permission: string, featureName?: string): boolean => {
    if (can(permission)) return true;
    const allowed = PERMISSIONS[permission] || [];
    const neededProfiles = allowed.map(p => PROFILE_LABELS[p]).join(', ');
    toast.error(
      `Acesso restrito${featureName ? ` a "${featureName}"` : ''}`,
      {
        description: `Perfil necessário: ${neededProfiles}. Seu perfil atual: ${profileLabel}.`,
        duration: 5000,
      }
    );
    return false;
  };

  return {
    profileType,
    profileLabel,
    can,
    requirePermission,
    isMaster,
    isAdmin: isAdmin || isMaster,
    roles,
    ROLE_LABELS,
    PROFILE_LABELS,
  };
}
