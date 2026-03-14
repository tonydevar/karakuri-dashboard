import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(_error: Error, _info: ErrorInfo): void {
    // Error is displayed in render; no external logging
  }

  render(): ReactNode {
    if (this.state.hasError && this.state.error) {
      const { error } = this.state;
      return (
        <div style={{
          background: '#0D1117',
          color: '#E6EDF3',
          fontFamily: 'ui-monospace, monospace',
          fontSize: '13px',
          lineHeight: '1.6',
          padding: '32px',
          minHeight: '100vh',
          boxSizing: 'border-box',
        }}>
          <div style={{
            background: '#161B22',
            border: '1px solid #F85149',
            borderRadius: '6px',
            padding: '20px 24px',
            maxWidth: '900px',
          }}>
            <div style={{ color: '#F85149', fontWeight: 700, fontSize: '15px', marginBottom: '12px' }}>
              ⚠ React Render Error
            </div>
            <div style={{ color: '#E6EDF3', fontWeight: 600, marginBottom: '8px' }}>
              {error.message}
            </div>
            {error.stack && (
              <pre style={{
                color: '#8B949E',
                fontSize: '12px',
                overflowX: 'auto',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                margin: '0',
              }}>
                {error.stack}
              </pre>
            )}
            <div style={{ marginTop: '16px' }}>
              <button
                onClick={() => this.setState({ hasError: false, error: null })}
                style={{
                  background: '#388BFD',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '6px 14px',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  fontSize: '12px',
                }}
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
