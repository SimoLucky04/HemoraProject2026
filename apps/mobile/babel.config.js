module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./src'],
          extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
          // Devono restare allineati ai "paths" di tsconfig.json.
          alias: {
            '@api': './src/api',
            '@components': './src/components',
            '@context': './src/context',
            '@data': './src/data',
            '@navigation': './src/navigation',
            '@screens': './src/screens',
            '@theme': './src/theme',
            '@utils': './src/utils',
            '@app-types': './src/types',
          },
        },
      ],
    ],
  };
};
