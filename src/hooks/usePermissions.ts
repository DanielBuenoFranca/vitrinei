import { useAuth } from '@/contexts/AuthContext';
import { useConversion } from '@/contexts/ConversionContext';
import { toast } from 'sonner';
import {
  PERMISSIONS,
  PROFILE_LABELS,
  ROLE_LABELS,
  WRITE_PERMISSIONS,
  canDo,
  isWritePermission,
  resolveProfileType,
  type AppRole,
  type ProfileType,
} from '@/lib/permissions';

// Re-export from centralized lib so legacy imports keep working.
export { PERMISSIONS, PROFILE_LABELS, ROLE_LABELS, WRITE_PERMISSIONS };
export type { AppRole, ProfileType };

/**
 * usePermissions — single authorization hook.
 *
 * Combines role-based permission (PERMISSIONS matrix) with the
 * subscription paywall (ConversionContext.accessLevel). Use:
 *   - can(perm)              — role/profile check only
 *   - canWrite(perm)         — role + paywall ( = can && !blockedByPaywall )
 *   - requirePermission(...) — toast + return false on deny (role only)
 *   - requireWrite(...)      — toast + return false on deny (role + paywall)
 */
export function usePermissions() {
  const { user, roles, isMaster, isAdmin } = useAuth();
  const { accessLevel } = useConversion();

  const profileType = resolveProfileType(roles as AppRole[], !!user);
  const profileLabel = PROFILE_LABELS[profileType];

  // Paywall blocks writes when account is a visitor or lead (debt / not activated).
  // Master always bypasses paywall.
  const blockedByPaywall = !isMaster && (accessLevel === 'visitor' || accessLevel === 'lead');

  const can = (permission: string): boolean =>
    !!user && canDo(profileType, permission, isMaster);

  const canWrite = (permission: string): boolean => {
    if (!can(permission)) return false;
    if (blockedByPaywall && isWritePermission(permission)) return false;
    return true;
  };

  const requirePermission = (permission: string, featureName?: string): boolean => {
    if (can(permission)) return true;
    const allowed = PERMISSIONS[permission] || [];
    const neededProfiles = allowed.map((p) => PROFILE_LABELS[p]).join(', ');
    toast.error(`Acesso restrito${featureName ? ` a "${featureName}"` : ''}`, {
      description: `Perfil necessário: ${neededProfiles}. Seu perfil atual: ${profileLabel}.`,
      duration: 5000,
    });
    return false;
  };

  const requireWrite = (permission: string, featureName?: string): boolean => {
    if (!requirePermission(permission, featureName)) return false;
    if (blockedByPaywall && isWritePermission(permission)) {
      toast.error(`Conta em modo somente leitura${featureName ? ` — "${featureName}" bloqueado` : ''}`, {
        description: 'Sua assinatura está pendente. Regularize sua carteira para liberar a criação e edição de dados.',
        duration: 6000,
        action: { label: 'Ir para Carteira', onClick: () => { window.location.href = '/carteira'; } },
      });
      return false;
    }
    return true;
  };

  return {
    profileType,
    profileLabel,
    can,
    canWrite,
    requirePermission,
    requireWrite,
    blockedByPaywall,
    isMaster,
    isAdmin: isAdmin || isMaster,
    roles,
    ROLE_LABELS,
    PROFILE_LABELS,
  };
}
