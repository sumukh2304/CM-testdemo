import 'react-native-get-random-values';
import { registerRootComponent } from 'expo';
import { Platform } from 'react-native';

import App from './App';

// Import styles for web
if (Platform.OS === 'web') {
  // import './styles.css' // CSS import not needed for React Native
}

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);

