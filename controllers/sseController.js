const { pool } = require("../config/database");

// Store active client connections
const clients = new Map();

// Client cleanup interval (every 30 minutes)
const CLEANUP_INTERVAL = 30 * 60 * 1000;

class SSEController {
  // Initialize SSE for a client
  static initSSE(req, res) {
    const userId = req.user.userId;
    const clientId = `${userId}-${Date.now()}`;

    // Set SSE headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no"); // For Nginx proxy buffering

    // Send initial connection message
    res.write(
      `data: ${JSON.stringify({
        type: "connection",
        message: "SSE connection established",
      })}\n\n`
    );

    // Store client connection
    clients.set(clientId, {
      res,
      userId,
      isAdmin: req.user.role === "admin",
      lastActivity: Date.now(),
    });

    // Handle client disconnect
    req.on("close", () => {
      clients.delete(clientId);
      console.log(`SSE Client disconnected: ${clientId}`);
    });

    console.log(
      `SSE Client connected: ${clientId}, userId: ${userId}, isAdmin: ${
        req.user.role === "admin"
      }`
    );
  }

  // Send notification to specific user
  static sendToUser(userId, data) {
    let sent = false;
    for (const [clientId, client] of clients.entries()) {
      if (client.userId === userId) {
        try {
          client.res.write(`data: ${JSON.stringify(data)}\n\n`);
          client.lastActivity = Date.now();
          sent = true;
        } catch (error) {
          console.error(`Error sending SSE to client ${clientId}:`, error);
          clients.delete(clientId);
        }
      }
    }
    return sent;
  }

  // Send notification to all admins
  static sendToAdmins(data) {
    let sentCount = 0;
    for (const [clientId, client] of clients.entries()) {
      if (client.isAdmin) {
        try {
          client.res.write(`data: ${JSON.stringify(data)}\n\n`);
          client.lastActivity = Date.now();
          sentCount++;
        } catch (error) {
          console.error(
            `Error sending SSE to admin client ${clientId}:`,
            error
          );
          clients.delete(clientId);
        }
      }
    }
    return sentCount;
  }

  // Send notification to all connected clients
  static broadcast(data) {
    let sentCount = 0;
    for (const [clientId, client] of clients.entries()) {
      try {
        client.res.write(`data: ${JSON.stringify(data)}\n\n`);
        client.lastActivity = Date.now();
        sentCount++;
      } catch (error) {
        console.error(`Error broadcasting SSE to client ${clientId}:`, error);
        clients.delete(clientId);
      }
    }
    return sentCount;
  }

  // Send keep-alive ping to all clients
  static sendPing() {
    for (const [clientId, client] of clients.entries()) {
      try {
        client.res.write(`: ping ${Date.now()}\n\n`); // Comment line for keep-alive
        client.lastActivity = Date.now();
      } catch (error) {
        console.error(`Error sending ping to client ${clientId}:`, error);
        clients.delete(clientId);
      }
    }
  }

  // Clean up inactive connections
  static cleanupInactiveConnections() {
    const now = Date.now();
    const inactivityThreshold = 2 * 60 * 60 * 1000; // 2 hours

    for (const [clientId, client] of clients.entries()) {
      if (now - client.lastActivity > inactivityThreshold) {
        try {
          client.res.end();
        } catch (error) {
          console.error(`Error closing inactive client ${clientId}:`, error);
        } finally {
          clients.delete(clientId);
          console.log(`Removed inactive SSE client: ${clientId}`);
        }
      }
    }
  }

  // Get connected clients count
  static getConnectedClientsCount() {
    return {
      total: clients.size,
      users: Array.from(clients.values()).filter((client) => !client.isAdmin)
        .length,
      admins: Array.from(clients.values()).filter((client) => client.isAdmin)
        .length,
    };
  }
}

// Setup cleanup interval
setInterval(() => {
  SSEController.cleanupInactiveConnections();
}, CLEANUP_INTERVAL);

// Setup regular ping to keep connections alive
setInterval(() => {
  SSEController.sendPing();
}, 45000); // Send ping every 45 seconds

module.exports = SSEController;
