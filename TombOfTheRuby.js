import * as THREE from 'three';
import {
    EffectComposer
} from 'three/addons/postprocessing/EffectComposer.js';
import {
    RenderPass
} from 'three/addons/postprocessing/RenderPass.js';
import {
    UnrealBloomPass
} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {
    SMAAPass
} from 'three/addons/postprocessing/SMAAPass.js';

// Initialize loading manager
const loadingManager = new THREE.LoadingManager();
const textureLoader = new THREE.TextureLoader(loadingManager);
let assetsLoaded = false;
// Player stats
let playerHealth = 100;
let maxPlayerHealth = 100;
let hasMap = false;
let hasRuby = false;
let isSwimming = false;
let isInWater = false;
let canSwim = true;
let chestOpened = false;
let isDragonSpawned = false;
let inTank = false;
let currentWeaponType = 'minigun'; // or 'cannon'
let dragonHealth = 1000;
let maxDragonHealth = 1000;
let isMapEquipped = false;
let isInventoryOpen = false;
let hasScroll = false;
let isInTunnel = false;
let isShaking = false;
let shakeStartTime = 0;
const SHAKE_DURATION = 5000; // 5 seconds
const SHAKE_INTENSITY = 0.3;
let tunnelFound = false;
let tunnelMarkerDistance = Infinity;
const TUNNEL_LOCATION = new THREE.Vector3(-20, 50, -20); // Sky tunnel entrance
const TUNNEL_END = new THREE.Vector3(-20, 2, -20); // Ground tunnel entrance
const MAP_INDICATOR_RADIUS = 30; // Maximum distance for map indicator
const inventory = {
    weapons: ['pistol'],
    activeWeapon: 'pistol'
};
const ENEMY_MAX_HEALTH = 100;
const ENEMY_DAMAGE_PER_HIT = 10; // 10 hits to kill
let gameWon = false;
let fadeStart = 0;
const fadeDuration = 3000; // 3 seconds fade
// Enemy properties
const enemies = [];
const enemySpawnPoints = [
    new THREE.Vector3(25, 2, 25),
    new THREE.Vector3(-25, 2, 25),
    new THREE.Vector3(25, 2, -25),
    new THREE.Vector3(-25, 2, -25)
];

const parentDiv = document.getElementById('renderDiv');
let canvas = document.getElementById('threeRenderCanvas');
if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.id = 'threeRenderCanvas';
    parentDiv.appendChild(canvas);
}

// Create loading screen
const loadingScreen = document.createElement('div');
loadingScreen.style.position = 'absolute';
loadingScreen.style.top = '0';
loadingScreen.style.left = '0';
loadingScreen.style.width = '100%';
loadingScreen.style.height = '100%';
loadingScreen.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
loadingScreen.style.color = 'white';
loadingScreen.style.display = 'flex';
loadingScreen.style.justifyContent = 'center';
loadingScreen.style.alignItems = 'center';
loadingScreen.style.fontSize = '24px';
loadingScreen.innerHTML = 'Loading... 0%';
parentDiv.appendChild(loadingScreen);
// Create health bar UI
const healthBarContainer = document.createElement('div');
healthBarContainer.style.position = 'fixed';
healthBarContainer.style.top = '20px';
healthBarContainer.style.left = '20px';
healthBarContainer.style.width = '200px';
healthBarContainer.style.height = '20px';
healthBarContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
healthBarContainer.style.border = '2px solid #fff';
healthBarContainer.style.borderRadius = '10px';
const healthBarFill = document.createElement('div');
healthBarFill.style.width = '100%';
healthBarFill.style.height = '100%';
healthBarFill.style.backgroundColor = '#ff0000';
healthBarFill.style.borderRadius = '8px';
healthBarFill.style.transition = 'width 0.2s ease-out';
healthBarContainer.appendChild(healthBarFill);
document.body.appendChild(healthBarContainer);
// Create dragon health bar
const dragonHealthContainer = document.createElement('div');
dragonHealthContainer.style.position = 'fixed';
dragonHealthContainer.style.top = '50px';
dragonHealthContainer.style.left = '50%';
dragonHealthContainer.style.transform = 'translateX(-50%)';
dragonHealthContainer.style.width = '400px';
dragonHealthContainer.style.height = '30px';
dragonHealthContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
dragonHealthContainer.style.border = '2px solid #fff';
dragonHealthContainer.style.borderRadius = '10px';
dragonHealthContainer.style.display = 'none';
const dragonLabel = document.createElement('div');
dragonLabel.textContent = 'DRAGON';
dragonLabel.style.color = '#fff';
dragonLabel.style.textAlign = 'center';
dragonLabel.style.fontSize = '20px';
dragonLabel.style.marginBottom = '5px';
dragonHealthContainer.appendChild(dragonLabel);
const dragonHealthFill = document.createElement('div');
dragonHealthFill.style.width = '100%';
dragonHealthFill.style.height = '100%';
dragonHealthFill.style.backgroundColor = '#ff0000';
dragonHealthFill.style.borderRadius = '8px';
dragonHealthFill.style.transition = 'width 0.2s ease-out';
dragonHealthContainer.appendChild(dragonHealthFill);
document.body.appendChild(dragonHealthContainer);
// Create controls display
const controlsDisplay = document.createElement('div');
controlsDisplay.style.position = 'fixed';
controlsDisplay.style.top = '50%';
controlsDisplay.style.left = '50%';
controlsDisplay.style.transform = 'translate(-50%, -50%)';
controlsDisplay.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
controlsDisplay.style.color = 'white';
controlsDisplay.style.padding = '20px';
controlsDisplay.style.borderRadius = '10px';
controlsDisplay.style.display = 'none';
controlsDisplay.style.zIndex = '1000';
controlsDisplay.innerHTML = `
    <h2>Game Controls</h2>
    <p>WASD / Arrow Keys - Move</p>
    <p>Mouse - Look around</p>
    <p>Left Click - Shoot</p>
    <p>Right Click - Zoom</p>
    <p>Space - Jump</p>
    <p>Shift - Sprint</p>
    <p>Control - Slide (while sprinting)</p>
    <p>E - Interact with door</p>
    <p>G - Switch weapons (when rifle acquired)</p>
    <p>H - Show/Hide controls</p>
    <p>Tab - Open/Close inventory</p>
    <p>1-3 - Quick select weapons</p>
    <p>M - Toggle map view</p>
`;
document.body.appendChild(controlsDisplay);
// Create inventory UI
const inventoryDisplay = document.createElement('div');
inventoryDisplay.style.position = 'fixed';
inventoryDisplay.style.top = '50%';
inventoryDisplay.style.left = '50%';
inventoryDisplay.style.transform = 'translate(-50%, -50%)';
inventoryDisplay.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
inventoryDisplay.style.color = 'white';
inventoryDisplay.style.padding = '20px';
inventoryDisplay.style.borderRadius = '10px';
inventoryDisplay.style.display = 'none';
inventoryDisplay.style.zIndex = '1000';
inventoryDisplay.innerHTML = `
    <h2>Inventory</h2>
    <div id="weaponsList" style="margin: 10px 0;">
        <div>1. Pistol</div>
    </div>
`;
document.body.appendChild(inventoryDisplay);

// Initialize background music variable
let backgroundMusic;

// Loading manager events
loadingManager.onProgress = function(url, itemsLoaded, itemsTotal) {
    const progress = ((itemsLoaded / itemsTotal) * 100).toFixed(0);
    loadingScreen.innerHTML = `Loading... ${progress}%`;
};

loadingManager.onLoad = function() {
    assetsLoaded = true;
    loadingScreen.style.display = 'none';

    // Initialize and play background music
    backgroundMusic = new Audio('https://play.rosebud.ai/assets/rosebud_official_theme_02.mp3?Im1u');
    backgroundMusic.loop = true;
    backgroundMusic.volume = 0.04; // Adjust volume as needed (0.0 to 1.0)
    backgroundMusic.play().catch((error) => {
        console.warn('Autoplay was prevented. User interaction is required to play the background music.');
    });
};

// Initialize the scene
const scene = new THREE.Scene();

// Clock for animation
const clock = new THREE.Clock();

