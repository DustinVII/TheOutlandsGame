import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";

//Get config values
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
// __dirname replacement in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Build absolute path to config.json
const configPath = path.join(__dirname, "..", "src", "config.json");
// Read and parse JSON
const raw = fs.readFileSync(configPath, "utf8");
const config = JSON.parse(raw);

console.log("App Name:", config.APP_NAME);


const app = express();
app.use(cors()); // allow frontend to connect

// Optional: serve static files later
// app.use(express.static('public'));

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: (config.SERVER_URL != "localhost") ? "*" : "localhost:" + config.FRONTEND_PORT, // or "http://localhost:5173" for Vite frontend
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


if (config.SERVER_URL != "localhost") {
    httpServer.listen(config.SERVER_PORT,"0.0.0.0", () => { //Do httpServer.listen(3000,"0.0.0.0", () => { for public servers
        console.log("Socket.io server running publicly on http://"+config.SERVER_URL+":"+config.SERVER_PORT);
    });
} else {
    httpServer.listen(config.SERVER_PORT, () => {
        console.log("Socket.io server running locally on http://localhost:"+config.SERVER_PORT);
    });
}
