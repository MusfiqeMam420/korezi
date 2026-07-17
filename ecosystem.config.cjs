module.exports = {
  apps: [
    {
      name: "korezi-api",
      cwd: "/var/www/korezi/backend",
      script: "server.js",
      env: {
        NODE_ENV: "production",
        PORT: "5000",
      },
    },
    {
      name: "korezi-web",
      cwd: "/var/www/korezi/frontend",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3000",
      env: {
        NODE_ENV: "production",
      },
    },
    {
      name: "korezi-admin",
      cwd: "/var/www/korezi/admin",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3001",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