// Initialize the camera
const camera = new THREE.PerspectiveCamera(
    75,
    canvas.offsetWidth / canvas.offsetHeight,
    0.1,
    1000
);
camera.position.set(0, 2, 0); // Position camera at human height
camera.rotation.order = 'YXZ'; // This order works better for FPS controls
// Create a simple gun model
const gunGroup = new THREE.Group();
// Gun scope
const scopeGroup = new THREE.Group();
// Main scope tube
const scopeBody = new THREE.Mesh(
    new THREE.CylinderGeometry(0.03, 0.03, 0.2, 16),
    new THREE.MeshStandardMaterial({
        color: 0x222222
    })
);
scopeBody.rotation.x = Math.PI / 2;
scopeBody.position.set(0, 0.05, -0.1);
// Scope ends (rings)
const scopeRingFront = new THREE.Mesh(
    new THREE.TorusGeometry(0.035, 0.01, 8, 16),
    new THREE.MeshStandardMaterial({
        color: 0x111111
    })
);
scopeRingFront.rotation.y = Math.PI / 2;
scopeRingFront.position.set(0, 0.05, -0.2);
const scopeRingBack = new THREE.Mesh(
    new THREE.TorusGeometry(0.035, 0.01, 8, 16),
    new THREE.MeshStandardMaterial({
        color: 0x111111
    })
);
scopeRingBack.rotation.y = Math.PI / 2;
scopeRingBack.position.set(0, 0.05, 0);
// Add scope parts to scope group
scopeGroup.add(scopeBody);
scopeGroup.add(scopeRingFront);
scopeGroup.add(scopeRingBack);
// Gun body
const gunBody = new THREE.Mesh(
    new THREE.BoxGeometry(0.1, 0.1, 0.5),
    new THREE.MeshStandardMaterial({
        color: 0x333333
    })
);
gunBody.position.set(0, -0.1, -0.5);
// Gun handle
const gunHandle = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, 0.2, 0.1),
    new THREE.MeshStandardMaterial({
        color: 0x666666
    })
);
gunHandle.position.set(0, -0.2, -0.3);
// Add parts to gun group
gunGroup.add(gunBody);
gunGroup.add(gunHandle);
gunGroup.add(scopeGroup);
// Add gun to camera
camera.add(gunGroup);
scene.add(camera);
// Player physics properties
const gravity = -0.015;
const jumpForce = 0.3;
let verticalVelocity = 0;
let isJumping = false;
// Weapon properties
let currentWeapon = 'pistol';
const weaponStats = {
    pistol: {
        fireRate: 500, // milliseconds between shots
        bulletSpeed: 1.5,
        zoomFOV: 30
    },
    rifle: {
        fireRate: 200, // faster fire rate
        bulletSpeed: 2,
        zoomFOV: 20 // more zoom
    }
};
let lastFireTime = 0;
let hasRifle = false;
// Bullet properties
const bullets = [];
const bulletSpeed = 1.5;
const bulletGeometry = new THREE.SphereGeometry(0.05, 8, 8);
const bulletMaterial = new THREE.MeshStandardMaterial({
    color: 0xffff00,
    emissive: 0xffff00,
    emissiveIntensity: 0.5
});
// Gun flash light
const flashLight = new THREE.PointLight(0xffff00, 0, 3);
gunGroup.add(flashLight);
flashLight.position.set(0, -0.1, -0.7);
// Initialize the renderer with HDR
const renderer = new THREE.WebGLRenderer({
    antialias: true,
    canvas: canvas,
    powerPreference: 'high-performance',
});
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(canvas.offsetWidth, canvas.offsetHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;

// Initialize post-processing
const composer = new EffectComposer(renderer);

// Regular scene render pass
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

// Add subtle bloom effect
const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    0.2, // bloom strength
    0.4, // radius
    0.9 // threshold
);
composer.addPass(bloomPass);

// Add anti-aliasing
const smaaPass = new SMAAPass(
    window.innerWidth * renderer.getPixelRatio(),
    window.innerHeight * renderer.getPixelRatio()
);
composer.addPass(smaaPass);

// Initialize composer size
composer.setSize(parentDiv.clientWidth, parentDiv.clientHeight);

// Define sky colors for environmental lighting
const skyColor = new THREE.Color(0x87ceeb); // Bright sky blue
const groundColor = new THREE.Color(0xffffff); // White ground reflection

// Create sky dome with improved colors
const vertexShader = `
varying vec3 vWorldPosition;
void main() {
    vec4 worldPosition = modelMatrix * vec4( position, 1.0 );
    vWorldPosition = worldPosition.xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`;
const fragmentShader = `
uniform vec3 topColor;
uniform vec3 bottomColor;
uniform float offset;
uniform float exponent;
varying vec3 vWorldPosition;
void main() {
    float h = normalize( vWorldPosition + offset ).y;
    gl_FragColor = vec4( mix( bottomColor, topColor, max( pow( max( h, 0.0 ), exponent ), 0.0 ) ), 1.0 );
}`;
const uniforms = {
    topColor: {
        value: skyColor
    },
    bottomColor: {
        value: groundColor
    },
    offset: {
        value: 33
    },
    exponent: {
        value: 0.6
    },
};
const skyGeo = new THREE.SphereGeometry(500, 32, 15);
const skyMat = new THREE.ShaderMaterial({
    uniforms: uniforms,
    vertexShader: vertexShader,
    fragmentShader: fragmentShader,
    side: THREE.BackSide,
});
const sky = new THREE.Mesh(skyGeo, skyMat);
scene.add(sky);

