/**
 * @format
 */

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import { onBackgroundEvent } from './src/services/notificationHandler';

try {
  const notifee = require('@notifee/react-native').default;
  notifee?.onBackgroundEvent?.(onBackgroundEvent);
} catch (error) {
  if (__DEV__) {
    console.warn(
      '[index] Notifee background handler not registered:',
      error,
    );
  }
}

AppRegistry.registerComponent(appName, () => App);
