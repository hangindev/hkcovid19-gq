module.exports = {
  apps: [
    {
      name: "hkcovid19.gq",
      script: "./.nexus/build/index.js",
      env: {
        PORT: 3000,
        NODE_ENV: "production",
      },
    },
  ],
};
