/**
 * @format
 */

import { AppRegistry } from 'react-native';
import notifee from '@notifee/react-native';
import App from './App';
import { name as appName } from './app.json';
import { onBackgroundEvent } from './src/services/notificationHandler';

// Register background notification handler BEFORE AppRegistry
// This ensures killed-state notification actions (Join Now / Clear) work
notifee.onBackgroundEvent(onBackgroundEvent);

AppRegistry.registerComponent(appName, () => App);