// Player movement variables
const normalMoveSpeed = 0.1;
const sprintMoveSpeed = 0.2;
const slideSpeed = 0.3;
const slideDuration = 1000; // in milliseconds
const rotationSpeed = 0.002;
let moveSpeed = normalMoveSpeed;
let isSprinting = false;
let isSliding = false;
let slideStart = 0;
let slideDirection = new THREE.Vector3();
let moveForward = false;
let moveBackward = false;
let moveLeft = false;
// Sprint energy system
const maxSprintEnergy = 100;
let sprintEnergy = maxSprintEnergy;
const sprintDrainRate = 25; // Energy loss per second while sprinting
const sprintRegenRate = 15; // Energy regen per second while not sprinting
const sprintRegenDelay = 1000; // Delay in ms before energy starts regenerating
let lastSprintTime = 0;
// Create sprint bar UI
const sprintBarContainer = document.createElement('div');
sprintBarContainer.style.position = 'fixed';
sprintBarContainer.style.bottom = '20px';
sprintBarContainer.style.left = '50%';
sprintBarContainer.style.transform = 'translateX(-50%)';
sprintBarContainer.style.width = '200px';
sprintBarContainer.style.height = '5px';
sprintBarContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
sprintBarContainer.style.border = '1px solid #fff';
sprintBarContainer.style.borderRadius = '3px';
const sprintBarFill = document.createElement('div');
sprintBarFill.style.width = '100%';
sprintBarFill.style.height = '100%';
sprintBarFill.style.backgroundColor = '#00ff00';
sprintBarFill.style.transition = 'width 0.1s ease-out';
sprintBarContainer.appendChild(sprintBarFill);
document.body.appendChild(sprintBarContainer);
let moveRight = false;
let canJump = true;
// Mouse look variables
let isPointerLocked = false;
let isZoomedIn = false;
const normalFOV = 75;
const zoomFOV = 30;
// Add pointer lock controls
canvas.addEventListener('click', () => {
    canvas.requestPointerLock();
});
document.addEventListener('pointerlockchange', () => {
    isPointerLocked = document.pointerLockElement === canvas;
});
// Shooting mechanic
document.addEventListener('click', () => {
    if (isPointerLocked) {
        const now = Date.now();
        const weapon = weaponStats[currentWeapon];

        // Check fire rate
        if (now - lastFireTime < weapon.fireRate) return;
        lastFireTime = now;

        // Create bullet with weapon-specific properties
        const bullet = new THREE.Mesh(bulletGeometry, bulletMaterial);

        // Position bullet at gun muzzle
        bullet.position.copy(camera.position);
        const direction = new THREE.Vector3(0, 0, -1);
        direction.applyQuaternion(camera.quaternion);
        bullet.position.add(direction.multiplyScalar(0.7));

        // Store direction for movement
        bullet.userData.direction = direction;
        bullet.userData.createdAt = Date.now();

        scene.add(bullet);
        bullets.push(bullet);

        // Flash effect
        flashLight.intensity = 3;
        setTimeout(() => {
            flashLight.intensity = 0;
        }, 50);
    }
});
// Mouse movement handler
document.addEventListener('mousemove', (event) => {
    if (isPointerLocked) {
        camera.rotation.y -= event.movementX * rotationSpeed;
        camera.rotation.x = Math.max(
            -Math.PI / 2,
            Math.min(Math.PI / 2, camera.rotation.x - event.movementY * rotationSpeed)
        );
    }
});
// Add right-click zoom handlers
document.addEventListener('contextmenu', (event) => {
    event.preventDefault(); // Prevent default right-click menu
});
document.addEventListener('mousedown', (event) => {
    if (event.button === 2 && isPointerLocked) { // Right mouse button
        isZoomedIn = true;
        camera.fov = weaponStats[currentWeapon].zoomFOV;
        camera.updateProjectionMatrix();

        // Adjust gun and camera position for scope zoom
        gunGroup.position.x = 0;
        gunGroup.position.y = 0;
        gunGroup.position.z = -0.3;
        // Position camera to align with scope
        camera.position.y += 0.05;
        // Center the scope
        gunGroup.rotation.x = 0;
    }
});
document.addEventListener('mouseup', (event) => {
    if (event.button === 2) { // Right mouse button
        isZoomedIn = false;
        camera.fov = normalFOV;
        camera.updateProjectionMatrix();
        // Reset gun rotation
        gunGroup.rotation.x = 0;
    }
});
// Create flat terrain
function createTerrain() {
    const size = 200;
    // Create underground tunnel group
    const tunnelGroup = new THREE.Group();
    scene.userData.tunnelGroup = tunnelGroup; // Store reference immediately

    // Create water puddle
    const waterGeometry = new THREE.CylinderGeometry(3, 3, 4, 32);
    const waterMaterial = new THREE.MeshPhongMaterial({
        color: 0x0077be,
        transparent: true,
        opacity: 0.6,
        side: THREE.DoubleSide
    });
    const waterPuddle = new THREE.Mesh(waterGeometry, waterMaterial);
    waterPuddle.position.copy(TUNNEL_LOCATION);
    waterPuddle.position.y = -4;
    tunnelGroup.add(waterPuddle);

    // Create underwater chest
    const chestGroup = new THREE.Group();
    const chestGeometry = new THREE.BoxGeometry(1, 0.8, 0.6);
    const chestMaterial = new THREE.MeshStandardMaterial({
        color: 0x8B4513
    });
    const chest = new THREE.Mesh(chestGeometry, chestMaterial);
    chest.position.copy(TUNNEL_LOCATION);
    chest.position.y = -7;
    chest.userData.isInteractable = true;
    chest.userData.isOpen = false;
    chestGroup.add(chest);

    // Create chest lid
    const lidGeometry = new THREE.BoxGeometry(1.1, 0.2, 0.7);
    const lid = new THREE.Mesh(lidGeometry, chestMaterial);
    lid.position.y = 0.5;
    lid.position.z = -0.3;
    chest.add(lid);
    tunnelGroup.add(chestGroup);

    // Create tunnel hole (entrance)
    const holeGeometry = new THREE.CircleGeometry(1, 32);
    const holeMaterial = new THREE.MeshStandardMaterial({
        color: 0x000000,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.8
    });
    const hole = new THREE.Mesh(holeGeometry, holeMaterial);
    hole.rotation.x = -Math.PI / 2;
    hole.position.copy(TUNNEL_LOCATION);
    hole.position.y = 0.01;
    tunnelGroup.add(hole);
    // Create scroll stand
    const standGeometry = new THREE.CylinderGeometry(0.2, 0.3, 1, 8);
    const standMaterial = new THREE.MeshStandardMaterial({
        color: 0x8B4513
    });
    const stand = new THREE.Mesh(standGeometry, standMaterial);
    stand.position.copy(TUNNEL_LOCATION);
    stand.position.y = -1.5;

    // Create scroll
    const scrollGroup = new THREE.Group();
    const scrollGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.3, 16);
    const scrollMaterial = new THREE.MeshStandardMaterial({
        color: 0xf4f4f4,
        emissive: 0x666666,
        emissiveIntensity: 0.2
    });
    const scroll = new THREE.Mesh(scrollGeometry, scrollMaterial);
    scroll.rotation.x = Math.PI / 2;
    scrollGroup.add(scroll);
    scrollGroup.position.copy(TUNNEL_LOCATION);
    scrollGroup.position.y = -1;
    scrollGroup.userData.isInteractable = true;

    tunnelGroup.add(stand);
    tunnelGroup.add(scrollGroup);
    // Create tunnel ceiling to block upper view
    const tunnelCeilingGeometry = new THREE.PlaneGeometry(8, 15);
    const tunnelCeilingMaterial = new THREE.MeshStandardMaterial({
        color: 0x000000,
        side: THREE.DoubleSide
    });
    const tunnelCeiling = new THREE.Mesh(tunnelCeilingGeometry, tunnelCeilingMaterial);
    tunnelCeiling.rotation.x = Math.PI / 2;
    tunnelCeiling.position.copy(TUNNEL_LOCATION);
    tunnelCeiling.position.y = -1;
    tunnelGroup.add(tunnelCeiling);

    // Create main tunnel structure
    const skyTunnelGeometry = new THREE.BoxGeometry(8, 6, 15);
    const tunnelMaterial = new THREE.MeshStandardMaterial({
        color: 0x000066,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0,
        fog: true
    });

    // Create walkable floor for tunnel
    const tunnelFloorGeometry = new THREE.BoxGeometry(8, 0.5, 15);
    const tunnelFloor = new THREE.Mesh(tunnelFloorGeometry, tunnelMaterial.clone());
    tunnelFloor.position.copy(TUNNEL_LOCATION);
    tunnelFloor.position.y -= 3; // Position floor slightly below tunnel center
    tunnelGroup.add(tunnelFloor);

    // Create tunnel walls
    const tunnelWalls = new THREE.Mesh(skyTunnelGeometry, tunnelMaterial);
    tunnelWalls.position.copy(TUNNEL_LOCATION);
    tunnelGroup.add(tunnelWalls);

    // Create solid collision mesh (invisible)
    const tunnelCollision = new THREE.Mesh(
        skyTunnelGeometry,
        new THREE.MeshBasicMaterial({
            visible: false
        })
    );
    tunnelCollision.position.copy(TUNNEL_LOCATION);
    tunnelGroup.add(tunnelCollision);
    pathTunnel.position.set(
        TUNNEL_LOCATION.x,
        TUNNEL_LOCATION.y - pathLength / 2,
        TUNNEL_LOCATION.z
    );
    tunnelGroup.add(pathTunnel);

    // Ground level tunnel section
    const groundTunnel = new THREE.Mesh(skyTunnelGeometry, tunnelMaterial);
    groundTunnel.position.copy(TUNNEL_END);
    groundTunnel.position.y += 3;
    tunnelGroup.add(groundTunnel);

    // Add shadowy depth effect around the hole
    const shadowRingGeometry = new THREE.RingGeometry(1, 1.5, 32);
    const shadowRingMaterial = new THREE.MeshBasicMaterial({
        color: 0x000000,
        transparent: true,
        opacity: 0.3,
        side: THREE.DoubleSide
    });
    const shadowRing = new THREE.Mesh(shadowRingGeometry, shadowRingMaterial);
    shadowRing.rotation.x = -Math.PI / 2;
    shadowRing.position.copy(TUNNEL_LOCATION);
    shadowRing.position.y = 0.02;
    tunnelGroup.add(shadowRing);

    scene.add(tunnelGroup);
    // Store reference for visibility toggle
    scene.userData.tunnelGroup = tunnelGroup;
    // Create hidden tunnel entrance
    const entranceGeometry = new THREE.CircleGeometry(1.5, 32);
    const entranceMaterial = new THREE.MeshStandardMaterial({
        color: 0x222222,
        transparent: true,
        opacity: 0.7
    });
    const entrance = new THREE.Mesh(entranceGeometry, entranceMaterial);
    entrance.rotation.x = -Math.PI / 2;
    entrance.position.copy(TUNNEL_LOCATION);
    entrance.position.y = 0.01; // Slightly above ground
    scene.add(entrance);

    // Create simple flat plane for visuals
    const geometry = new THREE.PlaneGeometry(size, size);
    const texture = textureLoader.load('https://develop.play.rosebud.ai/assets/Grass_04.png?MBRT');
    const normalMap = textureLoader.load('https://develop.play.rosebud.ai/assets/Grass_04_Nrm.png?BQVT');

    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(20, 20);
    texture.encoding = THREE.sRGBEncoding;

    normalMap.wrapS = normalMap.wrapT = THREE.RepeatWrapping;
    normalMap.repeat.set(20, 20);

    const material = new THREE.MeshStandardMaterial({
        map: texture,
        normalMap: normalMap,
        normalScale: new THREE.Vector2(2, 2),
        roughness: 0.8,
        metalness: 0.1,
        envMapIntensity: 1.0,
    });

    const terrain = new THREE.Mesh(geometry, material);
    terrain.rotation.x = -Math.PI / 2;
    terrain.receiveShadow = true;
    scene.add(terrain);

    return terrain;
}

// Setup improved lighting system
const sunLight = new THREE.DirectionalLight(skyColor, 2.0);
sunLight.position.set(-50, 100, -50);
sunLight.castShadow = true;
sunLight.shadow.mapSize.width = 2048;
sunLight.shadow.mapSize.height = 2048;
sunLight.shadow.camera.near = 10;
sunLight.shadow.camera.far = 400;
sunLight.shadow.camera.left = -100;
sunLight.shadow.camera.right = 100;
sunLight.shadow.camera.top = 100;
sunLight.shadow.camera.bottom = -100;
sunLight.shadow.bias = -0.001;
scene.add(sunLight);

// Add hemisphere light to simulate sky and ground bounce light
const hemiLight = new THREE.HemisphereLight(skyColor, groundColor, 0.6);
scene.add(hemiLight);

