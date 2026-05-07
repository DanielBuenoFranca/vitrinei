import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Copy, Timer, MessageCircle, Send, Mail, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  link: string;
  expiresAt?: string | null;
}

const DEFAULT_TEMPLATE =
  '🚀 Conheça o Vitrinei! Eu uso e recomendo. Cadastre-se pelo meu link e ganhe bônus exclusivo:';

export const ShareReferralModal = ({ open, onOpenChange, link, expiresAt }: Props) => {
  const [template, setTemplate] = useState(DEFAULT_TEMPLATE);
  const [remaining, setRemaining] = useState('');

  useEffect(() => {
    supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'referral_share_template')
      .maybeSingle()
      .then(({ data }) => {
        const v: any = (data as any)?.value;
        if (v?.text) setTemplate(v.text);
      });
  }, []);

  useEffect(() => {
    if (!expiresAt) return;
    const tick = () => {
      const ms = new Date(expiresAt).getTime() - Date.now();
      if (ms <= 0) { setRemaining('Expirado'); return; }
      const h = Math.floor(ms / 3600000);
      const m = Math.floor((ms % 3600000) / 60000);
      const s = Math.floor((ms % 60000) / 1000);
      setRemaining(`${h}h ${m}m ${s}s`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  const message = `${template}\n${link}`;
  const enc = encodeURIComponent(message);
  const encLink = encodeURIComponent(link);

  const copy = async () => {
    await navigator.clipboard.writeText(link);
    toast.success('Link copiado!');
  };

  const channels = [
    { label: 'WhatsApp', icon: MessageCircle, url: `https://wa.me/?text=${enc}`, color: 'bg-[#25D366] hover:bg-[#20bd5a] text-white' },
    { label: 'Telegram', icon: Send, url: `https://t.me/share/url?url=${encLink}&text=${enc}`, color: 'bg-[#0088cc] hover:bg-[#0077b3] text-white' },
    { label: 'Facebook', icon: Share2, url: `https://www.facebook.com/sharer/sharer.php?u=${encLink}`, color: 'bg-[#1877F2] hover:bg-[#145fc7] text-white' },
    { label: 'X / Twitter', icon: Share2, url: `https://twitter.com/intent/tweet?text=${enc}`, color: 'bg-foreground text-background hover:opacity-90' },
    { label: 'E-mail', icon: Mail, url: `mailto:?subject=${encodeURIComponent('Convite Vitrinei')}&body=${enc}`, color: 'bg-muted hover:bg-muted/80 text-foreground' },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-primary" /> Compartilhe seu convite 24h
          </DialogTitle>
          <DialogDescription>
            Quanto antes seu convidado se cadastrar, mais rápido você libera bonificações.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {expiresAt && (
            <div className="flex items-center justify-center gap-2 text-sm font-semibold text-primary bg-primary/10 rounded-lg py-2">
              <Timer className="w-4 h-4" /> Expira em {remaining}
            </div>
          )}

          <div className="flex gap-2">
            <Input value={link} readOnly className="text-xs font-mono" />
            <Button variant="outline" size="icon" onClick={copy}><Copy className="w-4 h-4" /></Button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {channels.map((c) => (
              <Button
                key={c.label}
                className={`gap-2 ${c.color}`}
                onClick={() => window.open(c.url, '_blank')}
              >
                <c.icon className="w-4 h-4" /> {c.label}
              </Button>
            ))}
          </div>

          <p className="text-[10px] text-muted-foreground text-center">
            Mensagem padrão configurável pelo administrador em <strong>Configurações → Campanha</strong>.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareReferralModal;
