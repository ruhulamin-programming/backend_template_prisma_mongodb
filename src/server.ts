import { Server } from "http";
import app from "./app";
import config from "./config";
import { setupWebSocketServer } from "./app/socket/socket.service";

async function main() {
  const server: Server = app.listen(config.port, () => {
    console.log("✅ Server is running on port", config.port);
    console.log(
      `📊 BullMQ Dashboard at http://localhost:${config.port}/admin/queues`,
    );
  });

  setupWebSocketServer(server);

  const exitHandler = () => {
    if (server) {
      server.close(() => {
        console.info("Server closed!");
      });
    }
    process.exit(1);
  };
  process.on("uncaughtException", (error) => {
    console.log(error);
    exitHandler();
  });

  process.on("unhandledRejection", (error) => {
    console.log(error);
    exitHandler();
  });
}

main();
