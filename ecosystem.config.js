module.exports = {
    apps: [
      {
        name: "booktrack-app",       // Name of your application
        script: "index.js",       // Path to your entry file (adjust as needed)
        instances: "max",             // This will run the app on all available CPU cores
        autorestart: true,            // Ensure the app is restarted if it crashes
        watch: true,                  // Watch files for changes and restart the app on change
        max_memory_restart: "1G",     // Restart the app if it exceeds 1GB of memory usage
        env: {
          NODE_ENV: "production",    // Environment variable for production
        },
      },
    ],
  };
  