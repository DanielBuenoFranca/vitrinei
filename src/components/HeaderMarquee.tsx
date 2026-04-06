import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

const HeaderMarquee = () => {
  const [messages, setMessages] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);

  const fetchMessages = async () => {
    const { data } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'header_marquee')
      .maybeSingle();
    if (data?.value && typeof data.value === 'object' && 'messages' in (data.value as any)) {
      setMessages((data.value as any).messages || []);
    }
  };

  useEffect(() => {
    fetchMessages();

    const channel = supabase
      .channel('header-marquee-rt')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'site_settings',
        filter: 'key=eq.header_marquee',
      }, () => {
        fetchMessages();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  if (messages.length === 0) return null;

  const fullText = messages.join('   •   ');

  return (
    <div
      ref={containerRef}
      className="flex-1 mx-3 overflow-hidden relative h-full flex items-center"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-card/80 to-transparent z-10 pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-card/80 to-transparent z-10 pointer-events-none" />
      <div
        className="whitespace-nowrap text-xs text-muted-foreground animate-marquee"
        style={{ animationPlayState: isPaused ? 'paused' : 'running' }}
      >
        <span>{fullText}</span>
        <span className="ml-16">{fullText}</span>
      </div>
    </div>
  );
};

export default HeaderMarquee;