// Create initial scene
const terrain = createTerrain();
// Create building with interior
const buildingGroup = new THREE.Group();
// Exterior walls
const buildingGeometry = new THREE.BoxGeometry(10, 8, 10);
const wallMaterial = new THREE.MeshStandardMaterial({
    color: 0x808080,
    side: THREE.DoubleSide // Render both sides of walls
});
// Create separate walls for the building
const walls = [
    // Back wall
    new THREE.Mesh(
        new THREE.PlaneGeometry(10, 8),
        wallMaterial
    ),
    // Left wall
    new THREE.Mesh(
        new THREE.PlaneGeometry(10, 8),
        wallMaterial
    ),
    // Right wall
    new THREE.Mesh(
        new THREE.PlaneGeometry(10, 8),
        wallMaterial
    ),
    // Front wall (with door hole)
    new THREE.Mesh(
        new THREE.PlaneGeometry(10, 8),
        wallMaterial
    ),
    // Ceiling
    new THREE.Mesh(
        new THREE.PlaneGeometry(10, 10),
        wallMaterial
    ),
];
// Position walls
walls[0].position.set(15, 4, 10); // Back
walls[1].position.set(10, 4, 15); // Left
walls[1].rotation.y = Math.PI / 2;
walls[2].position.set(20, 4, 15); // Right
walls[2].rotation.y = -Math.PI / 2;
walls[3].position.set(15, 4, 20); // Front
walls[4].position.set(15, 8, 15); // Ceiling
walls[4].rotation.x = Math.PI / 2;
walls.forEach(wall => buildingGroup.add(wall));
// Create player foot for kicking animation
const footGroup = new THREE.Group();
const bootGeometry = new THREE.BoxGeometry(0.15, 0.1, 0.3);
const bootMaterial = new THREE.MeshStandardMaterial({
    color: 0x000000
});
const boot = new THREE.Mesh(bootGeometry, bootMaterial);
boot.position.set(0, -0.05, 0);
footGroup.add(boot);
// Hide foot initially
footGroup.visible = false;
camera.add(footGroup);
footGroup.position.set(0, -0.5, -0.5);
const buildingMaterial = new THREE.MeshStandardMaterial({
    color: 0x808080
});
const building = new THREE.Mesh(buildingGeometry, buildingMaterial);
building.position.set(15, 4, 15);
buildingGroup.add(building);
// Create table and rifle inside house
const tableGeometry = new THREE.BoxGeometry(2, 1, 1);
const tableMaterial = new THREE.MeshStandardMaterial({
    color: 0x8B4513
});
const table = new THREE.Mesh(tableGeometry, tableMaterial);
table.position.set(15, 1, 17); // Position inside the house
buildingGroup.add(table);
// Create rifle on table
const rifleGroup = new THREE.Group();
// Rifle body
const rifleBody = new THREE.Mesh(
    new THREE.BoxGeometry(0.15, 0.15, 0.8),
    new THREE.MeshStandardMaterial({
        color: 0x2a2a2a
    })
);
// Rifle scope
const rifleScope = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04, 0.04, 0.25, 16),
    new THREE.MeshStandardMaterial({
        color: 0x111111
    })
);
rifleScope.rotation.z = Math.PI / 2;
rifleScope.position.set(0, 0.08, -0.1);
rifleGroup.add(rifleBody);
rifleGroup.add(rifleScope);
rifleGroup.position.set(15, 1.5, 17); // Position on table
rifleGroup.userData.isPickable = true;
buildingGroup.add(rifleGroup);
// Create door
const doorGeometry = new THREE.BoxGeometry(2, 4, 0.2);
const doorMaterial = new THREE.MeshStandardMaterial({
    color: 0x4a3520
});
const door = new THREE.Mesh(doorGeometry, doorMaterial);
door.position.set(15, 2, 20);
door.userData.isInteractable = true;
door.userData.isOpen = false;
buildingGroup.add(door);
// Add interaction text
const interactText = document.createElement('div');
interactText.style.position = 'fixed';
interactText.style.top = '50%';
interactText.style.left = '50%';
interactText.style.transform = 'translate(-50%, -50%)';
interactText.style.color = 'white';
interactText.style.fontFamily = 'Arial';
interactText.style.fontSize = '20px';
interactText.style.display = 'none';
interactText.textContent = 'Press E to enter';
document.body.appendChild(interactText);
scene.add(buildingGroup);
let isInCutscene = false;
let cutsceneStartTime = 0;
const cutsceneDuration = 1200; // Lengthened for more dramatic kick
const kickStages = {
    FOOT_APPEAR: 200, // Time for foot to appear
    WIND_UP: 400, // Time to raise leg
    KICK: 300, // Time for kick motion
    FOLLOW_THROUGH: 300 // Time for door falling and camera stabilizing
};
// Animation loop
function animate() {
    requestAnimationFrame(animate);
    if (assetsLoaded) {
        // Handle screen shake effect
        if (isShaking) {
            const elapsedShakeTime = Date.now() - shakeStartTime;
            if (elapsedShakeTime < SHAKE_DURATION) {
                const shakeIntensity = SHAKE_INTENSITY * (1 - elapsedShakeTime / SHAKE_DURATION);
                camera.position.x += (Math.random() - 0.5) * shakeIntensity;
                camera.position.y += (Math.random() - 0.5) * shakeIntensity;
                camera.position.z += (Math.random() - 0.5) * shakeIntensity;
            } else {
                isShaking = false;
                // Create portal effect
                const portalEffect = new THREE.PointLight(0x00ffff, 5, 10);
                scene.add(portalEffect);
                portalEffect.position.copy(camera.position);
                // Teleport back to ground with slight offset
                camera.position.set(
                    TUNNEL_LOCATION.x,
                    2, // Ground level
                    TUNNEL_LOCATION.z + 3 // Slightly in front of tunnel entrance
                );
                isInTunnel = false;
                // Remove portal effect after a short delay
                setTimeout(() => {
                    scene.remove(portalEffect);
                }, 1000);
            }
        }
        // Check if player is in tunnel
        const distanceToTunnel = new THREE.Vector2(
            camera.position.x - TUNNEL_LOCATION.x,
            camera.position.z - TUNNEL_LOCATION.z
        ).length();

        // Update tunnel status based on position and distance to tunnel entrance
        if (distanceToTunnel < 1.5) {
            isInTunnel = true;
            // Make tunnel visible when entered
            tunnelGroup.children.forEach(child => {
                if (child.material && child.material.transparent) {
                    child.material.opacity = 0.7;
                }
            });
        } else if (distanceToTunnel > 2) {
            isInTunnel = false;
            // Make tunnel invisible when exited
            tunnelGroup.children.forEach(child => {
                if (child.material && child.material.transparent) {
                    child.material.opacity = 0;
                }
            });
        }
        // Handle scroll interaction
        if (isInTunnel && !hasScroll) {
            const scrollGroup = scene.userData.tunnelGroup.children.find(
                child => child.userData.isInteractable
            );
            if (scrollGroup) {
                const distanceToScroll = camera.position.distanceTo(scrollGroup.position);
                if (distanceToScroll < 2) {
                    interactText.style.display = 'block';
                    interactText.textContent = 'Press E to take scroll';
                } else {
                    interactText.style.display = 'none';
                }
            }
        }
        // Update tunnel visibility and line if map is equipped
        const tunnelGroup = scene.userData.tunnelGroup;
        if (tunnelGroup) {
            tunnelGroup.traverse((child) => {
                if (child instanceof THREE.Mesh) {
                    if (isMapEquipped) {
                        // Make tunnel visible when map is equipped
                        child.material.opacity = 0.8;
                    } else {
                        // Hide tunnel when map is not equipped
                        child.material.opacity = 0;
                    }
                }
            });
        }
        // Update tunnel line if map is equipped
        if (isMapEquipped && camera.userData.tunnelLine) {
            const lineGeometry = camera.userData.tunnelLine.geometry;
            const startPoint = new THREE.Vector3(0.3, -0.3, -0.5).applyMatrix4(camera.matrixWorld);
            const points = [startPoint, TUNNEL_LOCATION];
            lineGeometry.setFromPoints(points);
        }
        if (!isInCutscene) {
            // Check for rifle pickup
            if (!hasRifle && rifleGroup.userData.isPickable) {
                const rifleDistance = camera.position.distanceTo(rifleGroup.position);
                if (rifleDistance < 2) {
                    hasRifle = true;
                    rifleGroup.visible = false;
                    // Create a copy of the rifle for the player's view
                    // Create detailed rifle model for player view
                    const playerRifle = new THREE.Group();

                    // Main rifle body
                    const rifleBody = new THREE.Mesh(
                        new THREE.BoxGeometry(0.1, 0.15, 1.0),
                        new THREE.MeshStandardMaterial({
                            color: 0x2a2a2a,
                            metalness: 0.7,
                            roughness: 0.2
                        })
                    );

                    // Rifle stock
                    const rifleStock = new THREE.Mesh(
                        new THREE.BoxGeometry(0.08, 0.2, 0.3),
                        new THREE.MeshStandardMaterial({
                            color: 0x4a3520,
                            metalness: 0.1,
                            roughness: 0.8
                        })
                    );
                    rifleStock.position.set(0, -0.05, 0.5);

                    // Rifle grip
                    const rifleGrip = new THREE.Mesh(
                        new THREE.BoxGeometry(0.08, 0.15, 0.1),
                        new THREE.MeshStandardMaterial({
                            color: 0x4a3520,
                            metalness: 0.1,
                            roughness: 0.8
                        })
                    );
                    rifleGrip.position.set(0, -0.1, 0.2);
                    rifleGrip.rotation.x = Math.PI / 6;

                    // Rifle scope
                    const scopeBody = new THREE.Mesh(
                        new THREE.CylinderGeometry(0.04, 0.04, 0.3, 16),
                        new THREE.MeshStandardMaterial({
                            color: 0x111111,
                            metalness: 0.9,
                            roughness: 0.1
                        })
                    );
                    scopeBody.rotation.z = Math.PI / 2;
                    scopeBody.position.set(0, 0.1, -0.2);

                    // Scope lens
                    const scopeLens = new THREE.Mesh(
                        new THREE.CircleGeometry(0.035, 16),
                        new THREE.MeshStandardMaterial({
                            color: 0x88ccff,
                            emissive: 0x88ccff,
                            emissiveIntensity: 0.5,
                            metalness: 1.0,
                            roughness: 0.0
                        })
                    );
                    scopeLens.position.set(0, 0.1, -0.35);

                    // Magazine
                    const magazine = new THREE.Mesh(
                        new THREE.BoxGeometry(0.08, 0.2, 0.1),
                        new THREE.MeshStandardMaterial({
                            color: 0x2a2a2a,
                            metalness: 0.7,
                            roughness: 0.2
                        })
                    );
                    magazine.position.set(0, -0.15, 0.1);

                    playerRifle.add(rifleBody, rifleStock, rifleGrip, scopeBody, scopeLens, magazine);
                    playerRifle.position.set(0.3, -0.3, -0.5);
                    playerRifle.rotation.y = Math.PI;
                    camera.add(playerRifle);

                    // Screen shake effect
                    const shakeIntensity = 0.05;
                    const shakeDuration = 500;
                    const shakeStart = Date.now();

                    function screenShake() {
                        const elapsed = Date.now() - shakeStart;
                        if (elapsed < shakeDuration) {
                            camera.position.x += (Math.random() - 0.5) * shakeIntensity;
                            camera.position.y += (Math.random() - 0.5) * shakeIntensity;
                            requestAnimationFrame(screenShake);
                        }
                    }
                    screenShake();

                    // Spawn enemies when rifle is picked up
                    spawnEnemies();
                }
            }

            // Check for door interaction
            const doorDistance = camera.position.distanceTo(door.position);
            if (doorDistance < 3) {
                interactText.style.display = 'block';
            } else {
                interactText.style.display = 'none';
            }
        } else {
            // Handle cutscene
            const cutsceneTime = Date.now() - cutsceneStartTime;
            if (cutsceneTime < cutsceneDuration) {
                // Disable controls during cutscene

                // Foot appear animation
                if (cutsceneTime < kickStages.FOOT_APPEAR) {
                    const appearProgress = cutsceneTime / kickStages.FOOT_APPEAR;
                    footGroup.visible = true;
                    footGroup.position.y = -0.5 + (appearProgress * 0.2);
                    footGroup.rotation.x = 0;
                }
                // Wind up animation (raising leg)
                else if (cutsceneTime < (kickStages.FOOT_APPEAR + kickStages.WIND_UP)) {
                    const windUpProgress = (cutsceneTime - kickStages.FOOT_APPEAR) / kickStages.WIND_UP;
                    // Raise foot
                    footGroup.position.y = -0.3 + (windUpProgress * 0.5);
                    footGroup.rotation.x = -windUpProgress * Math.PI / 2;
                    // Tilt camera back slightly
                    camera.rotation.x = Math.min(0.2, windUpProgress * 0.2);
                }
                // Kick motion
                else if (cutsceneTime < (kickStages.FOOT_APPEAR + kickStages.WIND_UP + kickStages.KICK)) {
                    const kickProgress = (cutsceneTime - kickStages.FOOT_APPEAR - kickStages.WIND_UP) / kickStages.KICK;
                    // Kick motion
                    footGroup.position.y = 0.2 - (kickProgress * 0.7);
                    footGroup.position.z = -0.5 - (kickProgress * 0.5);
                    footGroup.rotation.x = (-Math.PI / 2) + (kickProgress * Math.PI / 1.5);
                    // Camera recoil
                    camera.position.y = 2.2 - (kickProgress * 0.2);
                    camera.rotation.x = Math.max(0, 0.2 - (kickProgress * 0.3));

                    // Animate door being kicked down
                    if (kickProgress > 0.2) { // Slight delay before door moves
                        door.rotation.y = Math.min(Math.PI / 2, kickProgress * Math.PI / 2);
                        door.position.y = Math.max(0, 2 - (kickProgress * 2));
                        door.rotation.z = kickProgress * 0.3; // Door tilts as it falls
                    }
                }
                // Follow through
                else {
                    const followThroughProgress = (cutsceneTime - kickStages.FOOT_APPEAR - kickStages.WIND_UP - kickStages.KICK) / kickStages.FOLLOW_THROUGH;
                    // Reset foot position
                    footGroup.position.y = -0.5;
                    footGroup.position.z = -0.5;
                    footGroup.rotation.x = 0;
                    footGroup.visible = false;
                    // Stabilize camera
                    camera.position.y = 2;
                    camera.rotation.x = 0;

                    // Finish door animation
                    door.rotation.y = Math.PI / 2;
                    door.position.y = 0;
                    door.rotation.z = 0.3;
                }
                return;
            } else {
                isInCutscene = false;
                door.userData.isOpen = true;
                interactText.style.display = 'none';
            }
        }

        // Handle sprint energy
        if (isSprinting && sprintEnergy > 0) {
            sprintEnergy = Math.max(0, sprintEnergy - (sprintDrainRate * clock.getDelta()));
            if (sprintEnergy === 0) {
                isSprinting = false;
                moveSpeed = normalMoveSpeed;
            }
        } else if (!isSprinting && Date.now() - lastSprintTime > sprintRegenDelay) {
            sprintEnergy = Math.min(maxSprintEnergy, sprintEnergy + (sprintRegenRate * clock.getDelta()));
        }

        // Update sprint bar UI
        sprintBarFill.style.width = `${(sprintEnergy / maxSprintEnergy) * 100}%`;
        sprintBarFill.style.backgroundColor = sprintEnergy > 30 ? '#00ff00' : '#ff0000';

        applyControls(); // Apply camera controls
        // Update bullets
        const now = Date.now();
        for (let i = bullets.length - 1; i >= 0; i--) {
            const bullet = bullets[i];
            bullet.position.add(bullet.userData.direction.multiplyScalar(bulletSpeed));

            // Remove bullets after 2 seconds or if they've traveled too far
            if (now - bullet.userData.createdAt > 2000 ||
                bullet.position.distanceTo(camera.position) > 100) {
                scene.remove(bullet);
                bullets.splice(i, 1);
            }
        }
    }

    // Update enemies
    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];

        // Basic AI movement
        const directionToPlayer = new THREE.Vector3()
            .subVectors(camera.position, enemy.position)
            .normalize();

        // Move towards player
        // Update walking animation
        const walkAnim = enemy.userData.walkAnimation;
        walkAnim.time += 0.1;

        // Animate legs
        const leftLeg = enemy.getObjectByName('leftLeg');
        const rightLeg = enemy.getObjectByName('rightLeg');
        if (leftLeg && rightLeg) {
            leftLeg.rotation.x = Math.sin(walkAnim.time * walkAnim.speed) * walkAnim.legSwing;
            rightLeg.rotation.x = -Math.sin(walkAnim.time * walkAnim.speed) * walkAnim.legSwing;
        }

        // Animate arms
        const leftArm = enemy.getObjectByName('leftArm');
        const rightArm = enemy.getObjectByName('rightArm');
        if (leftArm && rightArm) {
            leftArm.rotation.x = -Math.sin(walkAnim.time * walkAnim.speed) * walkAnim.legSwing;
            rightArm.rotation.x = Math.sin(walkAnim.time * walkAnim.speed) * walkAnim.legSwing;
        }

        // Move enemy
        enemy.position.add(directionToPlayer.multiplyScalar(0.05));

        // Rotate to face player
        enemy.lookAt(camera.position);

        // Shoot at player
        if (Date.now() - enemy.userData.lastShot > 2000) { // Shoot every 2 seconds
            const bulletGeometry = new THREE.SphereGeometry(0.05, 8, 8);
            const bulletMaterial = new THREE.MeshStandardMaterial({
                color: 0xff0000,
                emissive: 0xff0000
            });
            const bullet = new THREE.Mesh(bulletGeometry, bulletMaterial);
            bullet.position.copy(enemy.position);

            const direction = new THREE.Vector3()
                .subVectors(camera.position, enemy.position)
                .normalize();

            bullet.userData.direction = direction;
            bullet.userData.isEnemyBullet = true;
            bullet.userData.createdAt = Date.now();

            scene.add(bullet);
            bullets.push(bullet);

            enemy.userData.lastShot = Date.now();
        }
    }

    // Check for enemy bullet collisions with player
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        if (!bullet.userData.isEnemyBullet) {
            // Check for collision with enemies
            for (let j = enemies.length - 1; j >= 0; j--) {
                const enemy = enemies[j];
                const distanceToEnemy = bullet.position.distanceTo(enemy.position);
                if (distanceToEnemy < 1) {
                    // Enemy hit
                    enemy.userData.health -= ENEMY_DAMAGE_PER_HIT;
                    // Update enemy health bar
                    const healthBar = enemy.getObjectByName('healthBar');
                    if (healthBar) {
                        const healthPercent = enemy.userData.health / ENEMY_MAX_HEALTH;
                        healthBar.scale.x = Math.max(0, healthPercent);
                        healthBar.material.color.setHSL(healthPercent * 0.3, 1, 0.5);
                    }

                    // Remove bullet
                    scene.remove(bullet);
                    bullets.splice(i, 1);

                    // Check if enemy is defeated
                    if (enemy.userData.health <= 0) {
                        scene.remove(enemy);
                        enemies.splice(j, 1);

                        // Check if all enemies are defeated
                        if (enemies.length === 0 && !hasMap) {
                            hasMap = true;
                            inventory.weapons.push('map');
                            // Update inventory display
                            const weaponsList = document.getElementById('weaponsList');
                            weaponsList.innerHTML += '<div>M. Map</div>';
                            // Show notification
                            const notification = document.createElement('div');
                            notification.style.position = 'fixed';
                            notification.style.top = '20%';
                            notification.style.left = '50%';
                            notification.style.transform = 'translate(-50%, -50%)';
                            notification.style.color = 'white';
                            notification.style.fontSize = '24px';
                            notification.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
                            notification.style.padding = '10px';
                            notification.style.borderRadius = '5px';
                            notification.textContent = 'You found a map! Press M to view it.';
                            document.body.appendChild(notification);
                            setTimeout(() => document.body.removeChild(notification), 3000);
                        }
                    }
                    break;
                }
            }
        } else if (bullet.userData.isEnemyBullet) {
            const distanceToPlayer = bullet.position.distanceTo(camera.position);
            if (distanceToPlayer < 0.5) {
                // Player hit
                playerHealth = Math.max(0, playerHealth - 10);
                healthBarFill.style.width = `${(playerHealth / maxPlayerHealth) * 100}%`;

                // Remove bullet
                scene.remove(bullet);
                bullets.splice(i, 1);
            }
        }
    }

    // Handle game won state and fade effect
    if (gameWon) {
        const fadeElapsed = Date.now() - fadeStart;
        if (fadeElapsed < fadeDuration) {
            const opacity = fadeElapsed / fadeDuration;
            renderer.setClearColor(0x000000, opacity);
        }
    }

    composer.render();
}

