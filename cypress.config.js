const { defineConfig } = require("cypress");
const { spawn } = require("child_process");
let server;
let baseUrl;
module.exports = defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      require('@cypress/code-coverage/task')(on, config)
      on("task", {
        startServer() {
          return new Promise((resolve, reject) => {
            // Check if the server is already running
            if (server) {
              resolve(baseUrl);
            }
            server = spawn("node", ["-r", "nyc", "index-test.js"]);
            server.stdout.on("data", (data) => {
              console.log(data.toString()); // Log the output for debugging
              if (data.toString().includes("Demo project at:")) {
                const baseUrlPrefix = "Demo project at: ";
                const startIndex = data.toString().indexOf(baseUrlPrefix);
                if (startIndex !== -1) {
                  baseUrl = data.toString().substring(startIndex +
                    baseUrlPrefix.length).trim();
                  resolve(baseUrl);
                }
              }
            });
            server.stderr.on("data", (data) => {
              reject(data);
            });
          });
        },
        stopServer() {
          if (server) {
            server.kill();
          }
          return null;
        }
      });
      return config
    },
  }
});