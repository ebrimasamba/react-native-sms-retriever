const path = require('path');
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

const root = path.resolve(__dirname, '..');

/**
 * Metro configuration
 * https://facebook.github.io/metro/docs/configuration
 *
 * @type {import('metro-config').MetroConfig}
 */
const defaultConfig = getDefaultConfig(__dirname);

// In this monorepo both the root (devDeps) and the example app have their own
// copy of react / react-native. Metro would otherwise bundle two React
// instances (the library resolves one, the app the other), which breaks hooks
// with "Invalid hook call / more than one copy of React". Force a single copy.
const dedupe = ['react', 'react-native'];

const config = {
  watchFolders: [root],
  resolver: {
    nodeModulesPaths: [
      path.resolve(__dirname, 'node_modules'),
      path.resolve(root, 'node_modules'),
    ],
    resolveRequest: (context, moduleName, platform) => {
      const match = dedupe.find(
        (m) => moduleName === m || moduleName.startsWith(m + '/')
      );
      if (match) {
        return {
          type: 'sourceFile',
          filePath: require.resolve(
            path.join(__dirname, 'node_modules', moduleName)
          ),
        };
      }
      return context.resolveRequest(context, moduleName, platform);
    },
  },
};

module.exports = mergeConfig(defaultConfig, config);