// Handle window resize
function onWindowResize() {
    const width = parentDiv.clientWidth;
    const height = parentDiv.clientHeight;

    // Update camera
    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    // Update renderer and composer
    renderer.setSize(width, height);
    composer.setSize(width, height);

    // Update post-processing passes
    bloomPass.resolution.set(width, height);
    smaaPass.setSize(width, height);
}

// Add event listeners
window.addEventListener('resize', onWindowResize);
const resizeObserver = new ResizeObserver(onWindowResize);
resizeObserver.observe(parentDiv);

// Start animation
animate();

// =========================
// Mobile Controls Integration
// =========================

// Create a container for the D-pad
const dpadContainer = document.createElement('div');
dpadContainer.id = 'dpadContainer';
document.body.appendChild(dpadContainer);

// Create directional buttons
const directions = ['up', 'down', 'left', 'right'];
directions.forEach(direction => {
    const button = document.createElement('button');
    button.id = `${direction}Button`;
    button.classList.add('dpad-button');
    // Set the appropriate icon based on direction
    let iconUrl = '';
    switch (direction) {
        case 'up':
            iconUrl = 'https://play.rosebud.ai/assets/up_chevron.png?YWEq';
            break;
        case 'down':
            iconUrl = 'https://play.rosebud.ai/assets/down_chevron.png?yojk';
            break;
        case 'left':
            iconUrl = 'https://play.rosebud.ai/assets/left_chevron.png?C3aB';
            break;
        case 'right':
            iconUrl = 'https://play.rosebud.ai/assets/right_chevron.png?mSRu';
            break;
    }
    button.style.backgroundImage = `url('${iconUrl}')`;
    dpadContainer.appendChild(button);
});

