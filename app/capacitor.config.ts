import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.portpal.app',
  appName: 'PORTPAL',
  webDir: 'dist',
  server: {
    // During development, load from Vite dev server for hot reload
    // Comment this out for production builds
    // url: 'http://YOUR_LOCAL_IP:5173',
    // cleartext: true,
    androidScheme: 'https',
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 2000,
      backgroundColor: '#1e3a5f',
      showSpinner: false,
    },
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#1e3a5f',
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true,
    },
  },
};

export default config;
