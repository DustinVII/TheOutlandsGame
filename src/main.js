import * as THREE from 'three';

import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const loader = new GLTFLoader();



// Add socket.io
import { io } from "socket.io-client";
const socket = io("http://localhost:3000");
//or do this for public servers: const socket = io("http://PUBLIC-IP:3000");
//But make sure to open the ports



socket.on("connect", () => {
  console.log("Connected to server:", socket.id);
});

//scene
const scene = new THREE.Scene();
const canvas = document.querySelector('#viewPort');
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

let isHovering = false;

scene.background = new THREE.Color(0x222222);

//renderer
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: true
});
renderer.setSize(window.innerWidth, window.innerHeight);




//camera
// Player object (holds position)
const player = new THREE.Object3D();
scene.add(player);

// Camera attached to player
const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 100);
camera.position.set(0, 1.75, 0); // height of eyes
player.add(camera);

window.addEventListener("contextmenu", e => e.preventDefault()); //disables rightclicking by default using the mouse
window.addEventListener("beforeunload", (event) => {
  event.preventDefault();
  event.returnValue = "";
});




window.addEventListener('click', (event) => {
  // Convert mouse position to normalized device coordinates (-1 to +1)
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;

  // Update the raycaster
  raycaster.setFromCamera(mouse, camera);

  // Check intersections
  const intersects = raycaster.intersectObject(cube); // can also use intersectObjects([cube, ...])

  if (intersects.length > 0) {
      // Cube clicked! Open URL
      window.open('https://google.com', '_blank');
  }
});

let mouseLocked = false;
canvas.addEventListener("mousedown", (e) => {
    if (e.button === 2) { // Right click
        if (!mouseLocked) {
            canvas.requestPointerLock();
        } else {
            document.exitPointerLock();
        }
    }
});

document.addEventListener("pointerlockchange", () => {
  mouseLocked = (document.pointerLockElement === canvas);
});


// Save original color
// const originalColor = cube.material.color.clone();

document.addEventListener("mousemove", (e) => {
  if (!mouseLocked) {
    // Convert mouse position to normalized device coordinates (-1 to +1)
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;

  // Update raycaster
  raycaster.setFromCamera(mouse, camera);

  // Check intersections with your clickable objects
  const intersects = raycaster.intersectObject(cube); // or use intersectObjects([cube, ...])

  if (intersects.length > 0) {
    isHovering = true;
      // Hovering over the cube → pointer
      document.body.style.cursor = 'pointer';
      cube.material.color.set(0xF88379); // red
  } else {
    isHovering = false;
      // Not hovering → default cursor
      document.body.style.cursor = 'default';
      cube.material.color.set(0x0000ff); // blue
  }
} else {

  yaw -= e.movementX * sensitivity;
  pitch -= e.movementY * sensitivity;

  pitch = Math.max(-Math.PI/2, Math.min(Math.PI/2, pitch));

  player.rotation.y = yaw;
  camera.rotation.x = pitch;
}
});

// FPS rotation angles
let yaw = 0;
let pitch = 0;

// Mouse sensitivity
const sensitivity = 0.002;

const keys = {
  w: false,
  a: false,
  s: false,
  d: false,
  " ": false,    // space
  control: false // ctrl
};

document.addEventListener("keydown", (e) => {
  keys[e.key.toLowerCase()] = true;
});

document.addEventListener("keyup", (e) => {
  keys[e.key.toLowerCase()] = false;
});


window.addEventListener("blur", () => { // Reset all keys automatically if a popup appears for example
  for (const k in keys) {
      keys[k] = false;
  }
});

let moveSpeed = 0.05;
let sprintMultiplier = 2.5;   // how much faster when sprinting

// Store last sent state
let lastPosition = new THREE.Vector3();
let lastRotation = { yaw: 0, pitch: 0 };

