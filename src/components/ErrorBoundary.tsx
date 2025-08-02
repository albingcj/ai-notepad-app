import React, { Component, ErrorInfo, ReactNode } from 'react';
import '../styles/ErrorBoundary.css';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }
  
  // S1: Catch errors in child components
  // Captures errors in the component tree
  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }
  
  // S2: Log error information
  // Logs detailed error information for debugging
  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({
      error,
      errorInfo
    });
    
    console.error('Application error:', error, errorInfo);
  }
  
  // S3: Render error UI
  // Displays a user-friendly error message
  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h1>Oops, something went wrong</h1>
          <p>We're sorry, but an error has occurred in the application.</p>
          <div className="error-details">
            <h2>Error Details:</h2>
            <p>{this.state.error && this.state.error.toString()}</p>
            <div className="stack-trace">
              {this.state.errorInfo && this.state.errorInfo.componentStack}
            </div>
          </div>
          <button 
            className="reload-button"
            onClick={() => window.location.reload()}
          >
            Reload Application
          </button>
        </div>
      );
    }
    
    return this.props.children;
  }
}

export default ErrorBoundary;
