// Learn more https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Exclude react-native-maps from web builds
if (process.env.EXPO_PUBLIC_PLATFORM === 'web') {
  config.resolver.blockList = [
    ...(config.resolver.blockList || []),
    /node_modules\/react-native-maps/,
  ];
}

module.exports = config;
