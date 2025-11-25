import * as THREE from 'three';
import { Ammo } from '@fred3d/ammo';
import { io } from "socket.io-client";
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import config from "./config.json";

// ------------------------------------------------------
// GLOBAL VARIABLES
// ------------------------------------------------------
let scene, camera, renderer;
let player, cube;
let raycaster = new THREE.Raycaster();
let mouse = new THREE.Vector2();
let isHovering = false;

//Physics
let AmmoLib;
let physicsWorld; // Init physics world
let playerPhysicsBody;

// FPS rotation
let yaw = 0;
let pitch = 0;
const sensitivity = 0.002;

// movement keys
const keys = {
  w: false,
  a: false,
  s: false,
  d: false,
  " ": false,
  control: false
};

// movement speed
let moveSpeed = 0.12;
let sprintMultiplier = 2.5;

// multiplayer cache
let otherPlayers = {};
let lastPosition = new THREE.Vector3();
let lastRotation = { yaw: 0, pitch: 0 };

// ------------------------------------------------------
// SOCKET.IO (GLOBAL, BEFORE ANY LISTENERS)
// ------------------------------------------------------
const socket = io("http://" + config.SERVER_URL + ":" + config.SERVER_PORT);
socket.on("connect", () => console.log("Connected:", socket.id));





// ------------------------------------------------------
// Initialize Ammo and physics world
// ------------------------------------------------------
Ammo().then(AmmoLibInstance => {

  AmmoLib = AmmoLibInstance;

  // --- Physics world setup ---
  const collisionConfig = new AmmoLib.btDefaultCollisionConfiguration();
  const dispatcher = new AmmoLib.btCollisionDispatcher(collisionConfig);
  const broadphase = new AmmoLib.btDbvtBroadphase();
  const solver = new AmmoLib.btSequentialImpulseConstraintSolver();

  physicsWorld = new AmmoLib.btDiscreteDynamicsWorld(
      dispatcher,
      broadphase,
      solver,
      collisionConfig
  );

  physicsWorld.setGravity(new AmmoLib.btVector3(0, -9.81, 0));

  console.log("Ammo physics initialized.");

  // --- Scene initialization ---
  initScene();
  renderLoop();
});






// ------------------------------------------------------
// INIT SCENE (ONLY SETUP GOES HERE)
// ------------------------------------------------------
const canvas = document.querySelector('#viewPort');
function initScene() {
  // SCENE
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x111111);
  scene.fog = new THREE.Fog(0x111111, 0, 70);


  // RENDERER

  renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.VSMShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;




  // PLAYER + CAMERA
  player = new THREE.Object3D();
  player.position.set(0, 0, 4);
  scene.add(player);

  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    100
  );
  camera.position.set(0, 1.75, 0);
  player.add(camera);

  // LIGHTS
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
  const directionalLight = new THREE.DirectionalLight(0xe9c6ff, 3);

  directionalLight.castShadow = true;
  directionalLight.shadow.radius = 2; // Increase to make edges softer
  directionalLight.position.set(5, 5, 5);
  directionalLight.shadow.mapSize.width = 1024;
  directionalLight.shadow.mapSize.height = 1024;
  directionalLight.shadow.camera.near = 0.5;
  directionalLight.shadow.camera.far = 100;
  directionalLight.shadow.camera.right = 100;
  directionalLight.shadow.camera.top = 100;



  directionalLight.position.set(5, 5, 5);








  scene.add(ambientLight);

  scene.add(directionalLight);

  // CUBE
  const cubeGeom = new THREE.BoxGeometry(2, 2, 2);
  const cubeMat = new THREE.MeshStandardMaterial({ color: 0x44aaff });
  cube = new THREE.Mesh(cubeGeom, cubeMat);
  cube.position.set(0, 1, 0);
  cube.castShadow = true;
  cube.receiveShadow = true;


  scene.add(cube);

  // GLTF Loader for the world
  const loader = new GLTFLoader();
  loader.load('/src/assets/world.glb', (gltf) => {
    const model = gltf.scene;

    model.traverse((obj) => {
      if (obj.isMesh) {
        obj.castShadow = true;
        obj.receiveShadow = true;
      }

      // Override material if basic so it casts shadows
      // if (obj.material.isMeshBasicMaterial) {
      //   obj.material = new THREE.MeshStandardMaterial({ color: obj.material.color });
      // }
    });

    model.scale.set(0.5, 0.5, 0.5);













    scene.add(model);
  });






















  // Window resize
  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
}


// ------------------------------------------------------
// PHYSICS FUNCTIONS
// ------------------------------------------------------

function createPlayerPhysics() {
  const mass = 1; // dynamic
  const transform = new AmmoLib.btTransform();
  transform.setIdentity();
  transform.setOrigin(new AmmoLib.btVector3(player.position.x, player.position.y, player.position.z));
  const motionState = new AmmoLib.btDefaultMotionState(transform);

  // Capsule shape (radius, height)
  const radius = 0.3;
  const height = 1.45;
  const playerShape = new AmmoLib.btCapsuleShape(radius, height);

  const localInertia = new AmmoLib.btVector3(0, 0, 0);
  playerShape.calculateLocalInertia(mass, localInertia);

  const rbInfo = new AmmoLib.btRigidBodyConstructionInfo(mass, motionState, playerShape, localInertia);
  playerPhysicsBody = new AmmoLib.btRigidBody(rbInfo);
  playerPhysicsBody.setActivationState(4); // prevent sleeping

  physicsWorld.addRigidBody(playerPhysicsBody);
}


