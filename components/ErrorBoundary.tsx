import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends React.Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
        errorInfo: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error, errorInfo: null };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
        this.setState({ error, errorInfo });

        // Tentar limpar dados corrompidos se houver erro crítico
        if (error.message.includes("localStorage") || error.message.includes("JSON")) {
            localStorage.clear();
            window.location.reload();
        }
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
                    <div className="bg-white p-8 rounded-2xl shadow-xl max-w-2xl w-full border border-red-100">
                        <div className="flex items-center space-x-4 mb-6">
                            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-red-600">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <h1 className="text-2xl font-black text-slate-800">Ops! Algo correu mal.</h1>
                        </div>

                        <div className="bg-slate-900 rounded-xl p-6 overflow-auto mb-6">
                            <p className="text-red-400 font-mono text-sm mb-2 font-bold">Erro Detetado:</p>
                            <code className="text-white font-mono text-xs block whitespace-pre-wrap">
                                {this.state.error?.toString()}
                            </code>
                            {this.state.errorInfo && (
                                <details className="mt-4">
                                    <summary className="text-slate-500 text-xs cursor-pointer hover:text-white">Ver Detalhes Técnicos</summary>
                                    <pre className="text-slate-500 text-[10px] mt-2 whitespace-pre-wrap">
                                        {this.state.errorInfo.componentStack}
                                    </pre>
                                </details>
                            )}
                        </div>

                        <div className="flex space-x-4">
                            <button
                                onClick={() => { localStorage.clear(); window.location.reload(); }}
                                className="px-6 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors w-full"
                            >
                                🗑️ Limpar Dados e Reiniciar
                            </button>
                            <button
                                onClick={() => window.location.reload()}
                                className="px-6 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors w-full"
                            >
                                🔄 Tentar Novamente
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
