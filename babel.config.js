module.exports = function babelConfig(api) {
  api.cache(false);

  return {
    presets: ['module:@react-native/babel-preset'],
    plugins: [
      [
        'module:react-native-dotenv',
        {
          moduleName: '@env',
          path: '.env',
          safe: false,
          allowUndefined: false,
        },
      ],
      'react-native-reanimated/plugin',
    ],
  };
};
