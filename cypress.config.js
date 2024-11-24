const { defineConfig } = require("cypress");
const { spawn } = require("child_process");
let server;
let baseUrl;

module.exports = defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      require('@cypress/code-coverage/task')(on, config);

      on("task", {
        startServer() {
          return new Promise((resolve, reject) => {
            if (server) {
              console.log("Server is already running at:", baseUrl);
              resolve(baseUrl);  // If server is already running, just resolve the baseUrl
              return;
            }

            console.log("Starting the server...");

            // Spawn a new server instance
            server = spawn("node", ["-r", "nyc", "index-test.js"]);

            server.stdout.on("data", (data) => {
              const output = data.toString();
              console.log("Server stdout:", output);
              if (output.includes("BookTrack app running at:")) {  // Updated string
                const baseUrlPrefix = "BookTrack app running at: ";
                const startIndex = output.indexOf(baseUrlPrefix);
                if (startIndex !== -1) {
                  baseUrl = output.substring(startIndex + baseUrlPrefix.length).trim();
                  console.log("Server started at:", baseUrl);
                  resolve(baseUrl);  // Resolve once the server URL is extracted
                }
              }
            });

            server.stderr.on("data", (data) => {
              console.error("Server error:", data.toString());
              reject(data);  // Reject if any error occurs
            });

            server.on('exit', (code) => {
              console.log(`Server stopped with exit code: ${code}`);
              server = null;  // Ensure that the server variable is reset
            });
          });
        },

        stopServer() {
          if (server) {
            console.log("Stopping the server...");
            server.kill();  // Terminate the server process
            server = null;  // Reset the server variable after stopping it
          }
          return null;
        }
      });

      return config;
    },
  }
});
