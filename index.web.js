import { AppRegistry } from 'react-native';
import App from './App';

// Ensure mobile viewport meta for correct phone rendering
if (typeof document !== 'undefined') {
  let meta = document.querySelector('meta[name="viewport"]');
  const desired = 'width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover';
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('name', 'viewport');
    meta.setAttribute('content', desired);
    document.head.appendChild(meta);
  } else if (!meta.getAttribute('content') || meta.getAttribute('content') !== desired) {
    meta.setAttribute('content', desired);
  }
}

// Register the app for web
AppRegistry.registerComponent('main', () => App);

// Run the app
AppRegistry.runApplication('main', {
  initialProps: {},
  rootTag: document.getElementById('root'),
});
