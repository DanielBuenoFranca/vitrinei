/**
 * CENTRALIZED PERMISSION ARCHITECTURE
 * ===================================
 * Single source of truth for:
 *  - Role / profile types and labels
 *  - PERMISSIONS matrix (which profile can use which feature)
 *  - WRITE_PERMISSIONS set (which features are CRUD / state-changing
 *    and must be blocked when the account is in lead/paywall state)
 *
 * Any place in the app that needs to check authorization MUST import
 * from here — never duplicate the matrix in components.
 */

export type AppRole =
  | 'master'
  | 'admin'
  | 'moderator'
  | 'user'
  | 'client'
  | 'provider'
  | 'mixed';

export type ProfileType =
  | 'master'
  | 'admin'
  | 'provider'
  | 'client'
  | 'mixed'
  | 'visitor';

export const PROFILE_LABELS: Record<ProfileType, string> = {
  master: 'Administrador Geral',
  admin: 'Administrador',
  provider: 'Prestador Fornecedor',
  client: 'Cliente Comprador',
  mixed: 'Misto (Cliente + Prestador)',
  visitor: 'Visitante',
};

export const ROLE_LABELS: Record<AppRole, string> = {
  master: 'Administrador Geral',
  admin: 'Administrador',
  moderator: 'Moderador',
  user: 'Usuário',
  client: 'Cliente Comprador',
  provider: 'Prestador Fornecedor',
  mixed: 'Misto',
};

/**
 * PERMISSIONS matrix — which profile types may use each feature key.
 * Use dot-notation namespaces: <area>.<feature>
 */
export const PERMISSIONS: Record<string, ProfileType[]> = {
  // ── Admin area ────────────────────────────────────────────
  'admin.panel':       ['master', 'admin'],
  'admin.users':       ['master'],
  'admin.clear_data':  ['master'],
  'admin.crud':        ['master', 'admin'],
  'admin.import':      ['master', 'admin'],
  'admin.campaigns':   ['master', 'admin'],
  'admin.ai_governance': ['master'],

  // ── Provider area ─────────────────────────────────────────
  'provider.storefront': ['provider', 'mixed'],
  'provider.services':   ['provider', 'mixed'],
  'provider.products':   ['provider', 'mixed'],
  'provider.kits':       ['provider', 'mixed'],
  'provider.mei':        ['provider', 'mixed'],

  // ── Client area ───────────────────────────────────────────
  'client.purchase':  ['master', 'admin', 'client', 'mixed'],
  'client.hire':      ['master', 'admin', 'client', 'mixed'],
  'client.wallet':    ['master', 'admin', 'client', 'mixed', 'provider'],
  'client.referrals': ['master', 'admin', 'client', 'mixed', 'provider'],
};

/**
 * WRITE_PERMISSIONS — set of permission keys that perform a write
 * (create/update/delete) and therefore must be blocked when the user
 * is in a paywall / lead state (negative balance, not activated).
 *
 * Master always bypasses both permission AND paywall checks.
 */
export const WRITE_PERMISSIONS: ReadonlySet<string> = new Set([
  'admin.crud',
  'admin.users',
  'admin.clear_data',
  'admin.import',
  'admin.campaigns',
  'provider.storefront',
  'provider.services',
  'provider.products',
  'provider.kits',
  'client.purchase',
  'client.hire',
]);

export function isWritePermission(permission: string): boolean {
  return WRITE_PERMISSIONS.has(permission);
}

/**
 * Pure resolver — given a profile + permission key returns whether
 * the action is allowed BEFORE paywall is considered. Master is
 * allowed everywhere.
 */
export function canDo(
  profileType: ProfileType,
  permission: string,
  isMaster: boolean,
): boolean {
  if (isMaster) return true;
  const allowed = PERMISSIONS[permission];
  if (!allowed) return false;
  return allowed.includes(profileType);
}

/**
 * Resolve a profile type from a set of roles. Mirrors the legacy
 * fallback chain used in usePermissions.
 */
export function resolveProfileType(roles: AppRole[], hasUser: boolean): ProfileType {
  if (!hasUser) return 'visitor';
  if (roles.includes('master'))  return 'master';
  if (roles.includes('admin'))   return 'admin';
  if (roles.includes('mixed'))   return 'mixed';
  if (roles.includes('provider')) return 'provider';
  if (roles.includes('client'))  return 'client';
  return 'client';
}
