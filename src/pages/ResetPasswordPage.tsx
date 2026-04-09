import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Lock, AlertTriangle } from 'lucide-react';

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const { user, mustResetPassword, clearMustResetPassword } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Two modes: recovery link (hash) or forced reset (must_reset_password flag)
  const isRecoveryLink = window.location.hash.includes('type=recovery');
  const isForcedReset = !!user && mustResetPassword;

  useEffect(() => {
    if (!isRecoveryLink && !isForcedReset) {
      toast.error('Link de recuperação inválido');
      navigate('/auth');
    }
  }, [navigate, isRecoveryLink, isForcedReset]);

  const handleReset = async () => {
    if (password.length < 6) { toast.error('Senha deve ter no mínimo 6 caracteres'); return; }
    if (password !== confirmPassword) { toast.error('As senhas não coincidem'); return; }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password, data: { must_reset_password: false } });
    if (error) {
      toast.error(error.message);
    } else {
      clearMustResetPassword();
      toast.success('Senha atualizada com sucesso!');
      navigate('/');
    }
    setLoading(false);
  };

  if (!isRecoveryLink && !isForcedReset) return null;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            {isForcedReset && <AlertTriangle className="h-5 w-5 text-amber-500" />}
            Nova Senha
          </CardTitle>
          {isForcedReset && (
            <CardDescription className="text-amber-600">
              Sua senha foi redefinida pelo administrador. Por favor, crie uma nova senha para continuar.
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Nova Senha</Label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
              <Input type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres" className="pl-10" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Confirmar Senha</Label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
              <Input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Repita a senha" className="pl-10"
                onKeyDown={e => e.key === 'Enter' && handleReset()} />
            </div>
          </div>
          <Button className="w-full" onClick={handleReset} disabled={loading}>
            {loading ? 'Atualizando...' : 'Atualizar Senha'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPasswordPage;