// Create a container for the Jump button
const jumpContainer = document.createElement('div');
jumpContainer.id = 'jumpContainer';
document.body.appendChild(jumpContainer);

// Create Jump button
const jumpButton = document.createElement('button');
jumpButton.id = 'jumpButton';
jumpButton.classList.add('jump-button');
jumpButton.style.backgroundImage = `url('https://play.rosebud.ai/assets/Up-Arrow.png?64aM')`;
jumpContainer.appendChild(jumpButton);

// Inject CSS styles dynamically
const styles = `
/* D-Pad Container */
#dpadContainer {
    position: fixed;
    bottom: 150px; /* Moved up further */
    left: 30px; /* Moved inward */
    width: 150px; /* Increased size */
    height: 150px; /* Increased size */
    display: grid;
    grid-template-areas:
        ".   up   ."
        "left  . right"
        ".  down  .";
    grid-gap: 10px; /* Spacing between buttons */
    z-index: 1000;
}

/* Positioning each button in the grid */
#upButton {
    grid-area: up;
}

#downButton {
    grid-area: down;
}

#leftButton {
    grid-area: left;
}

#rightButton {
    grid-area: right;
}

/* D-Pad Buttons */
.dpad-button {
    width: 50px; /* Consistent size */
    height: 50px; /* Consistent size */
    margin: 0; /* Remove margin as grid-gap handles spacing */
    background-color: rgba(0, 0, 0, 0.5); /* Dark semi-transparent background */
    background-size: 60%; /* Uniform icon size */
    background-repeat: no-repeat;
    background-position: center;
    border: none;
    border-radius: 12px; /* Rounded corners */
    opacity: 0.9; /* Higher opacity */
    transition: 
        opacity 0.2s, 
        transform 0.1s, 
        box-shadow 0.2s, 
        filter 0.2s; /* Smooth transitions */
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3); /* Initial shadow */
}

/* Active State for D-Pad Buttons */
.dpad-button:active {
    opacity: 1;
    transform: scale(0.95);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.5); /* Shadow becomes more pronounced */
    filter: brightness(1.1); /* Slight brightness increase */
}

/* Jump Button Container */
#jumpContainer {
    position: fixed;
    bottom: 150px; /* Moved up further */
    right: 30px; /* Moved inward */
    width: 80px; /* Maintained size */
    height: 80px; /* Maintained size */
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
}

/* Jump Button */
.jump-button {
    width: 70px; /* Increased size */
    height: 70px; /* Increased size */
    background-color: rgba(0, 0, 0, 0.5); /* Dark semi-transparent background */
    background-size: 60%; /* Uniform icon size */
    background-repeat: no-repeat;
    background-position: center;
    border: none;
    border-radius: 35px; /* Fully rounded */
    opacity: 0.9; /* Higher opacity */
    transition: 
        opacity 0.2s, 
        transform 0.1s, 
        box-shadow 0.2s, 
        filter 0.2s; /* Smooth transitions */
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3); /* Initial shadow */
    background-image: url('https://play.rosebud.ai/assets/Up-Arrow.png?64aM'); /* Jump button icon */
}

/* Active State for Jump Button */
.jump-button:active {
    opacity: 1;
    transform: scale(0.95);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.5); /* Shadow becomes more pronounced */
    filter: brightness(1.1); /* Slight brightness increase */
}

/* Responsive Adjustments */
@media (max-width: 600px) {
    /* D-Pad Container */
    #dpadContainer {
        bottom: 120px; /* Increased from 80px to move up on smaller screens */
        left: 25px;
        width: 120px;
        height: 120px;
    }

    /* D-Pad Buttons */
    .dpad-button {
        width: 40px;
        height: 40px;
        background-size: 60%; /* Ensure uniform size */
    }

    /* Jump Button Container */
    #jumpContainer {
        bottom: 120px; /* Increased from 80px */
        right: 25px;
        width: 60px;
        height: 60px;
    }

    /* Jump Button */
    .jump-button {
        width: 60px;
        height: 60px;
        background-size: 60%; /* Ensure uniform size */
    }
}
`;

// Append the styles to the head
const styleSheet = document.createElement("style");
styleSheet.type = "text/css";
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);

// Define keysPressed object with standardized key names
const keysPressed = {
    up: false,
    down: false,
    left: false,
    right: false,
    jump: false,
};

// Helper functions to handle button presses
function addButtonListeners(buttonId, key) {
    const button = document.getElementById(buttonId);
    if (!button) return;

    // Prevent default to avoid unwanted scrolling or other behaviors
    button.addEventListener('touchstart', (event) => {
        event.preventDefault();
        keysPressed[key] = true;
    }, {
        passive: false
    });

    button.addEventListener('touchend', (event) => {
        event.preventDefault();
        keysPressed[key] = false;
    }, {
        passive: false
    });

    // Also handle mouse events for desktop compatibility
    button.addEventListener('mousedown', (event) => {
        event.preventDefault();
        keysPressed[key] = true;
    });

    button.addEventListener('mouseup', (event) => {
        event.preventDefault();
        keysPressed[key] = false;
    });

    button.addEventListener('mouseleave', (event) => {
        event.preventDefault();
        keysPressed[key] = false;
    });
}

// Map buttons to standardized keys
addButtonListeners('upButton', 'up');
addButtonListeners('downButton', 'down');
addButtonListeners('leftButton', 'left');
addButtonListeners('rightButton', 'right');
addButtonListeners('jumpButton', 'jump');

// =========================
// Keyboard Controls Integration
// =========================

