import React from 'react';
import { ErrorFallbackScreen } from '../components/ErrorFallbackScreen';
import { logger } from '../utils/logger';

type Props = {
  children: React.ReactNode;
};

type State = {
  hasError: boolean;
  errorMessage: string;
};

export class AppErrorBoundary extends React.Component<Props, State> {
  state: State = {
    hasError: false,
    errorMessage: '',
  };

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      errorMessage: error.message || 'Unexpected error',
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error('React render error boundary triggered', {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      errorMessage: '',
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <ErrorFallbackScreen
          title="We ran into a screen error"
          message={this.state.errorMessage}
          onRetry={this.handleRetry}
        />
      );
    }

    return this.props.children;
  }
}
