/**
 * TypeFlow Plugin - Entry Point
 *
 * Registers the plugin with Framer SDK and initializes the React application.
 *
 * **Validates: Requirements 1.1, 1.2, 1.3, 9.3**
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import { framer } from 'framer-plugin';
import App from './App';
import './styles/global.css';

// Show the plugin UI in Framer
framer.showUI({
  width: 380,
  height: 520,
});

// Mount the React app
const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(React.createElement(App));
}

// Export for testing
export { App };
