import React from 'react';
import ReactDOM from 'react-dom/client';

type ErrorBoundaryState = { hasError: boolean; message: string };

class ErrorBoundary extends React.Component<React.PropsWithChildren, ErrorBoundaryState> {
  constructor(props: React.PropsWithChildren) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, message: error?.message || 'Unknown runtime error' };
  }

  componentDidCatch(error: Error): void {
    console.error('App runtime error:', error);
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '100vh', background: '#020617', color: '#f8fafc', padding: 24, fontFamily: 'Inter, sans-serif' }}>
          <h1 style={{ fontSize: 24, marginBottom: 12 }}>Shop'reneur Runtime Error</h1>
          <p style={{ opacity: 0.9 }}>The app hit an error during startup instead of rendering normally.</p>
          <pre style={{ marginTop: 16, background: '#0f172a', padding: 12, borderRadius: 8, overflowX: 'auto' }}>
            {this.state.message}
          </pre>
        </div>
      );
    }

    return this.props.children;
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);

function renderBootError(message: string): void {
  root.render(
    <React.StrictMode>
      <div style={{ minHeight: '100vh', background: '#020617', color: '#f8fafc', padding: 24, fontFamily: 'Inter, sans-serif' }}>
        <h1 style={{ fontSize: 24, marginBottom: 12 }}>Shop'reneur Startup Error</h1>
        <p style={{ opacity: 0.9 }}>The application failed while loading modules.</p>
        <pre style={{ marginTop: 16, background: '#0f172a', padding: 12, borderRadius: 8, overflowX: 'auto' }}>
          {message}
        </pre>
      </div>
    </React.StrictMode>
  );
}

root.render(
  <React.StrictMode>
    <div style={{ minHeight: '100vh', background: '#020617', color: '#f8fafc', padding: 24, fontFamily: 'Inter, sans-serif' }}>
      Loading Shop'reneur...
    </div>
  </React.StrictMode>
);

void import('./App')
  .then(({ default: App }) => {
    root.render(
      <React.StrictMode>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </React.StrictMode>
    );
  })
  .catch((error: unknown) => {
    const message = error instanceof Error ? `${error.message}\n\n${error.stack || ''}` : String(error);
    console.error('App module import failed:', error);
    renderBootError(message);
  });