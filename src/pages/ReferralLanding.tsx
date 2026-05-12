import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useSubscriptionPlans } from '@/hooks/useSubscriptionPlans';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import {
  Gift, ShieldCheck, Wallet, TrendingUp, Users, Star,
  ArrowRight, CheckCircle, Sparkles, Zap, Store, ShoppingCart,
  Wrench, Shuffle, Crown, Heart
} from 'lucide-react';

const ReferralLanding = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { activePlans } = useSubscriptionPlans();
  const [referrerName, setReferrerName] = useState<string | null>(null);
  const [campaign, setCampaign] = useState<{ reward_buyer: number; reward_seller: number; reward_mixed_total: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!code) return;
    // Redirect direct to auth page as requested for better flow
    localStorage.setItem('ecomei_ref', code);
    navigate(`/auth?ref=${code}`, { replace: true });
  }, [code, navigate]);

  const handleSignup = () => {
    localStorage.setItem('ecomei_ref', code || '');
    navigate(`/auth?ref=${code}`);
  };

  const benefits = [
    { icon: Wallet, title: 'Cashback Imediato', desc: 'Receba cashback na sua primeira transação. Seu saldo começa a render desde o primeiro dia.' },
    { icon: Store, title: 'Vitrine Digital', desc: 'Monte sua loja online profissional em minutos, sem custo extra de hospedagem ou domínio.' },
    { icon: ShieldCheck, title: 'Segurança Total', desc: 'Transações protegidas, dados criptografados e carteira digital integrada.' },
    { icon: TrendingUp, title: 'Cresça Exponencialmente', desc: 'Ferramentas de IA para impulsionar vendas e encontrar os melhores prestadores.' },
    { icon: Users, title: 'Indique e Ganhe', desc: 'Ganhe bônus por cada amigo que se cadastrar. O programa de indicação nunca expira.' },
    { icon: Sparkles, title: 'IA Integrada', desc: 'Assistente inteligente que sugere combos, otimiza preços e automatiza seu negócio.' },
  ];

  const testimonials = [
    { name: 'Carla M.', role: 'Prestadora', text: 'Tripliquei meus clientes em 2 meses. A vitrine digital e o programa de indicação mudaram meu negócio!' },
    { name: 'Ricardo S.', role: 'Consumidor', text: 'Encontro tudo que preciso num só lugar, com cashback real. Já economizei mais de R$ 200.' },
    { name: 'Ana Paula L.', role: 'Mista', text: 'Compro e vendo no mesmo perfil. O bônus misto me deu fôlego financeiro pra crescer.' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Carregando convite...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* ── HERO ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-accent/10 pt-12 pb-16 px-4">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(var(--primary)/0.08),transparent_60%)]" />
        <div className="relative max-w-2xl mx-auto text-center space-y-6">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            {referrerName && (
              <Badge variant="secondary" className="mb-4 px-4 py-1.5 text-sm gap-1.5">
                <Gift className="w-4 h-4" />
                Convite de {referrerName}
              </Badge>
            )}
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-foreground leading-tight">
              Seu ecossistema de{' '}
              <span className="text-primary">compra, venda e serviços</span>{' '}
              começa aqui
            </h1>
          </motion.div>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
            className="text-lg text-muted-foreground max-w-xl mx-auto">
            {referrerName
              ? `${referrerName} acredita tanto na plataforma que quer dividir isso com você. Cadastre-se agora e ambos ganham!`
              : 'Junte-se a milhares de profissionais e consumidores que já transformaram sua forma de fazer negócios.'}
          </motion.p>

          {/* Reward highlight */}
          {campaign && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}
              className="flex flex-wrap justify-center gap-3">
              <div className="flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-2">
                <ShoppingCart className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold">Comprador: <span className="text-primary">R$ {campaign.reward_buyer} de bônus</span></span>
              </div>
              <div className="flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-2">
                <Wrench className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold">Prestador: <span className="text-primary">R$ {campaign.reward_seller} de bônus</span></span>
              </div>
              <div className="flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-2">
                <Shuffle className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold">Misto: <span className="text-primary">até R$ {campaign.reward_mixed_total} de bônus</span></span>
              </div>
            </motion.div>
          )}

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Button size="lg" className="text-lg px-8 py-6 gap-2 shadow-lg" onClick={handleSignup}>
              <Zap className="w-5 h-5" /> Criar Minha Conta Grátis
              <ArrowRight className="w-5 h-5" />
            </Button>
            <p className="text-xs text-muted-foreground mt-2">Cadastro rápido • Sem cartão de crédito</p>
          </motion.div>
        </div>
      </section>

      {/* ── SOCIAL PROOF COUNTER ── */}
      <section className="py-8 border-y bg-muted/30">
        <div className="max-w-4xl mx-auto grid grid-cols-3 gap-4 text-center px-4">
          {[
            { value: '2.500+', label: 'Profissionais ativos' },
            { value: 'R$ 180K+', label: 'Em cashback distribuído' },
            { value: '98%', label: 'Satisfação dos usuários' },
          ].map((stat, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * i }}>
              <p className="text-2xl md:text-3xl font-bold text-primary">{stat.value}</p>
              <p className="text-xs md:text-sm text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── BENEFITS ── */}
      <section className="py-14 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-10">
            Por que <span className="text-primary">milhares</span> já escolheram o Vitrinei?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {benefits.map((b, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 * i }}>
                <Card className="h-full hover:shadow-lg transition-shadow border-primary/10">
                  <CardContent className="p-5 space-y-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <b.icon className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="font-semibold text-foreground">{b.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{b.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-14 px-4 bg-muted/20">
        <div className="max-w-3xl mx-auto text-center space-y-10">
          <h2 className="text-2xl md:text-3xl font-bold">Como funciona em <span className="text-primary">3 passos</span></h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { step: '1', title: 'Cadastre-se', desc: 'Escolha seu perfil e plano. Leva menos de 2 minutos.', icon: Users },
              { step: '2', title: 'Ative sua conta', desc: 'Confirme seu e-mail e comece a explorar o ecossistema.', icon: CheckCircle },
              { step: '3', title: 'Lucre!', desc: 'Compre, venda e ganhe cashback em cada transação.', icon: TrendingUp },
            ].map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 * i }}
                className="flex flex-col items-center space-y-3 p-5">
                <div className="w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold shadow-md">
                  {s.step}
                </div>
                <h3 className="font-semibold text-foreground text-lg">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PLANS PREVIEW ── */}
      {activePlans.length > 0 && (
        <section className="py-14 px-4">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h2 className="text-2xl md:text-3xl font-bold">
              Escolha o plano ideal para <span className="text-primary">seu momento</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Todos os planos incluem carteira digital, programa de indicação e acesso à vitrine. 
              Comece pequeno e cresça no seu ritmo.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {activePlans.slice(0, 3).map((plan, i) => (
                <motion.div key={plan.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * i }}>
                  <Card className={`relative h-full transition-all hover:shadow-lg ${plan.popular ? 'border-primary shadow-md ring-1 ring-primary/20' : 'border-border'}`}>
                    {plan.popular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <Badge className="bg-primary text-primary-foreground px-3 py-0.5 text-xs gap-1">
                          <Crown className="w-3 h-3" /> Mais Popular
                        </Badge>
                      </div>
                    )}
                    <CardContent className="p-6 space-y-4 text-center">
                      <div className="text-3xl">{plan.badge}</div>
                      <h3 className="text-lg font-bold text-foreground">{plan.name}</h3>
                      <div>
                        <span className="text-3xl font-extrabold text-primary">R$ {plan.price}</span>
                        <span className="text-sm text-muted-foreground">/mês</span>
                      </div>
                      <div className="text-xs font-medium text-primary bg-primary/10 rounded-full px-3 py-1 inline-block">
                        {plan.discount}% de desconto em serviços
                      </div>
                      <ul className="text-left space-y-2 text-sm">
                        {plan.features.slice(0, 5).map((f, j) => (
                          <li key={j} className="flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                            <span className="text-muted-foreground">{f}</span>
                          </li>
                        ))}
                        {plan.features.length > 5 && (
                          <li className="text-xs text-primary font-medium">+ {plan.features.length - 5} benefícios</li>
                        )}
                      </ul>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── TESTIMONIALS ── */}
      <section className="py-14 px-4 bg-muted/20">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h2 className="text-2xl md:text-3xl font-bold">Quem usa, <span className="text-primary">recomenda</span></h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {testimonials.map((t, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * i }}>
                <Card className="h-full">
                  <CardContent className="p-5 space-y-3">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map(s => <Star key={s} className="w-4 h-4 fill-primary text-primary" />)}
                    </div>
                    <p className="text-sm text-muted-foreground italic">"{t.text}"</p>
                    <div className="flex items-center gap-2 pt-2 border-t">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                        {t.name[0]}
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-medium text-foreground">{t.name}</p>
                        <p className="text-xs text-muted-foreground">{t.role}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="py-16 px-4 text-center">
        <div className="max-w-xl mx-auto space-y-6">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}>
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Heart className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">
              {referrerName
                ? `${referrerName} já faz parte. E você?`
                : 'Não perca mais tempo. Comece agora.'}
            </h2>
            <p className="text-muted-foreground mt-3">
              O cashback de boas-vindas é por tempo limitado. Aproveite enquanto a campanha está ativa.
            </p>
          </motion.div>

          <Button size="lg" className="text-lg px-8 py-6 gap-2 shadow-lg" onClick={handleSignup}>
            <Zap className="w-5 h-5" /> Quero Fazer Parte
            <ArrowRight className="w-5 h-5" />
          </Button>

          {referrerName && (
            <p className="text-xs text-muted-foreground">
              Indicação válida de <strong>{referrerName}</strong> • Bônus aplicado automaticamente ao criar sua conta
            </p>
          )}
        </div>
      </section>
    </div>
  );
};

export default ReferralLanding;
