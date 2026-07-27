"use client";

import { Component, ErrorInfo, ReactNode } from "react";

interface State {
  hasError: boolean;
  error: Error | null;
}

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-background">
          <div className="max-w-md w-full bg-card border border-border rounded-2xl p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-destructive/10 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-destructive"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-foreground mb-2">
              حدث خطأ غير متوقع
            </h1>
            <p className="text-sm text-muted-foreground mb-6">
              {this.state.error?.message || "يرجى إعادة تحميل الصفحة"}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => this.setState({ hasError: false, error: null })}
                className="flex-1 py-3 px-4 bg-muted text-muted-foreground rounded-xl font-medium hover:bg-muted/80 transition-colors"
              >
                إعادة المحاولة
              </button>
              <button
                onClick={() => window.location.reload()}
                className="flex-1 py-3 px-4 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors"
              >
                إعادة تحميل
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
