import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Lock, AlertTriangle, Check, X, ShieldCheck } from 'lucide-react';

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
      toast.error('Link de recuperação inválido ou expirado');
      navigate('/auth');
    }
  }, [navigate, isRecoveryLink, isForcedReset]);

  const passwordStrength = {
    length: password.length >= 8,
    hasUpper: /[A-Z]/.test(password),
    hasLower: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[^A-Za-z0-9]/.test(password),
  };

  const isPasswordStrong = Object.values(passwordStrength).every(Boolean);

  const handleReset = async () => {
    if (password.length < 8) {
      toast.error('A senha deve ter no mínimo 8 caracteres');
      return;
    }
    if (!isPasswordStrong) {
      toast.warning('A senha não atende a todos os requisitos de segurança');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }
    
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ 
        password, 
        data: { must_reset_password: false } 
      });
      
      if (error) {
        toast.error(error.message);
      } else {
        clearMustResetPassword();
        toast.success('Senha atualizada com sucesso!');
        navigate('/');
      }
    } catch (err) {
      toast.error('Erro ao atualizar senha');
    } finally {
      setLoading(false);
    }
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
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nova Senha</Label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                <Input type="password" value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres" className="pl-10" />
              </div>
              
              {/* Password Strength Indicators */}
              <div className="p-3 bg-muted/50 rounded-lg space-y-2 border">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 mb-1">
                  <ShieldCheck className="w-3 h-3 text-primary" /> Diretrizes de Segurança
                </p>
                <div className="grid grid-cols-1 gap-1.5">
                  <div className={`flex items-center gap-2 text-[10px] ${passwordStrength.length ? 'text-green-600 font-medium' : 'text-muted-foreground'}`}>
                    {passwordStrength.length ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />} Mínimo de 8 caracteres
                  </div>
                  <div className={`flex items-center gap-2 text-[10px] ${passwordStrength.hasUpper ? 'text-green-600 font-medium' : 'text-muted-foreground'}`}>
                    {passwordStrength.hasUpper ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />} Pelo menos uma letra maiúscula
                  </div>
                  <div className={`flex items-center gap-2 text-[10px] ${passwordStrength.hasLower ? 'text-green-600 font-medium' : 'text-muted-foreground'}`}>
                    {passwordStrength.hasLower ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />} Pelo menos uma letra minúscula
                  </div>
                  <div className={`flex items-center gap-2 text-[10px] ${passwordStrength.hasNumber ? 'text-green-600 font-medium' : 'text-muted-foreground'}`}>
                    {passwordStrength.hasNumber ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />} Pelo menos um número
                  </div>
                  <div className={`flex items-center gap-2 text-[10px] ${passwordStrength.hasSpecial ? 'text-green-600 font-medium' : 'text-muted-foreground'}`}>
                    {passwordStrength.hasSpecial ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />} Pelo menos um caractere especial
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Confirmar Nova Senha</Label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                <Input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Repita a senha" className="pl-10"
                  onKeyDown={e => e.key === 'Enter' && handleReset()} />
              </div>
            </div>
            
            <Button 
              className="w-full" 
              onClick={handleReset} 
              disabled={loading || !isPasswordStrong || password !== confirmPassword || !password}
            >
              {loading ? 'Atualizando...' : 'Atualizar Senha'}
            </Button>
            <Button variant="ghost" className="w-full text-xs" onClick={() => navigate('/auth')}>
              Cancelar e voltar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPasswordPage;
