import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";

const app = express();
app.use(cors()); // allow frontend to connect

// Optional: serve static files later
// app.use(express.static('public'));

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*", // or "http://localhost:5173" for Vite frontend
    methods: ["GET", "POST"]
  }
});

// Store connected players
const players = {};

io.on("connection", (socket) => {
    console.log("Player connected:", socket.id);

    // Initialize player in server memory
    players[socket.id] = {
        position: { x: 0, y: 0, z: 0 },
        rotation: { yaw: 0, pitch: 0 }
    };

    // Handle updates from this player
    socket.on("playerUpdate", (data) => {
        // Update server memory
        players[socket.id] = data;

        // Log player ID and position
        console.log(`Player ${socket.id} moved to:`, data.position);

        // Broadcast this player's data to all other clients
        socket.broadcast.emit("playerUpdate", {
            id: socket.id,
            position: data.position,
            rotation: data.rotation
        });
    });

    // Send initial data of other players to the new player
    socket.emit("currentPlayers", players);

    // Handle disconnect
    socket.on("disconnect", () => {
        console.log("Player disconnected:", socket.id);
        delete players[socket.id];
        // Inform other clients
        socket.broadcast.emit("playerDisconnected", socket.id);
    });
});

httpServer.listen(3000, () => {
    console.log("Socket.io server running on port 3000");
});
