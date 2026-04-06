import { type ReactNode } from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PermissionGateProps {
  permission: string;
  featureName?: string;
  children: ReactNode;
  /** If true, show a blocked placeholder instead of hiding */
  showBlocked?: boolean;
  /** Render as read-only overlay instead of completely hiding */
  readOnly?: boolean;
}

export function PermissionGate({ permission, featureName, children, showBlocked = true, readOnly = false }: PermissionGateProps) {
  const { can, requirePermission, PROFILE_LABELS, profileType } = usePermissions();

  if (can(permission)) {
    return <>{children}</>;
  }

  if (!showBlocked) return null;

  if (readOnly) {
    return (
      <div className="relative">
        <div className="pointer-events-none opacity-50 select-none">
          {children}
        </div>
        <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-[1px] rounded-lg">
          <Button
            variant="outline"
            size="sm"
            className="gap-2 shadow-md"
            onClick={() => requirePermission(permission, featureName)}
          >
            <Lock className="h-4 w-4" />
            {featureName || 'Recurso bloqueado'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center p-6 border border-dashed rounded-lg bg-muted/30">
      <div className="text-center space-y-2">
        <Lock className="h-8 w-8 mx-auto text-muted-foreground" />
        <p className="text-sm font-medium text-muted-foreground">
          {featureName || 'Recurso restrito'}
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => requirePermission(permission, featureName)}
        >
          Ver requisitos de acesso
        </Button>
      </div>
    </div>
  );
}
