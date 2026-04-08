module.exports = {
  apps: [
    {
      name: "pde_be_app",
      script: "index.js",
      instances: "max",
      exec_mode: "cluster",
      env: {
        NODE_ENV: "production",
        PORT: 3000
      }
    }
  ]
};
