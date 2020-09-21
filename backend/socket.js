const WebSocket = require("websocket").server;

const socket = (server) => {
  return new WebSocket({
    httpServer: server,
    autoAcceptConnections: true,
  });
};

module.exports = socket;
