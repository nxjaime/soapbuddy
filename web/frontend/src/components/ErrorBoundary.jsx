import React from 'react';
import { AlertTriangle } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(_error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        console.error("Uncaught error:", error, errorInfo);
        this.setState({ error, errorInfo });
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="empty-state" style={{ padding: 'var(--spacing-2xl)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                    <AlertTriangle size={48} style={{ color: 'var(--color-error)', marginBottom: 'var(--spacing-md)' }} />
                    <h2 style={{ marginBottom: 'var(--spacing-sm)' }}>Something went wrong</h2>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--spacing-lg)' }}>
                        We encountered an unexpected error. Please try refreshing the page.
                    </p>
                    <button
                        className="btn btn-primary"
                        onClick={() => window.location.reload()}
                    >
                        Refresh Page
                    </button>
                    {this.state.error && (
                        <details style={{ marginTop: 'var(--spacing-lg)', textAlign: 'left', width: '100%', maxWidth: '600px', background: 'var(--bg-tertiary)', padding: 'var(--spacing-md)', borderRadius: 'var(--radius-md)', overflow: 'auto' }}>
                            <summary style={{ cursor: 'pointer', marginBottom: 'var(--spacing-sm)' }}>Error Details</summary>
                            <pre style={{ fontSize: '0.75rem', whiteSpace: 'pre-wrap' }}>
                                {this.state.error.toString()}
                                <br />
                                {this.state.errorInfo?.componentStack}
                            </pre>
                        </details>
                    )}
                </div>
            );
        }

        return this.props.children;
    }
}
