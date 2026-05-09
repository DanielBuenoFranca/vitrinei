import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Loader2, X, CheckCircle2, AlertTriangle, ExternalLink } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export type JobStatus = 'running' | 'success' | 'error';

export interface JobState {
  id: string;
  label: string;
  step: string;
  percent: number;
  status: JobStatus;
  startedAt: number;
  finishedAt?: number;
  message?: string;
  route?: string;
}

export type ReportFn = (step: string, percent: number) => void;

interface BackgroundJobsContextType {
  jobs: JobState[];
  isRunning: (id: string) => boolean;
  getJob: (id: string) => JobState | undefined;
  startJob: <T>(opts: {
    id: string;
    label: string;
    route?: string;
    run: (report: ReportFn) => Promise<T>;
    successMessage?: (result: T) => string;
    errorMessage?: (err: any) => string;
  }) => Promise<T | undefined>;
  dismissJob: (id: string) => void;
}

const Ctx = createContext<BackgroundJobsContextType | null>(null);

const ensureNotificationPermission = async () => {
  if (typeof window === 'undefined' || !('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  try {
    const p = await Notification.requestPermission();
    return p === 'granted';
  } catch {
    return false;
  }
};

const pushNotify = (title: string, body: string) => {
  try {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      const n = new Notification(title, { body, icon: '/placeholder.svg' });
      setTimeout(() => n.close(), 8000);
    }
  } catch {
    /* noop */
  }
};

export const BackgroundJobsProvider = ({ children }: { children: React.ReactNode }) => {
  const [jobs, setJobs] = useState<JobState[]>([]);
  const runningRef = useRef<Set<string>>(new Set());

  const upsert = useCallback((id: string, patch: Partial<JobState>) => {
    setJobs(prev => {
      const i = prev.findIndex(j => j.id === id);
      if (i === -1) return prev;
      const next = [...prev];
      next[i] = { ...next[i], ...patch };
      return next;
    });
  }, []);

  const isRunning = useCallback((id: string) => runningRef.current.has(id), []);
  const getJob = useCallback((id: string) => jobs.find(j => j.id === id), [jobs]);

  const dismissJob = useCallback((id: string) => {
    setJobs(prev => prev.filter(j => j.id === id ? j.status === 'running' : true));
  }, []);

  const startJob: BackgroundJobsContextType['startJob'] = useCallback(async ({ id, label, route, run, successMessage, errorMessage }) => {
    if (runningRef.current.has(id)) {
      toast.info(`"${label}" já está em execução em segundo plano`);
      return;
    }
    runningRef.current.add(id);
    void ensureNotificationPermission();

    setJobs(prev => {
      const without = prev.filter(j => j.id !== id);
      return [
        ...without,
        { id, label, route, step: 'Iniciando...', percent: 0, status: 'running', startedAt: Date.now() },
      ];
    });

    const report: ReportFn = (step, percent) => upsert(id, { step, percent: Math.max(0, Math.min(100, percent)) });

    try {
      const result = await run(report);
      const msg = successMessage ? successMessage(result) : `${label} concluído`;
      upsert(id, { status: 'success', percent: 100, step: 'Concluído', finishedAt: Date.now(), message: msg });
      toast.success(msg);
      pushNotify('Vitrinei Connect', msg);
      return result;
    } catch (err: any) {
      const msg = errorMessage ? errorMessage(err) : `${label} falhou: ${err?.message || 'erro'}`;
      upsert(id, { status: 'error', step: 'Falhou', finishedAt: Date.now(), message: msg });
      toast.error(msg);
      pushNotify('Vitrinei Connect', msg);
    } finally {
      runningRef.current.delete(id);
    }
  }, [upsert]);

  const value = useMemo(() => ({ jobs, isRunning, getJob, startJob, dismissJob }), [jobs, isRunning, getJob, startJob, dismissJob]);

  return (
    <Ctx.Provider value={value}>
      {children}
      <BackgroundJobsWidget jobs={jobs} dismissJob={dismissJob} />
    </Ctx.Provider>
  );
};

export const useBackgroundJobs = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useBackgroundJobs must be used inside BackgroundJobsProvider');
  return ctx;
};

const BackgroundJobsWidget = ({ jobs, dismissJob }: { jobs: JobState[]; dismissJob: (id: string) => void }) => {
  if (jobs.length === 0) return null;
  return (
    <div className="fixed bottom-4 right-4 z-[60] w-[320px] max-w-[90vw] space-y-2 pointer-events-none">
      {jobs.map(j => (
        <div
          key={j.id}
          className="pointer-events-auto rounded-lg border bg-background/95 backdrop-blur shadow-lg p-3 text-xs"
        >
          <div className="flex items-center gap-2">
            {j.status === 'running' && <Loader2 className="h-3.5 w-3.5 animate-spin text-primary shrink-0" />}
            {j.status === 'success' && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />}
            {j.status === 'error' && <AlertTriangle className="h-3.5 w-3.5 text-destructive shrink-0" />}
            <span className="font-medium truncate flex-1">{j.label}</span>
            {j.status !== 'running' && (
              <Button size="icon" variant="ghost" className="h-5 w-5" onClick={() => dismissJob(j.id)}>
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
          <div className="mt-1 truncate text-muted-foreground">{j.message || j.step}</div>
          {j.status === 'running' && (
            <Progress value={j.percent} className="h-1.5 mt-2" />
          )}
        </div>
      ))}
    </div>
  );
};
