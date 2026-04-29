// ErrorBoundary em nível de rota com auto-retry e botão manual.
import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = { children: React.ReactNode; routeKey?: string };
type State = { hasError: boolean; error?: Error; retries: number };

export class RouteErrorBoundary extends React.Component<Props, State> {
  private retryTimer: ReturnType<typeof setTimeout> | null = null;
  state: State = { hasError: false, retries: 0 };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[RouteErrorBoundary]", error, info?.componentStack);
    // Auto-retry uma vez (chunk load failure típico de novo deploy)
    if (this.state.retries < 1 && /chunk|loading|dynamic/i.test(error.message)) {
      this.retryTimer = setTimeout(() => this.handleRetry(), 800);
    }
  }

  componentDidUpdate(prev: Props) {
    if (prev.routeKey !== this.props.routeKey && this.state.hasError) {
      this.setState({ hasError: false, error: undefined, retries: 0 });
    }
  }

  componentWillUnmount() {
    if (this.retryTimer) clearTimeout(this.retryTimer);
  }

  handleRetry = () => {
    this.setState((s) => ({ hasError: false, error: undefined, retries: s.retries + 1 }));
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[60vh] flex items-center justify-center p-6">
          <div className="max-w-md w-full text-center space-y-4 p-6 rounded-xl border bg-card">
            <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Algo deu errado nesta tela</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {this.state.error?.message?.slice(0, 160) || "Erro inesperado."}
              </p>
            </div>
            <div className="flex gap-2 justify-center">
              <Button onClick={this.handleRetry} size="sm">
                <RefreshCw className="h-4 w-4 mr-1" /> Tentar novamente
              </Button>
              <Button variant="outline" size="sm" onClick={() => (window.location.href = "/")}>
                Ir para início
              </Button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