function updateMovement() {
    // Base speed
    let speed = moveSpeed;
    if (keys.shift) speed *= sprintMultiplier;

    let direction = new THREE.Vector3();
    camera.getWorldDirection(direction);

    const forward = new THREE.Vector3(direction.x, 0, direction.z).normalize();
    const right   = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0,1,0)).normalize();

    // Horizontal movement
    if (keys.w) player.position.add(forward.clone().multiplyScalar(speed));
    if (keys.s) player.position.add(forward.clone().multiplyScalar(-speed));
    if (keys.a) player.position.add(right.clone().multiplyScalar(-speed));
    if (keys.d) player.position.add(right.clone().multiplyScalar(speed));

    // Vertical movement
    if (keys[" "])    player.position.y += speed;  
    if (keys.control) player.position.y -= speed;

    // Check if position or rotation has changed
    const positionChanged = !player.position.equals(lastPosition);
    const rotationChanged = yaw !== lastRotation.yaw || pitch !== lastRotation.pitch;

    if (positionChanged || rotationChanged) {
        // Emit player's position and rotation
        socket.emit("playerUpdate", {
            id: socket.id,
            position: {
                x: player.position.x,
                y: player.position.y,
                z: player.position.z
            },
            rotation: {
                yaw: yaw,
                pitch: pitch
            }
        });

        // Update last sent state
        lastPosition.copy(player.position);
        lastRotation.yaw = yaw;
        lastRotation.pitch = pitch;
    }
}

//cube
const cubeGeom = new THREE.BoxGeometry(1, 1, 1);
const cubeMat = new THREE.MeshStandardMaterial({ color: 0x44aaff });
const cube = new THREE.Mesh(cubeGeom, cubeMat);
cube.position.set(0, 0.5, 0);
scene.add(cube);


loader.load(
  '/src/assets/world.glb',
  function(gltf) {
    const model = gltf.scene;
    model.scale.set(0.5, 0.5, 0.5);
    model.position.set(0, 0, 0);
    model.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveSHadow = true;
      }
    });

    scene.add(model);
    console.log('Model loaded:', model);

  }
);










// Store other players
const otherPlayers = {}; // { id: THREE.Mesh }

// Create a capsule geometry for other players
const capsuleGeom = new THREE.BoxGeometry(0.5, 1.85, 0.5); // length, capSegments, radialSegments
const capsuleMat = new THREE.MeshStandardMaterial({ color: 0xff0000 });
// Set a default starting position for the geometry's mesh (centered at y=0.875 for "standing" on ground)
capsuleGeom.translate(0, 0.93, 0);



// Handle initial list of connected players
socket.on("currentPlayers", (players) => {
    for (const id in players) {
        if (id !== socket.id && !otherPlayers[id]) {
            const capsule = new THREE.Mesh(capsuleGeom, capsuleMat.clone());
            capsule.position.set(
                players[id].position.x,
                players[id].position.y,
                players[id].position.z
            );
            scene.add(capsule);
            otherPlayers[id] = capsule;
        }
    }
});

// Handle updates from other players
socket.on("playerUpdate", (data) => {
    if (data.id === socket.id) return; // ignore self

    if (!otherPlayers[data.id]) {
        // New player joined
        const capsule = new THREE.Mesh(capsuleGeom, capsuleMat.clone());
        scene.add(capsule);
        otherPlayers[data.id] = capsule;
    }

    // Update position and rotation
    const capsule = otherPlayers[data.id];
    capsule.position.set(data.position.x, data.position.y, data.position.z);

    // Optional: rotate capsule if you want it to face same direction as yaw
    capsule.rotation.y = data.rotation.yaw;
});

// Handle disconnects
socket.on("playerDisconnected", (id) => {
    if (otherPlayers[id]) {
        scene.remove(otherPlayers[id]);
        delete otherPlayers[id];
    }
});















//lights
const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
const directionalLight = new THREE.DirectionalLight(0xffffff, 3);
directionalLight.position.set(5,5,5);
scene.add(ambientLight);
scene.add(directionalLight);

//Call function on window resize
window.addEventListener('resize', () => { // This function gets called each time you resize the window
  // Make view port responsive
  camera.aspect = window.innerWidth / window.innerHeight; // Updates the aspect ratio on window resize
  camera.updateProjectionMatrix(); // Needs to be placed when the camera properties are being edited such as in the line above this one.
  renderer.setSize(window.innerWidth, window.innerHeight); // Set size again.
});

//render loop
function renderloop() {

  if (isHovering){
    cube.rotation.y += 0.2
  } else {
    cube.rotation.y += 0.01
  }

  updateMovement();  // FPS movement
  renderer.render(scene, camera); // Renders the current scene with the camera
  requestAnimationFrame(renderloop); // Requests the next animation frame (keeps loop going)
}
renderloop();