// Add event listeners for keyboard controls
window.addEventListener('keydown', (event) => {
    switch (event.code) {
        case 'Tab':
            event.preventDefault();
            isInventoryOpen = !isInventoryOpen;
            inventoryDisplay.style.display = isInventoryOpen ? 'block' : 'none';
            break;
        case 'KeyM':
            if (hasMap) {
                isMapEquipped = !isMapEquipped;
                if (isMapEquipped) {
                    // Hide all weapons
                    gunGroup.visible = false;
                    if (hasRifle) {
                        rifleGroup.visible = false;
                    }
                    // Show map in hand with tunnel marker
                    const mapGeometry = new THREE.PlaneGeometry(0.5, 0.5);
                    const mapCanvas = document.createElement('canvas');

                    // Create line to tunnel
                    const lineMaterial = new THREE.LineBasicMaterial({
                        color: 0xff0000,
                        linewidth: 2,
                        transparent: true,
                        opacity: 0.6
                    });
                    const lineGeometry = new THREE.BufferGeometry();
                    const mapPosition = new THREE.Vector3(0.3, -0.3, -0.5); // Map position in hand
                    const points = [
                        mapPosition,
                        TUNNEL_LOCATION
                    ];
                    lineGeometry.setFromPoints(points);
                    const tunnelLine = new THREE.Line(lineGeometry, lineMaterial);
                    scene.add(tunnelLine);
                    // Store line reference for removal
                    camera.userData.tunnelLine = tunnelLine;
                    mapCanvas.width = 512;
                    mapCanvas.height = 512;
                    const ctx = mapCanvas.getContext('2d');

                    // Draw map background
                    ctx.fillStyle = '#f4d03f';
                    ctx.fillRect(0, 0, 512, 512);

                    // Draw player position
                    const playerX = (camera.position.x + 100) * (512 / 200);
                    const playerZ = (camera.position.z + 100) * (512 / 200);
                    ctx.fillStyle = '#0000ff';
                    ctx.beginPath();
                    ctx.arc(playerX, playerZ, 5, 0, Math.PI * 2);
                    ctx.fill();

                    // Calculate distance to tunnel
                    tunnelMarkerDistance = camera.position.distanceTo(TUNNEL_LOCATION);
                    const intensity = Math.max(0, 1 - tunnelMarkerDistance / MAP_INDICATOR_RADIUS);

                    // Draw tunnel marker with distance-based intensity
                    if (!tunnelFound && tunnelMarkerDistance < MAP_INDICATOR_RADIUS) {
                        const markerX = (TUNNEL_LOCATION.x + 100) * (512 / 200);
                        const markerZ = (TUNNEL_LOCATION.z + 100) * (512 / 200);

                        // Draw pulsing marker
                        const pulseSize = 8 + Math.sin(Date.now() * 0.005) * 2;

                        // Draw outer glow
                        const gradient = ctx.createRadialGradient(
                            markerX, markerZ, 0,
                            markerX, markerZ, pulseSize * 2
                        );
                        gradient.addColorStop(0, `rgba(255, 0, 0, ${intensity})`);
                        gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');

                        ctx.fillStyle = gradient;
                        ctx.beginPath();
                        ctx.arc(markerX, markerZ, pulseSize * 2, 0, Math.PI * 2);
                        ctx.fill();

                        // Draw center marker
                        ctx.fillStyle = `rgba(255, 0, 0, ${intensity})`;
                        ctx.beginPath();
                        ctx.arc(markerX, markerZ, pulseSize, 0, Math.PI * 2);
                        ctx.fill();

                        // Add "ENTRANCE" text
                        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                        ctx.font = '16px Arial';
                        ctx.textAlign = 'center';
                        ctx.fillText('ENTRANCE', markerX, markerZ + 20);
                    }

                    const mapTexture = new THREE.CanvasTexture(mapCanvas);
                    const mapMaterial = new THREE.MeshBasicMaterial({
                        map: mapTexture,
                        side: THREE.DoubleSide
                    });
                    const mapMesh = new THREE.Mesh(mapGeometry, mapMaterial);
                    mapMesh.position.set(0.3, -0.3, -0.5);
                    mapMesh.rotation.y = Math.PI / 4;
                    camera.add(mapMesh);
                } else {
                    // Remove map and show weapon
                    camera.remove(camera.children[camera.children.length - 1]);
                    // Remove tunnel line
                    if (camera.userData.tunnelLine) {
                        scene.remove(camera.userData.tunnelLine);
                        camera.userData.tunnelLine = null;
                    }
                    gunGroup.visible = true;
                }
            }
            break;
        case 'Digit1':
        case 'Digit2':
        case 'Digit3':
        case 'Digit4':
            if (isMapEquipped) {
                // Remove map and restore previous weapon
                camera.remove(camera.children[camera.children.length - 1]);
                isMapEquipped = false;
                if (inventory.activeWeapon === 'pistol') {
                    gunGroup.visible = true;
                    if (hasRifle) rifleGroup.visible = false;
                } else if (inventory.activeWeapon === 'rifle' && hasRifle) {
                    gunGroup.visible = false;
                    rifleGroup.visible = true;
                }
            } else {
                // Regular weapon switching
                if (event.code === 'Digit1' && inventory.weapons.includes('pistol')) {
                    inventory.activeWeapon = 'pistol';
                    gunGroup.visible = true;
                    if (hasRifle) rifleGroup.visible = false;
                } else if (event.code === 'Digit2' && inventory.weapons.includes('rifle')) {
                    inventory.activeWeapon = 'rifle';
                    gunGroup.visible = false;
                    rifleGroup.visible = true;
                }
            }
            break;
        case 'KeyH':
            controlsDisplay.style.display = controlsDisplay.style.display === 'none' ? 'block' : 'none';
            break;
        case 'KeyE':
            // Check door interaction first
            if (!isInCutscene && door.userData.isInteractable && !door.userData.isOpen) {
                const doorDistance = camera.position.distanceTo(door.position);
                if (doorDistance < 3) {
                    // Start cutscene
                    isInCutscene = true;
                    cutsceneStartTime = Date.now();
                    // Store original camera rotation
                    camera.userData.originalRotation = camera.rotation.x;
                    // Align camera with door
                    const directionToDoor = new THREE.Vector3()
                        .subVectors(door.position, camera.position)
                        .normalize();
                    camera.rotation.y = Math.atan2(directionToDoor.x, directionToDoor.z);
                }
            }
            // Then check tunnel interactions
            else if (isInTunnel) {
                // Check for chest interaction
                if (!chestOpened && isInWater) {
                    const chest = tunnelGroup.children.find(child => child.userData.isInteractable);
                    if (chest && camera.position.distanceTo(chest.position) < 2) {
                        chestOpened = true;
                        hasRuby = true;
                        const lid = chest.children[0];
                        lid.rotation.x = Math.PI / 2;
                        // Show notification
                        const notification = document.createElement('div');
                        notification.style.position = 'fixed';
                        notification.style.top = '20%';
                        notification.style.left = '50%';
                        notification.style.transform = 'translate(-50%, -50%)';
                        notification.style.color = 'white';
                        notification.style.fontSize = '24px';
                        notification.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
                        notification.style.padding = '10px';
                        notification.style.borderRadius = '5px';
                        notification.textContent = 'You found a ruby!';
                        document.body.appendChild(notification);
                        setTimeout(() => document.body.removeChild(notification), 3000);
                    }
                }
            } else if (hasRuby && !isDragonSpawned) {
                // Place ruby in door
                hasRuby = false;
                // Spawn dragon and tank
                spawnDragonAndTank();
                isDragonSpawned = true;
                dragonHealthContainer.style.display = 'block';
            } else if (!isInCutscene && door.userData.isInteractable && !door.userData.isOpen) {
                const scrollGroup = scene.userData.tunnelGroup.children.find(
                    child => child.userData.isInteractable
                );
                if (scrollGroup) {
                    const distanceToScroll = camera.position.distanceTo(scrollGroup.position);
                    if (distanceToScroll < 2) {
                        // Take scroll
                        hasScroll = true;
                        scrollGroup.visible = false;

                        // Start screen shake
                        isShaking = true;
                        shakeStartTime = Date.now();

                        // Hide interaction text
                        interactText.style.display = 'none';
                    }
                }
            }
            // Finally check ruby/dragon interactions
            else if (hasRuby && !isDragonSpawned) {
                // Place ruby in door
                hasRuby = false;
                // Spawn dragon and tank
                spawnDragonAndTank();
                isDragonSpawned = true;
                dragonHealthContainer.style.display = 'block';
            }
            break;
        case 'ShiftLeft':
            if (!isSliding && sprintEnergy > 0) {
                isSprinting = true;
                moveSpeed = sprintMoveSpeed;
                lastSprintTime = Date.now();
            }
            break;
        case 'ControlLeft':
            if (isSprinting && !isSliding) {
                isSliding = true;
                slideStart = Date.now();
                // Store current movement direction for slide
                const rotation = camera.rotation.y;
                slideDirection.set(
                    -Math.sin(rotation),
                    0,
                    -Math.cos(rotation)
                );
                isSprinting = false;
            }
            break;
        case 'ArrowUp':
        case 'KeyW':
            keysPressed.up = true;
            break;
        case 'ArrowDown':
        case 'KeyS':
            keysPressed.down = true;
            break;
        case 'ArrowLeft':
        case 'KeyA':
            keysPressed.left = true;
            break;
        case 'ArrowRight':
        case 'KeyD':
            keysPressed.right = true;
            break;
        case 'KeyG':
            if (hasRifle) {
                currentWeapon = currentWeapon === 'pistol' ? 'rifle' : 'pistol';
                // Update gun model visibility
                if (currentWeapon === 'rifle') {
                    gunGroup.visible = false;
                    rifleGroup.visible = true;
                } else {
                    gunGroup.visible = true;
                    rifleGroup.visible = false;
                }
            }
            break;
        case 'Space':
            keysPressed.jump = true;
            break;
        default:
            break;
    }
});

window.addEventListener('keyup', (event) => {
    switch (event.code) {
        case 'ShiftLeft':
            if (!isSliding) {
                isSprinting = false;
                moveSpeed = normalMoveSpeed;
            }
            break;
        case 'ArrowUp':
        case 'KeyW':
            keysPressed.up = false;
            break;
        case 'ArrowDown':
        case 'KeyS':
            keysPressed.down = false;
            break;
        case 'ArrowLeft':
        case 'KeyA':
            keysPressed.left = false;
            break;
        case 'ArrowRight':
        case 'KeyD':
            keysPressed.right = false;
            break;
        case 'Space':
            keysPressed.jump = false;
            break;
        default:
            break;
    }
});

// =========================
// End of Mobile and Keyboard Controls Integration
// =========================

