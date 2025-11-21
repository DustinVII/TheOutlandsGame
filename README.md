# The Outlands: An experimental 3D multiplayer in-browser FPS game

This is a **simple experimental 3D FPS project** built using **Vite** and **Three.js**, with plans to expand into full **multiplayer** using **Socket.io** and later a backend database powered by **MySQL**.

The goal of the project is to explore:
- First-person movement in the browser  
- 3D rendering using Three.js  
- Basic networking with Socket.io (coming soon)  
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
Then cd to the folder:
```bash
cd TheOutlandsGame
```

### 3. Install dependencies for Vite and Socket.io
```bash
npm install
```
This installs all dependencies listed in `package.json`, including Vite, Three.js and any other required libraries.
Then go to `/server` folder and also install dependencies for Socket.io:
```bash
npm install
```

### 4. Run the servers
First run the Node.js server. Go to `/TheOutlandsGame` then do:
```bash
node server/server.js #to start the Node server
```
This will start the Node.js server on `http://localhost:3000`

**Edit for online servers**
If you want to start the server online, you can edit the file so it listens to IP addresses from different devices by doing `httpServer.listen(3000,"0.0.0.0", () => {`. Make sure to open port 3000 also.

Then start the Vite development server:
```bash
npm run dev #to start the development server
```
Vite will start a local development server and give you a URL (usually `http://localhost:5173`) to open the game in your browser.

**Edit for online servers**
If you want to start it on a public server (online), edit `main.js` and adjust the socket `const socket = io("http://PUBLIC-IP:3000");`
To start the development server online do:
```bash
npm run dev -- --host 0.0.0.0 #to start the development server online
```



## Tech stack
- **Vite** – lightning-fast dev environment
- **Three.js** – 3D rendering
- **Socket.io** – multiplayer networking
- **MySQL** (future) – persistent backend for player data, stats and world info

## Planned features

✔️ FPS camera movement

✔️ Basic world rendering

✔️ Multiplayer player syncing (Socket.io)

⏳ Simple character models for players

⏳ Chat system or simple voice indicators

⏳ MySQL integration for account/world data

⏳ Game lobby or room system

This project will grow as I experiment with new ideas.

## Feedback and contribution

I welcome feedback, suggestions and improvements.
Anyone is free to contribute, fork the project or create a pull request.

If you're interested in collaborating, let me know what you think. I’m happy to work together to push the project further.