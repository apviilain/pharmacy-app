import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  ActivityIndicator,
  Text,
  TouchableOpacity,
} from 'react-native';
import { WebView } from 'react-native-webview';

interface PathkindWebViewProps {
  url: string;
}

const PathkindWebView: React.FC<PathkindWebViewProps> = ({ url }) => {
  const [hasError, setHasError] = useState(false);

  const renderLoading = () => (
    <View style={styles.centerContainer}>
      <ActivityIndicator size="large" color="#007AFF" />
      <Text style={styles.loadingText}>Loading Pathkind Labs...</Text>
    </View>
  );

  const renderError = (
    errorName?: string,
    errorCode?: number,
    errorDesc?: string,
  ) => (
    <View style={styles.centerContainer}>
      <Text style={styles.errorTitle}>Connection Error</Text>
      <Text style={styles.errorMessage}>
        {errorDesc ||
          'Failed to load the booking page. Please check your internet connection and try again.'}
      </Text>
      {errorCode && (
        <Text style={styles.errorText}>Error Code: {errorCode}</Text>
      )}
      <TouchableOpacity
        style={styles.retryButton}
        onPress={() => {
          setHasError(false);
        }}
      >
        <Text style={styles.retryButtonText}>Retry</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <WebView
        source={{ uri: url }}
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        sharedCookiesEnabled={true}
        thirdPartyCookiesEnabled={true}
        startInLoadingState={true}
        originWhitelist={['*']}
        mixedContentMode="always"
        setSupportMultipleWindows={false}
        allowsBackForwardNavigationGestures={true}
        allowsFullscreenVideo={true}
        scalesPageToFit={true}
        onError={syntheticEvent => {
          const { nativeEvent } = syntheticEvent;
          console.warn('WebView error: ', nativeEvent);
          setHasError(true);
        }}
        renderLoading={renderLoading}
        renderError={(errorName, errorCode, errorDesc) =>
          renderError(errorName, errorCode, errorDesc)
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webview: {
    flex: 1,
  },
  centerContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    zIndex: 1,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#333',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF3B30',
    marginBottom: 10,
  },
  errorMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  errorText: {
    fontSize: 12,
    color: '#999',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default PathkindWebView;