// Function to apply controls based on keysPressed
function applyControls() {
    // Calculate forward direction based on camera rotation
    const direction = new THREE.Vector3();
    const rotation = camera.rotation.y;
    // Handle sliding
    if (isSliding) {
        const slideTime = Date.now() - slideStart;
        if (slideTime < slideDuration) {
            // Apply slide movement
            direction.copy(slideDirection).multiplyScalar(
                slideSpeed * (1 - (slideTime / slideDuration))
            );
            // Lower camera during slide
            camera.position.y = 1.5;
        } else {
            // End slide
            isSliding = false;
            camera.position.y = 2;
            moveSpeed = normalMoveSpeed;
        }
    }
    if (keysPressed.up) {
        direction.x -= Math.sin(rotation) * moveSpeed;
        direction.z -= Math.cos(rotation) * moveSpeed;
    }
    if (keysPressed.down) {
        direction.x += Math.sin(rotation) * moveSpeed;
        direction.z += Math.cos(rotation) * moveSpeed;
    }
    if (keysPressed.left) {
        direction.x += Math.sin(rotation - Math.PI / 2) * moveSpeed;
        direction.z += Math.cos(rotation - Math.PI / 2) * moveSpeed;
    }
    if (keysPressed.right) {
        direction.x += Math.sin(rotation + Math.PI / 2) * moveSpeed;
        direction.z += Math.cos(rotation + Math.PI / 2) * moveSpeed;
    }
    // Apply jumping and gravity
    if (keysPressed.jump && !isJumping) {
        verticalVelocity = jumpForce;
        isJumping = true;
    }
    // Apply gravity or swimming physics
    if (isInWater) {
        // Slower movement in water
        verticalVelocity = verticalVelocity * 0.9;
        if (keysPressed.up) {
            verticalVelocity += 0.01; // Swim up
        }
        if (keysPressed.down) {
            verticalVelocity -= 0.01; // Swim down
        }
        camera.position.y += verticalVelocity;
    } else if (isInTunnel) {
        // Allow movement within tunnel bounds
        const tunnelBounds = {
            minX: TUNNEL_LOCATION.x - 3.5,
            maxX: TUNNEL_LOCATION.x + 3.5,
            minZ: TUNNEL_LOCATION.z - 7,
            maxZ: TUNNEL_LOCATION.z + 7,
            minY: TUNNEL_END.y,
            maxY: TUNNEL_LOCATION.y
        };

        const nextPosition = camera.position.clone().add(direction);

        // Only allow movement within tunnel bounds
        if (nextPosition.x >= tunnelBounds.minX &&
            nextPosition.x <= tunnelBounds.maxX &&
            nextPosition.z >= tunnelBounds.minZ &&
            nextPosition.z <= tunnelBounds.maxZ) {
            camera.position.add(direction);
        }

        // Maintain tunnel height
        if (camera.position.y < -2 || camera.position.y > 1) {
            camera.position.y = -2;
            verticalVelocity = 0;
        }

        // Check for chest interaction
        if (!chestOpened && scene.userData.tunnelGroup) {
            const chest = scene.userData.tunnelGroup.children.find(child => child.userData.isInteractable);
            if (chest) {
                const distanceToChest = camera.position.distanceTo(chest.position);
                if (distanceToChest < 2) {
                    interactText.style.display = 'block';
                    interactText.textContent = 'Press E to open chest';
                } else {
                    interactText.style.display = 'none';
                }
            }
        }
    } else {
        verticalVelocity += gravity;
        camera.position.y += verticalVelocity;
    }

    // Check if player is above tunnel hole
    const distanceToTunnel = new THREE.Vector2(
        camera.position.x - TUNNEL_LOCATION.x,
        camera.position.z - TUNNEL_LOCATION.z
    ).length();

    // Ground collision (except for tunnel hole)
    if (camera.position.y <= 2) {
        // Check if player is at either tunnel entrance
        if (distanceToTunnel < 1 && !isInTunnel) {
            if (camera.position.y < 10) { // At ground entrance
                // Teleport to sky tunnel entrance
                camera.position.set(TUNNEL_LOCATION.x, TUNNEL_LOCATION.y, TUNNEL_LOCATION.z);
            } else { // At sky entrance
                // Teleport to ground tunnel entrance
                camera.position.set(TUNNEL_END.x, TUNNEL_END.y + 3, TUNNEL_END.z);
            }
            isInTunnel = true;
            verticalVelocity = 0;
        } else if (distanceToTunnel > 1) {
            // Normal ground collision
            camera.position.y = 2;
            verticalVelocity = 0;
            isJumping = false;
        }
    }
    // Check building collision before moving
    const nextPosition = camera.position.clone().add(direction);
    const buildingBounds = new THREE.Box3().setFromObject(building);
    const playerBounds = new THREE.Sphere(nextPosition, 0.5);

    // Only move if not colliding with building (except when door is open and player is near it)
    if (!buildingBounds.intersectsSphere(playerBounds) ||
        (door.userData.isOpen && door.position.distanceTo(nextPosition) < 3)) {
        camera.position.add(direction);
    }

    // Update gun position based on movement and zoom state
    if (!isZoomedIn) {
        gunGroup.position.x = 0.3 + Math.sin(clock.getElapsedTime() * 5) * 0.01;
        gunGroup.position.y = -0.3 + Math.abs(Math.sin(clock.getElapsedTime() * 10)) * 0.01;
        gunGroup.position.z = -0.5;
    }
}
// Function to spawn enemies
function spawnEnemies() {
    enemySpawnPoints.forEach(spawnPoint => {
        // Create enemy mesh
        // Create enemy group
        const enemy = new THREE.Group();

        // Body
        const bodyGeometry = new THREE.CylinderGeometry(0.3, 0.3, 1.2, 8);
        const bodyMaterial = new THREE.MeshStandardMaterial({
            color: 0x444444
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 0.6;

        // Head
        const headGeometry = new THREE.SphereGeometry(0.2, 8, 8);
        const headMaterial = new THREE.MeshStandardMaterial({
            color: 0xffdbac
        });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 1.5;

        // Arms
        const armGeometry = new THREE.CylinderGeometry(0.08, 0.08, 0.6, 8);
        const armMaterial = new THREE.MeshStandardMaterial({
            color: 0x444444
        });

        const leftArm = new THREE.Mesh(armGeometry, armMaterial);
        leftArm.name = 'leftArm';
        leftArm.position.set(-0.4, 1.0, 0);
        leftArm.rotation.z = -Math.PI / 3;
        const rightArm = new THREE.Mesh(armGeometry, armMaterial);
        rightArm.name = 'rightArm';
        rightArm.position.set(0.4, 1.0, 0);
        rightArm.rotation.z = Math.PI / 3;

        // Legs
        const legGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.8, 8);
        const legMaterial = new THREE.MeshStandardMaterial({
            color: 0x1a1a1a
        });

        const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
        leftLeg.name = 'leftLeg';
        leftLeg.position.set(-0.2, 0.2, 0);
        const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
        rightLeg.name = 'rightLeg';
        rightLeg.position.set(0.2, 0.2, 0);

        enemy.add(body, head, leftArm, rightArm, leftLeg, rightLeg);

        // Position enemy
        enemy.position.copy(spawnPoint);

        // Add enemy rifle
        const enemyRifle = new THREE.Group();

        // Rifle body
        const rifleBody = new THREE.Mesh(
            new THREE.BoxGeometry(0.1, 0.15, 0.8),
            new THREE.MeshStandardMaterial({
                color: 0x2a2a2a,
                metalness: 0.7
            })
        );

        // Rifle stock
        const rifleStock = new THREE.Mesh(
            new THREE.BoxGeometry(0.08, 0.2, 0.3),
            new THREE.MeshStandardMaterial({
                color: 0x4a3520
            })
        );
        rifleStock.position.set(0, -0.05, 0.4);

        // Rifle scope
        const scope = new THREE.Mesh(
            new THREE.CylinderGeometry(0.03, 0.03, 0.2, 8),
            new THREE.MeshStandardMaterial({
                color: 0x111111
            })
        );
        scope.rotation.z = Math.PI / 2;
        scope.position.set(0, 0.1, -0.1);

        enemyRifle.add(rifleBody, rifleStock, scope);
        enemyRifle.position.set(0.6, 1.0, -0.3);
        enemyRifle.rotation.y = -Math.PI / 2;
        enemy.add(enemyRifle);

        // Add enemy properties
        enemy.userData.lastShot = 0;
        enemy.userData.health = ENEMY_MAX_HEALTH;

        // Add health bar
        const healthBarWidth = 1;
        const healthBarHeight = 0.1;
        const healthBarGeometry = new THREE.PlaneGeometry(healthBarWidth, healthBarHeight);
        const healthBarMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ff00,
            side: THREE.DoubleSide
        });
        const healthBar = new THREE.Mesh(healthBarGeometry, healthBarMaterial);
        healthBar.name = 'healthBar';
        healthBar.position.y = 2.2; // Position above enemy head

        // Add black background for health bar
        const healthBarBg = new THREE.Mesh(
            healthBarGeometry,
            new THREE.MeshBasicMaterial({
                color: 0x000000,
                side: THREE.DoubleSide
            })
        );
        healthBarBg.position.y = 2.2;

        enemy.add(healthBarBg);
        enemy.add(healthBar);

        // Add animation properties
        enemy.userData.walkAnimation = {
            time: 0,
            speed: 5,
            legSwing: 0.3
        };

        scene.add(enemy);
        enemies.push(enemy);
    });
}