function createPlatformPhysics(model) {
  const triangleMesh = new AmmoLib.btTriangleMesh();

  model.traverse((child) => {
      if (child.isMesh) {
          const vertices = child.geometry.attributes.position.array;
          for (let i = 0; i < vertices.length; i += 9) {
              const v0 = new AmmoLib.btVector3(vertices[i], vertices[i+1], vertices[i+2]);
              const v1 = new AmmoLib.btVector3(vertices[i+3], vertices[i+4], vertices[i+5]);
              const v2 = new AmmoLib.btVector3(vertices[i+6], vertices[i+7], vertices[i+8]);
              triangleMesh.addTriangle(v0, v1, v2, true);
          }
      }
  });

  const shape = new AmmoLib.btBvhTriangleMeshShape(triangleMesh, true, true);
  const transform = new AmmoLib.btTransform();
  transform.setIdentity();
  transform.setOrigin(new AmmoLib.btVector3(0, 0, 0));
  const motionState = new AmmoLib.btDefaultMotionState(transform);

  const rbInfo = new AmmoLib.btRigidBodyConstructionInfo(0, motionState, shape, new AmmoLib.btVector3(0, 0, 0));
  const platformBody = new AmmoLib.btRigidBody(rbInfo);

  physicsWorld.addRigidBody(platformBody);
  /* mass = 0 → static. This will make your world solid so the player won’t fall through. */
}


// ------------------------------------------------------
// MOVEMENT + FPS CONTROL
// ------------------------------------------------------



function updateMovement() {
  let speed = keys.shift ? moveSpeed * sprintMultiplier : moveSpeed;

  const dir = new THREE.Vector3();
  camera.getWorldDirection(dir);

  const forward = new THREE.Vector3(dir.x, 0, dir.z).normalize();
  const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

  if (keys.w) player.position.add(forward.clone().multiplyScalar(speed));
  if (keys.s) player.position.add(forward.clone().multiplyScalar(-speed));
  if (keys.a) player.position.add(right.clone().multiplyScalar(-speed));
  if (keys.d) player.position.add(right.clone().multiplyScalar(speed));

  if (keys[" "]) player.position.y += speed;
  if (keys.control) player.position.y -= speed;

            // SOCKET IO
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

// Jump listener (once, global)
// document.addEventListener("keydown", (e) => {
//   if (e.key === " ") {
//       const velocity = playerPhysicsBody.getLinearVelocity();
//       if (Math.abs(velocity.y()) < 0.01) { 
//           const jumpImpulse = new AmmoLib.btVector3(0, 5, 0);
//           playerPhysicsBody.applyCentralImpulse(jumpImpulse);
//       }
//   }
// });


// ------------------------------------------------------
// INPUT LISTENERS
// ------------------------------------------------------

document.addEventListener("keydown", (e) => keys[e.key.toLowerCase()] = true);
document.addEventListener("keyup", (e) => keys[e.key.toLowerCase()] = false);

window.addEventListener("blur", () => {
  for (const k in keys) keys[k] = false;
});

// Pointer lock
let mouseLocked = false;
canvas.addEventListener("mousedown", (e) => {
  if (e.button === 2) {
    if (!mouseLocked) canvas.requestPointerLock();
    else document.exitPointerLock();
  }
});

window.addEventListener("contextmenu", e => e.preventDefault()); //disables rightclicking by default using the mouse

document.addEventListener("pointerlockchange", () => {
  mouseLocked = (document.pointerLockElement === canvas);
});

// Mouse movement (FPS + hover)
document.addEventListener("mousemove", (e) => {
  if (!mouseLocked) {
    // hover raycast
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = - (e.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(cube);

    if (intersects.length > 0) {
      cube.material.color.set(0xF88379);
      document.body.style.cursor = "pointer";
      isHovering = true;
    } else {
      cube.material.color.set(0x44aaff);
      document.body.style.cursor = "default";
      isHovering = false;
    }
  } else {
    // FPS rotation
    yaw -= e.movementX * sensitivity;
    pitch -= e.movementY * sensitivity;
    pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, pitch));

    player.rotation.y = yaw;
    camera.rotation.x = pitch;
  }
});





// Create a capsule geometry for other players
const capsuleGeom = new THREE.BoxGeometry(0.5, 1.85, 0.5); // length, capSegments, radialSegments
const capsuleMat = new THREE.MeshStandardMaterial({ color: 0xff0000 });
// Set a default starting position for the geometry's mesh (centered at y=0.875 for "standing" on ground)
capsuleGeom.translate(0, 1.3, 0);






// ------------------------------------------------------
// MULTIPLAYER STUFF
// ------------------------------------------------------

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


// ------------------------------------------------------
// RENDER LOOP
// ------------------------------------------------------
function renderLoop() {

  cube.rotation.y += isHovering ? 0.2 : 0.01;

  updateMovement();

  renderer.render(scene, camera);
  requestAnimationFrame(renderLoop);
}


// ------------------------------------------------------
// START GAME
// ------------------------------------------------------