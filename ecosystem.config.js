module.exports = {
  apps: [
    {
      name: "globevisitors-api",
      script: "index.js",
      cwd: "/var/www/api.globevisitors.com/backend",
      instances: "max",       // Run in cluster mode using all CPU cores
      exec_mode: "cluster",   // Cluster mode for zero-downtime reloads
      watch: false,           // Do not watch in production
      max_memory_restart: "1G", // Restart if it uses too much memory
      env_production: {
        NODE_ENV: "production",
        PORT: 3001
      }
    }
  ]
};
