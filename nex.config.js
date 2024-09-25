// next.config.js

/** @type {import("next").NextConfig} */
module.exports = {
    webpack(config) {
      config.experiments = { ...config.experiments, topLevelAwait: true };
      config.externals = [...config.externals, 'hnswlib-node'];
      return config;
    },
  };
  