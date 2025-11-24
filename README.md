# The Outlands: An experimental 3D multiplayer in-browser FPS game

This is a **simple experimental 3D FPS project** built using **Vite** and **Three.js**, with plans to expand into full **multiplayer** using **Socket.io** and later a backend database powered by **MySQL**.

![First screenshot](public/images/screenshots/1.jpg)

The goal of the project is to explore:
- First-person movement in the browser  
- 3D rendering using Three.js  
- Basic networking with Socket.io 
- Synchronizing players in a shared world  
- Persistent data using MySQL (future update)

This project is work-in-progress, experimental and open for contributions.

## Instructions

### 1. Install node.js
If you haven't installed node yet, get it here: https://nodejs.org/en/download for Linux and Windows.

### 2. Clone the repository
```bash
git clone https://github.com/DustinVII/TheOutlandsGame.git
```

### 3. Install dependencies for Vite and Socket.io
```bash
cd TheOutlandsGame
npm install
```
This installs all frontend dependencies listed in `TheOutlandsGame/package.json`, including Vite, Three.js and any other required libraries.
```bash
cd TheOutlandsGame/server
npm install
```
This installs all server dependencies listed in `TheOutlandsGame/server/package.json` including socket.io.

### 4. Set configurations
Rename `config.json.example` to `config.json` and make adjustments
```bash
cd TheOutlandsGame/src/
cp config.json.example config.json
nano config.json
```
Only make adjustments if you're not running the app locally. If you run it on a webserver, change `localhost` to the server's IP.
```json
{
    "APP_NAME": "The Outlands",
    "SERVER_URL": "localhost",
    "SERVER_PORT": 3000,
    "FRONTEND_PORT": 5173
}
```
If you use a firewall, make sure the ports are open.

### 5. Run the servers
First run the Node.js server. Go to `/TheOutlandsGame` then do:
```bash
node server/server.js #to start the Node server
```

Then start the Vite development server locally:
```bash
npm run dev #to start the development server
```
Vite will start a local development server and give you a URL (usually `http://localhost:5173`) to open the game in your browser.

#### For online testing on web servers (optional)
Run this command instead to start it on an online server. `0.0.0.0` allows all IP addresses to access the server as each client will have a different IP.
```bash
npm run dev -- --host 0.0.0.0 #to start the development server online
```



## Tech stack
- **Vite** – lightning-fast dev environment
- **Three.js** – 3D rendering
- **Ammo.js** – Physics
- **Socket.io** – multiplayer networking
- **MySQL** (future) – persistent backend for player data, stats and world info

## Planned features

✔️ FPS camera movement

✔️ Basic world rendering

✔️ Multiplayer player syncing (Socket.io)

⏳ Make collisions, physics and gravity work

⏳ Allow players to be able to shoot each other using a weapon

⏳ Simple character models for players

⏳ Chat system or simple voice indicators

⏳ MySQL integration for account/world data

⏳ Game lobby or room system

This project will grow as I experiment with new ideas.

## Feedback and contribution

I welcome feedback, suggestions and improvements.
Anyone is free to contribute, fork the project or create a pull request.

If you're interested in collaborating, let me know what you think. I’m happy to work together to push the project further.