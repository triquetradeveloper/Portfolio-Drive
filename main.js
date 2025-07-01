import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { Sky } from 'three/addons/objects/Sky.js';

let camera, scene, renderer;
let controls;
let sky, sun, directionalLight, ambientLight;
let carHeadlight1, carHeadlight2;

// Store settings for easy switching
const daySettings = {
    elevation: 10,
    ambientIntensity: 0.4,
    directionalIntensity: 1.2,
    fogColor: 0xcccccc,
    fogNear: 200,
    fogFar: 1000
};

const nightSettings = {
    elevation: -1, // Sun is below the horizon
    ambientIntensity: 0.05,
    directionalIntensity: 0.1, // Moonlight
    fogColor: 0x000015,
    fogNear: 100,
    fogFar: 600  // Reduced fog far distance for more atmospheric night effect
};

// Create loading screen
const loadingManager = new THREE.LoadingManager();
const loadingScreen = document.createElement('div');
loadingScreen.id = 'loadingScreen';
loadingScreen.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, #0e1621 0%, #1a2634 100%);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    z-index: 9999;
    transition: opacity 0.5s ease-out;
    overflow: hidden;
`;

// Add particle background
const particleContainer = document.createElement('div');
particleContainer.style.cssText = `
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
    z-index: 0;
`;

// Create particles
for (let i = 0; i < 50; i++) {
    const particle = document.createElement('div');
    particle.style.cssText = `
        position: absolute;
        width: ${Math.random() * 3 + 1}px;
        height: ${Math.random() * 3 + 1}px;
        background: rgba(52, 152, 219, ${Math.random() * 0.5 + 0.2});
        border-radius: 50%;
        top: ${Math.random() * 100}%;
        left: ${Math.random() * 100}%;
        animation: float ${Math.random() * 10 + 10}s linear infinite;
        z-index: 1;
    `;
    particleContainer.appendChild(particle);
}

// Add 3D cube animation
const cubeContainer = document.createElement('div');
cubeContainer.style.cssText = `
    width: 100px;
    height: 100px;
    perspective: 1000px;
    margin-bottom: 40px;
    transform-style: preserve-3d;
`;

const cube = document.createElement('div');
cube.style.cssText = `
    width: 100%;
    height: 100%;
    position: relative;
    transform-style: preserve-3d;
    animation: rotate 4s linear infinite;
`;

const faces = [
    { transform: 'rotateY(0deg) translateZ(50px)', background: 'rgba(52, 152, 219, 0.8)' },
    { transform: 'rotateY(180deg) translateZ(50px)', background: 'rgba(52, 152, 219, 0.6)' },
    { transform: 'rotateY(90deg) translateZ(50px)', background: 'rgba(52, 152, 219, 0.7)' },
    { transform: 'rotateY(-90deg) translateZ(50px)', background: 'rgba(52, 152, 219, 0.5)' },
    { transform: 'rotateX(90deg) translateZ(50px)', background: 'rgba(52, 152, 219, 0.9)' },
    { transform: 'rotateX(-90deg) translateZ(50px)', background: 'rgba(52, 152, 219, 0.4)' }
];

faces.forEach(face => {
    const element = document.createElement('div');
    element.style.cssText = `
        position: absolute;
        width: 100%;
        height: 100%;
        background: ${face.background};
        transform: ${face.transform};
        border: 2px solid rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(5px);
    `;
    cube.appendChild(element);
});

cubeContainer.appendChild(cube);

const loadingContent = document.createElement('div');
loadingContent.style.cssText = `
    text-align: center;
    color: #3498db;
    padding: 0 20px;
    position: relative;
    z-index: 2;
    background: rgba(14, 22, 33, 0.3);
    backdrop-filter: blur(10px);
    border-radius: 20px;
    border: 1px solid rgba(52, 152, 219, 0.2);
    box-shadow: 0 0 30px rgba(52, 152, 219, 0.1);
    padding: 40px;
    max-width: 90%;
    width: 500px;
`;

const loadingTitle = document.createElement('h1');
loadingTitle.textContent = 'Loading Experience';
loadingTitle.style.cssText = `
    font-size: 2.5em;
    margin-bottom: 20px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 2px;
    text-shadow: 0 2px 10px rgba(52, 152, 219, 0.3);
    background: linear-gradient(135deg, #3498db, #2980b9);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    animation: gradient 3s ease infinite;
`;

const loadingBar = document.createElement('div');
loadingBar.className = 'loading-bar';
loadingBar.style.cssText = `
    width: 300px;
    height: 6px;
    background: rgba(52, 152, 219, 0.1);
    border-radius: 20px;
    overflow: hidden;
    margin: 30px auto;
    box-shadow: 0 0 20px rgba(52, 152, 219, 0.1);
    position: relative;
`;

const loadingProgress = document.createElement('div');
loadingProgress.style.cssText = `
    width: 0%;
    height: 100%;
    background: linear-gradient(90deg, #3498db, #2980b9);
    border-radius: 20px;
    transition: width 0.3s ease-out;
    box-shadow: 0 0 10px rgba(52, 152, 219, 0.5);
    position: relative;
    overflow: hidden;
`;

// Add shimmer effect to progress bar
const shimmer = document.createElement('div');
shimmer.style.cssText = `
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(
        90deg,
        transparent,
        rgba(255, 255, 255, 0.2),
        transparent
    );
    animation: shimmer 2s linear infinite;
`;
loadingProgress.appendChild(shimmer);

const loadingText = document.createElement('p');
loadingText.textContent = 'Loading assets...';
loadingText.style.cssText = `
    font-size: 1.2em;
    color: #3498db;
    margin-top: 20px;
    opacity: 0.8;
    text-transform: uppercase;
    letter-spacing: 1px;
    position: relative;
`;

// Add loading dots animation
const loadingDots = document.createElement('span');
loadingDots.style.cssText = `
    display: inline-block;
    width: 12px;
    text-align: left;
    animation: dots 1.4s infinite;
`;
loadingDots.textContent = '...';
loadingText.appendChild(loadingDots);

const style = document.createElement('style');
style.textContent = `
    @keyframes rotate {
        0% { transform: rotateX(0) rotateY(0) rotateZ(0); }
        100% { transform: rotateX(360deg) rotateY(360deg) rotateZ(360deg); }
    }
    
    @keyframes float {
        0% { transform: translateY(0) rotate(0deg); }
        50% { transform: translateY(-100vh) rotate(180deg); }
        100% { transform: translateY(-200vh) rotate(360deg); }
    }
    
    @keyframes shimmer {
        0% { left: -100%; }
        100% { left: 100%; }
    }
    
    @keyframes gradient {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
    }
    
    @keyframes dots {
        0% { content: ''; }
        25% { content: '.'; }
        50% { content: '..'; }
        75% { content: '...'; }
    }
    
    @media (max-width: 768px) {
        #loadingScreen h1 {
            font-size: 2em !important;
        }
        
        #loadingScreen .loading-bar {
            width: 250px !important;
        }
        
        #loadingScreen .cube-container {
            width: 80px !important;
            height: 80px !important;
        }
        
        #loadingScreen .loading-content {
            padding: 30px !important;
        }
    }
    
    @media (max-width: 480px) {
        #loadingScreen h1 {
            font-size: 1.5em !important;
            padding: 0 20px !important;
        }
        
        #loadingScreen .loading-bar {
            width: 200px !important;
        }
        
        #loadingScreen .cube-container {
            width: 60px !important;
            height: 60px !important;
        }
        
        #loadingScreen .loading-content {
            padding: 20px !important;
        }
    }
`;
    // Add watermark styles
    style.textContent += `
        .watermark {
            position: fixed;
            bottom: 20px;
            right: 20px;
            color: rgba(255, 255, 255, 0.7);
            font-family: 'Arial', sans-serif;
            font-size: 14px;
            z-index: 1000;
            pointer-events: none;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
            background: linear-gradient(135deg, rgba(52, 152, 219, 0.2), rgba(52, 152, 219, 0.1));
            padding: 8px 15px;
            border-radius: 20px;
            backdrop-filter: blur(5px);
            border: 1px solid rgba(52, 152, 219, 0.3);
            transform: translateY(0);
            transition: all 0.3s ease;
            animation: watermarkFloat 3s ease-in-out infinite;
        }

        @keyframes watermarkFloat {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-5px); }
        }

        @media (max-width: 768px) {
            .watermark {
                font-size: 12px;
                padding: 6px 12px;
                bottom: 15px;
                right: 15px;
            }
        }
    `;

document.head.appendChild(style);

    // Create and add watermark
    const watermark = document.createElement('div');
    watermark.className = 'watermark';
    watermark.textContent = 'Made by Triquetra';
    document.body.appendChild(watermark);

loadingBar.appendChild(loadingProgress);
loadingContent.appendChild(cubeContainer);
loadingContent.appendChild(loadingTitle);
loadingContent.appendChild(loadingBar);
loadingContent.appendChild(loadingText);
loadingScreen.appendChild(particleContainer);
loadingScreen.appendChild(loadingContent);
document.body.appendChild(loadingScreen);

// Configure loading manager
let startTime = Date.now();
loadingManager.onProgress = function(url, itemsLoaded, itemsTotal) {
    const progress = (itemsLoaded / itemsTotal) * 100;
    loadingProgress.style.width = `${progress}%`;
    loadingText.textContent = `Loading assets ${Math.round(progress)}%`;
    loadingDots.textContent = '...';
};

loadingManager.onLoad = function() {
    const loadTime = Date.now() - startTime;
    const minimumLoadingTime = 2000; // Minimum time to show loading screen (2 seconds)
    
    if (loadTime < minimumLoadingTime) {
        setTimeout(() => {
            fadeOutLoadingScreen();
        }, minimumLoadingTime - loadTime);
    } else {
        fadeOutLoadingScreen();
    }
};

function fadeOutLoadingScreen() {
    loadingScreen.style.opacity = '0';
    setTimeout(() => {
        loadingScreen.style.display = 'none';
    }, 500);
}

init();
animate();

function init() {
    // ======== BASIC SETUP ========
    scene = new THREE.Scene();
    scene.fog = new THREE.Fog(daySettings.fogColor, 200, 1000);

    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 2000);
    camera.position.set(30, 15, 50);
    camera.lookAt(0, 0, 0);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.body.appendChild(renderer.domElement);

    // Add navigation buttons
    const navContainer = document.createElement('div');
    navContainer.style.cssText = `
        position: fixed;
        bottom: 30px;
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        gap: 20px;
        z-index: 1000;
        background: rgba(14, 22, 33, 0.85);
        padding: 15px 25px;
        border-radius: 40px;
        box-shadow: 0 0 20px rgba(0, 0, 0, 0.3);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(52, 152, 219, 0.3);
    `;

    const buttonStyles = `
        padding: 10px 20px;
        border: none;
        border-radius: 20px;
        background: transparent;
        color: #3498db;
        font-size: 16px;
        cursor: pointer;
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        gap: 8px;
        font-weight: 500;
        position: relative;
        overflow: hidden;
    `;

    const createIcon = (type) => {
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("width", "20");
        svg.setAttribute("height", "20");
        svg.setAttribute("viewBox", "0 0 24 24");
        svg.setAttribute("fill", "none");
        svg.setAttribute("stroke", "currentColor");
        svg.setAttribute("stroke-width", "2");
        svg.setAttribute("stroke-linecap", "round");
        svg.setAttribute("stroke-linejoin", "round");
        
        switch(type) {
            case 'home':
                svg.innerHTML = `<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline>`;
                break;
            case 'contact':
                svg.innerHTML = `<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>`;
                break;
            case 'skills':
                svg.innerHTML = `<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>`;
                break;
            case 'portfolio':
                svg.innerHTML = `<rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline>`;
                break;
        }
        return svg;
    };

    const createNavButton = (text, onClick) => {
        const button = document.createElement('button');
        const icon = createIcon(text.toLowerCase());
        const span = document.createElement('span');
        span.textContent = text;
        button.appendChild(icon);
        button.appendChild(span);
        button.style.cssText = buttonStyles;
        button.onmouseover = () => {
            button.style.background = 'rgba(52, 152, 219, 0.1)';
            button.style.color = '#5dade2';
        };
        button.onmouseout = () => {
            button.style.background = 'transparent';
            button.style.color = '#3498db';
        };
        button.onclick = onClick;
        return button;
    };

    // Home button
    const homeButton = createNavButton('Home', () => {
        window.animateCarToPosition(0, 0);
    });
    navContainer.appendChild(homeButton);

    // Contact button
    const contactButton = createNavButton('Contact', () => {
        if (!window.phoneBox) {
            loader.load('models/phonebox.glb', function (gltf) {
                const phoneBox = gltf.scene;
                phoneBox.position.set(9, 5, 50);
                phoneBox.scale.set(5, 5, 5);
                phoneBox.rotation.y = -Math.PI / 2;
                
                phoneBox.traverse(node => {
                    if (node.isMesh) {
                        node.castShadow = true;
                        node.receiveShadow = true;
                        if (node.material) {
                            node.material = node.material.clone();
                            node.material.emissive.setHex(0x666666);
                            node.material.emissiveIntensity = 0.2;
                        }
                        node.phoneBox = phoneBox;
                    }
                });
                
                scene.add(phoneBox);
                window.phoneBox = phoneBox;
            });
        }
        window.animateCarToPosition(0, 48);
    });
    navContainer.appendChild(contactButton);

    // Skills button
    const skillsButton = createNavButton('Skills', () => {
        window.animateCarToPosition(0, 170); // Changed to x=0 for straight movement
    });
    navContainer.appendChild(skillsButton);

    // Portfolio button
    const portfolioButton = createNavButton('Portfolio', () => {
        window.animateCarToPosition(0, 255); // Center the car between the billboards
        
        setTimeout(() => {
            camera.position.set(-20, 12, 255); // Closer camera position
            controls.target.set(-12, 9, 255); // Look at the center of the billboards
            
            // Add a slight camera tilt for better viewing angle
            camera.rotation.z = 0.1;
        }, 1000);
    });
    navContainer.appendChild(portfolioButton);

    document.body.appendChild(navContainer);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.minDistance = 20;
    controls.maxDistance = 200;
    controls.maxPolarAngle = Math.PI / 2 - 0.05;

    // ======== LIGHTING ========
    ambientLight = new THREE.AmbientLight(0xffffff, daySettings.ambientIntensity);
    scene.add(ambientLight);

    directionalLight = new THREE.DirectionalLight(0xffffff, daySettings.directionalIntensity);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 500;
    directionalLight.shadow.camera.left = -150;
    directionalLight.shadow.camera.right = 150;
    directionalLight.shadow.camera.top = 150;
    directionalLight.shadow.camera.bottom = -150;
    scene.add(directionalLight);

    // ======== SKY ========
    sky = new Sky();
    sky.scale.setScalar(450000);
    scene.add(sky);
    sun = new THREE.Vector3();
    updateSunPosition(daySettings.elevation);

    // ======== GROUND (PLAIN GREEN) ========
    const groundMaterial = new THREE.MeshStandardMaterial({
        color: 0x228B22, // ForestGreen
        roughness: 0.9,
        metalness: 0.1
    });
    const groundGeometry = new THREE.PlaneGeometry(4000, 4000);
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // ======== 3D MODELS ========
    const loader = new GLTFLoader(loadingManager);

    // --- LOAD AND LOOP THE ROAD MODEL ---
    loader.load('models/road.glb', function (gltf) {
        const roadModel = gltf.scene;

        // Increase the distance between segments to avoid overlap
        const roadSegmentLength = 18; // Increased from 15 to 18

        for (let i = -180; i <= 180; i++) {
            const roadSegment = roadModel.clone();
            roadSegment.scale.set(2, 2, 2);
            roadSegment.position.set(0, 0.1, i * roadSegmentLength);
            roadSegment.traverse(node => { if (node.isMesh) node.receiveShadow = true; });
            scene.add(roadSegment);
        }
    }, undefined, console.error);

    // Load Car Model and add headlights
    loader.load('models/car.glb', function (gltf) {
        const car = gltf.scene;
        // Center the car on the road (x = 0), place it at y = 0 (on ground), z = 0 (center of road)
        car.position.set(0, 0.8, 0); // Uplift the car by 0.8 units above ground
        car.rotation.y = 0; // Face straight down the road (+z)
        car.scale.set(6, 6, 6); // Make car even bigger

        // Add car animation function
        window.animateCarToPosition = function(targetX, targetZ, callback) {
            const startPos = {
                x: car.position.x,
                z: car.position.z
            };
            const startCam = {
                x: camera.position.x,
                y: camera.position.y,
                z: camera.position.z
            };
            const duration = 2000; // 2 seconds
            const startTime = Date.now();
            
            function updatePosition() {
                const currentTime = Date.now();
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);
                
                // Smooth easing
                const easeProgress = progress < .5 ? 
                    4 * progress * progress * progress : 
                    1 - Math.pow(-2 * progress + 2, 3) / 2;
                
                // Update car position
                car.position.x = startPos.x + (targetX - startPos.x) * easeProgress;
                car.position.z = startPos.z + (targetZ - startPos.z) * easeProgress;
                
                // Calculate angle based on movement direction
                const angle = Math.atan2(targetX - startPos.x, targetZ - startPos.z);

                // Special handling for skills area
                if (targetZ >= 150) { // If moving to skills area
                    // Keep car straight
                    car.rotation.y = 0;
                    
                    // Camera follows directly behind
                    camera.position.x = car.position.x;
                    camera.position.y = 12;
                    camera.position.z = car.position.z - 15; // Stay 15 units behind the car
                } else {
                    // Normal rotation for other areas
                    car.rotation.y = angle;

                    // Calculate camera follow position
                    const cameraOffset = {
                        x: 15 * Math.sin(angle + Math.PI),
                        z: 15 * Math.cos(angle + Math.PI)
                    };

                    // Update camera position to follow car
                    camera.position.x = car.position.x + cameraOffset.x;
                    camera.position.y = 12;
                    camera.position.z = car.position.z + cameraOffset.z;
                }

                // Update camera look target
                controls.target.set(
                    car.position.x,
                    2,
                    car.position.z
                );
                
                if (progress < 1) {
                    requestAnimationFrame(updatePosition);
                } else if (callback) {
                    callback();
                }
            }
            
            updatePosition();
        };

        // --- HEADLIGHTS POSITIONED AT FRONT OF CAR ---
        carHeadlight1 = new THREE.SpotLight(0xffffff, 0, 100, Math.PI / 6, 0.5, 2);
        carHeadlight2 = new THREE.SpotLight(0xffffff, 0, 100, Math.PI / 6, 0.5, 2);

        // Position lights at the front of the car (assuming front is +z)
        carHeadlight1.position.set(0.8, 1, 2);
        carHeadlight2.position.set(-0.8, 1, 2);

        // Create targets for the lights to point forward
        const target1 = new THREE.Object3D();
        const target2 = new THREE.Object3D();
        target1.position.set(0.8, 0.5, 20);
        target2.position.set(-0.8, 0.5, 20);

        car.add(carHeadlight1);
        car.add(carHeadlight1.target = target1);
        car.add(carHeadlight2);
        car.add(carHeadlight2.target = target2);

        // Ensure the car sits exactly on the ground (with uplift)
        const box = new THREE.Box3().setFromObject(car);
        const yOffset = box.min.y;
        car.position.y = car.position.y - yOffset + 0.8; // Add uplift

        car.traverse(node => { if (node.isMesh) node.castShadow = true; });
        scene.add(car);
    }, undefined, console.error);

    // Load Tree Models
    loader.load('models/tree.glb', function (gltf) {
        const treeModel = gltf.scene;
        treeModel.scale.set(1.2, 1.2, 1.2); // Slightly smaller trees

        // Place trees along both sides of the road
        const roadLength = 1800; // Doubled length of the road
        const treeSpacing = 35; // Slightly increased space between trees
        const roadOffset = 45; // Increased distance from road center
        const randomOffset = 12; // Slightly increased random variation

        // First row (closest to road)
        for (let z = -90; z <= roadLength; z += treeSpacing) {
            // Left side trees
            const treeLeft = treeModel.clone();
            treeLeft.position.set(
                -roadOffset + (Math.random() * randomOffset - randomOffset/2),
                0,
                z + (Math.random() * randomOffset - randomOffset/2)
            );
            treeLeft.rotation.y = Math.random() * Math.PI;
            treeLeft.traverse(node => { if (node.isMesh) node.castShadow = true; });
            scene.add(treeLeft);

            // Right side trees
            const treeRight = treeModel.clone();
            treeRight.position.set(
                roadOffset + (Math.random() * randomOffset - randomOffset/2),
                0,
                z + (Math.random() * randomOffset - randomOffset/2)
            );
            treeRight.rotation.y = Math.random() * Math.PI;
            treeRight.traverse(node => { if (node.isMesh) node.castShadow = true; });
            scene.add(treeRight);
        }

        // Second row (middle distance)
        const secondRowOffset = 12; // Increased distance for second row
        
        for (let z = -90; z <= roadLength; z += treeSpacing) {
            // Left side second row
            const treeLeft2 = treeModel.clone();
            treeLeft2.position.set(
                -roadOffset - secondRowOffset + (Math.random() * randomOffset - randomOffset/2),
                0,
                z + (Math.random() * randomOffset - randomOffset/2)
            );
            treeLeft2.rotation.y = Math.random() * Math.PI;
            treeLeft2.scale.set(1.1, 1.1, 1.1); // Slightly different size
            treeLeft2.traverse(node => { if (node.isMesh) node.castShadow = true; });
            scene.add(treeLeft2);

            // Right side second row
            const treeRight2 = treeModel.clone();
            treeRight2.position.set(
                roadOffset + secondRowOffset + (Math.random() * randomOffset - randomOffset/2),
                0,
                z + (Math.random() * randomOffset - randomOffset/2)
            );
            treeRight2.rotation.y = Math.random() * Math.PI;
            treeRight2.scale.set(1.1, 1.1, 1.1); // Slightly different size
            treeRight2.traverse(node => { if (node.isMesh) node.castShadow = true; });
            scene.add(treeRight2);
        }

        // Third row (farthest back)
        const thirdRowOffset = 24; // Increased distance for third row
        
        for (let z = -90; z <= roadLength; z += treeSpacing) {
            // Left side third row
            const treeLeft3 = treeModel.clone();
            treeLeft3.position.set(
                -roadOffset - thirdRowOffset + (Math.random() * randomOffset - randomOffset/2),
                0,
                z + (Math.random() * randomOffset - randomOffset/2)
            );
            treeLeft3.rotation.y = Math.random() * Math.PI;
            treeLeft3.scale.set(0.9, 0.9, 0.9); // Different size for variety
            treeLeft3.traverse(node => { if (node.isMesh) node.castShadow = true; });
            scene.add(treeLeft3);

            // Right side third row
            const treeRight3 = treeModel.clone();
            treeRight3.position.set(
                roadOffset + thirdRowOffset + (Math.random() * randomOffset - randomOffset/2),
                0,
                z + (Math.random() * randomOffset - randomOffset/2)
            );
            treeRight3.rotation.y = Math.random() * Math.PI;
            treeRight3.scale.set(0.9, 0.9, 0.9); // Different size for variety
            treeRight3.traverse(node => { if (node.isMesh) node.castShadow = true; });
            scene.add(treeRight3);
        }
    }, undefined, console.error);

    // ======== SMALL BILLBOARD WITH LOGO ========
    // Create a smaller box (billboard base)
    const billboardWidth = 6;
    const billboardHeight = 6;
    const billboardDepth = 0.4;
    const billboardGeometry = new THREE.BoxGeometry(billboardWidth, billboardHeight, billboardDepth);

    // Load your logo as a texture
    const logoTexture = new THREE.TextureLoader().load('https://yt3.googleusercontent.com/033hmWZ563imMSz0qPjdNV8e9UoEdwo798lTsLwjsX82H050SSPAnt5HnLylbbKo_SoA0VPIrw=s160-c-k-c0x00ffffff-no-rj');
    logoTexture.encoding = THREE.sRGBEncoding;

    // Create materials with emissive properties
    const materials = [
        new THREE.MeshStandardMaterial({ color: 0x111111, emissive: 0x111111, emissiveIntensity: 0 }), // right
        new THREE.MeshStandardMaterial({ color: 0x111111, emissive: 0x111111, emissiveIntensity: 0 }), // left
        new THREE.MeshStandardMaterial({ color: 0x111111, emissive: 0x111111, emissiveIntensity: 0 }), // top
        new THREE.MeshStandardMaterial({ color: 0x111111, emissive: 0x111111, emissiveIntensity: 0 }), // bottom
        new THREE.MeshStandardMaterial({ 
            map: logoTexture, 
            emissive: 0xffffff,
            emissiveMap: logoTexture,
            emissiveIntensity: 0
        }), // front (logo)
        new THREE.MeshStandardMaterial({ color: 0x111111, emissive: 0x111111, emissiveIntensity: 0 })  // back
    ];

    const billboard = new THREE.Mesh(billboardGeometry, materials);
    billboard.position.set(25, 9, 0);
    billboard.rotation.y = -Math.PI / 2;
    billboard.castShadow = true;
    billboard.receiveShadow = true;
    scene.add(billboard);

    // Store billboard materials for day/night switching
    window.billboardMaterials = materials;

    // Add pole for logo billboard
    const poleGeometry = new THREE.CylinderGeometry(0.3, 0.3, 6, 16);
    const poleMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x666666,
        roughness: 0.7,
        metalness: 0.3
    });
    const pole = new THREE.Mesh(poleGeometry, poleMaterial);
    pole.position.set(25, 3, 0);
    pole.castShadow = true;
    pole.receiveShadow = true;
    scene.add(pole);

    // ======== BIG BILLBOARD WITH "ABOUT ME" ========
    const canvas = document.createElement('canvas');
    canvas.width = 1024; // Increased canvas size for better text quality
    canvas.height = 1024;
    const context = canvas.getContext('2d');
    
    // Set background
    context.fillStyle = '#2c3e50';
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add text with brighter color for better emissive effect
    context.fillStyle = '#ffffff';
    
    // Draw "ABOUT ME" title - much bigger
    context.font = 'bold 96px Arial';
    context.textAlign = 'center';
    context.fillText('ABOUT ME', canvas.width/2, canvas.height/3);
    
    // Add underline
    const underlineWidth = 400;
    const underlineHeight = 6;
    context.fillRect(
        (canvas.width - underlineWidth)/2,
        canvas.height/3 + 20,
        underlineWidth,
        underlineHeight
    );

    // Draw main text - increased size
    context.font = 'bold 64px Arial';
    context.fillText('Full Stack Developer', canvas.width/2, canvas.height/2);
    
    // Draw sub text with larger size and better spacing
    context.font = '48px Arial';
    const lineHeight = 80;
    let currentY = canvas.height/2 + lineHeight;
    
    context.fillText('Passionate about creating', canvas.width/2, currentY);
    currentY += lineHeight;
    context.fillText('innovative web experiences', canvas.width/2, currentY);
    currentY += lineHeight;
    context.fillText('with modern technologies', canvas.width/2, currentY);
    
    // Create texture from canvas
    const aboutMeTexture = new THREE.CanvasTexture(canvas);
    aboutMeTexture.encoding = THREE.sRGBEncoding;

    // Create materials for about me billboard with emissive properties
    const aboutMeMaterials = [
        new THREE.MeshStandardMaterial({ color: 0x2c3e50, emissive: 0x2c3e50, emissiveIntensity: 0 }), // right
        new THREE.MeshStandardMaterial({ color: 0x2c3e50, emissive: 0x2c3e50, emissiveIntensity: 0 }), // left
        new THREE.MeshStandardMaterial({ color: 0x2c3e50, emissive: 0x2c3e50, emissiveIntensity: 0 }), // top
        new THREE.MeshStandardMaterial({ color: 0x2c3e50, emissive: 0x2c3e50, emissiveIntensity: 0 }), // bottom
        new THREE.MeshStandardMaterial({ 
            map: aboutMeTexture,
            emissive: 0xffffff,
            emissiveMap: aboutMeTexture,
            emissiveIntensity: 0
        }), // front
        new THREE.MeshStandardMaterial({ color: 0x2c3e50, emissive: 0x2c3e50, emissiveIntensity: 0 })  // back
    ];

    // Store about me materials for day/night switching
    window.aboutMeMaterials = aboutMeMaterials;

    // Create the about me billboard mesh
    const bigBillboardWidth = 12;
    const bigBillboardHeight = 12;
    const bigBillboardDepth = 0.8;
    const bigBillboardGeometry = new THREE.BoxGeometry(bigBillboardWidth, bigBillboardHeight, bigBillboardDepth);

    const aboutMeBillboard = new THREE.Mesh(bigBillboardGeometry, aboutMeMaterials);
    aboutMeBillboard.position.set(25, 18, 20);
    aboutMeBillboard.rotation.y = -Math.PI / 2;
    aboutMeBillboard.castShadow = true;
    aboutMeBillboard.receiveShadow = true;
    scene.add(aboutMeBillboard);

    // Add pole for About Me billboard
    const bigPoleGeometry = new THREE.CylinderGeometry(0.5, 0.5, 12, 16);
    const aboutMePole = new THREE.Mesh(bigPoleGeometry, poleMaterial);
    aboutMePole.position.set(25, 6, 20);
    aboutMePole.castShadow = true;
    aboutMePole.receiveShadow = true;
    scene.add(aboutMePole);

    // ======== ENHANCED INTERACTIVE BILLBOARD OVERLAY ========
    // Create HTML overlay for expanded about me content with 3D animation
    const overlay = document.createElement('div');
    overlay.id = 'aboutMeOverlay';
    
    // Add responsive styles
    const styleSheet = document.createElement('style');
    styleSheet.textContent = `
        @media (max-width: 768px) {
            #aboutMeOverlay, #contactOverlay {
                width: 95vw !important;
                max-height: 90vh !important;
                margin: 20px !important;
            }
            
            #overlayContent, #contactOverlayContent {
                padding: 20px !important;
            }
            
            #overlayContent .content-grid, #contactOverlayContent .contact-grid {
                grid-template-columns: 1fr !important;
                gap: 20px !important;
            }
            
            #overlayContent h2, #contactOverlayContent h2 {
                font-size: 2em !important;
            }
            
            #overlayContent .card, #contactOverlayContent .card {
                padding: 20px !important;
            }
            
            #overlayContent .close-button, #contactOverlayContent .close-button {
                top: 10px !important;
                right: 10px !important;
            }

            .toggle-switch {
                top: 10px !important;
                right: 10px !important;
                transform: scale(0.8) !important;
            }

            .nav-container {
                bottom: 20px !important;
                flex-wrap: wrap !important;
                justify-content: center !important;
            }

            .nav-container button {
                padding: 8px 16px !important;
                font-size: 14px !important;
            }
        }
        
        @media (max-width: 480px) {
            #aboutMeOverlay, #contactOverlay {
                width: 100vw !important;
                height: 100vh !important;
                max-height: 100vh !important;
                border-radius: 0 !important;
                margin: 0 !important;
                transform: translate(-50%, -50%) scale(0.6) !important;
            }
            
            #aboutMeOverlay.active, #contactOverlay.active {
                transform: translate(-50%, -50%) scale(1) !important;
            }
            
            #overlayContent, #contactOverlayContent {
                padding: 30px 15px !important;
                height: calc(100% - 60px) !important;
                overflow-y: auto !important;
            }
            
            #overlayContent.active, #contactOverlayContent.active {
                transform: translateY(0) !important;
            }
            
            #overlayContent h2, #contactOverlayContent h2 {
                font-size: 1.8em !important;
            }
            
            #overlayContent .card, #contactOverlayContent .card {
                padding: 15px !important;
            }
            
            #overlayContent button, #contactOverlayContent button {
                padding: 12px 30px !important;
                font-size: 1em !important;
                width: 100% !important;
            }

            input, textarea {
                font-size: 16px !important; /* Prevents zoom on mobile */
            }

            .nav-container {
                padding: 0 10px !important;
            }

            .nav-container button {
                margin: 5px !important;
                flex: 1 1 auto !important;
                min-width: 120px !important;
            }
        }
        
        .touch-scroll {
            -webkit-overflow-scrolling: touch;
            overflow-y: auto;
        }

        #contactForm {
            display: grid;
            gap: 20px;
            width: 100%;
        }

        #contactForm button[type="submit"] {
            width: 100%;
            margin-top: 20px;
            display: block;
        }

        .nav-container {
            position: fixed;
            bottom: 30px;
            left: 50%;
            transform: translateX(-50%);
            display: flex;
            gap: 20px;
            z-index: 1000;
            flex-wrap: wrap;
            justify-content: center;
            padding: 0 20px;
        }
    `;
    document.head.appendChild(styleSheet);
    
    overlay.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -60%) scale(0.6) perspective(2000px) rotateX(45deg);
        background: rgba(14, 22, 33, 0.95);
        color: white;
        padding: 0;
        border-radius: 20px;
        max-width: 90vw;
        width: 800px;
        max-height: 85vh;
        opacity: 0;
        visibility: hidden;
        z-index: 1000;
        backdrop-filter: blur(20px);
        border: 2px solid rgba(52, 152, 219, 0.5);
        box-shadow: 
            0 0 50px rgba(52, 152, 219, 0.3),
            0 0 100px rgba(52, 152, 219, 0.2),
            inset 0 0 30px rgba(52, 152, 219, 0.2);
        transition: all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
        overflow: hidden;
        transform-origin: center top;
    `;

    overlay.innerHTML = `
        <div id="overlayContent" class="touch-scroll" style="
            position: relative;
            padding: 40px;
            height: 100%;
            background: linear-gradient(135deg, rgba(52, 152, 219, 0.1), rgba(52, 152, 219, 0.05));
            opacity: 0;
            transform: translateY(20px);
            transition: all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
            transition-delay: 0.2s;
        ">
            <div class="close-button" style="
                position: absolute;
                top: 20px;
                right: 20px;
                cursor: pointer;
                background: rgba(52, 152, 219, 0.2);
                width: 40px;
                height: 40px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.3s ease;
                border: 2px solid rgba(52, 152, 219, 0.3);
                transform: rotate(0deg);
                z-index: 2;
            " onclick="window.hideOverlay()">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </div>

            <div class="title-section" style="
                text-align: center;
                margin-bottom: 40px;
                position: relative;
            ">
                <h2 style="
                    color: #3498db;
                    margin: 0 0 20px 0;
                    font-size: 3em;
                    font-weight: 800;
                    text-transform: uppercase;
                    letter-spacing: 2px;
                    text-shadow: 0 2px 10px rgba(52, 152, 219, 0.3);
                ">About Me</h2>
                <div style="
                    width: 100px;
                    height: 4px;
                    background: linear-gradient(90deg, #3498db, transparent);
                    margin: 0 auto;
                    border-radius: 2px;
                "></div>
            </div>

            <div class="content-grid" style="
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 30px;
                margin-top: 40px;
            ">
                <div class="card" style="
                    background: rgba(52, 152, 219, 0.1);
                    padding: 30px;
                    border-radius: 15px;
                    border: 1px solid rgba(52, 152, 219, 0.2);
                    transform: translateY(0) rotateX(0);
                    transition: all 0.3s ease;
                    transform-style: preserve-3d;
                ">
                    <h3 style="
                        color: #3498db;
                        margin: 0 0 20px 0;
                        font-size: 1.5em;
                        font-weight: 600;
                    ">Skills</h3>
                    <ul style="
                        list-style: none;
                        padding: 0;
                        margin: 0;
                        color: #ecf0f1;
                        font-size: 1.1em;
                        line-height: 1.8;
                    ">
                        <li>✦ JavaScript / TypeScript</li>
                        <li>✦ React / Vue.js</li>
                        <li>✦ Node.js / Express</li>
                        <li>✦ Three.js / WebGL</li>
                        <li>✦ Python / Django</li>
                    </ul>
                </div>

                <div class="card" style="
                    background: rgba(52, 152, 219, 0.1);
                    padding: 30px;
                    border-radius: 15px;
                    border: 1px solid rgba(52, 152, 219, 0.2);
                    transform: translateY(0) rotateX(0);
                    transition: all 0.3s ease;
                    transform-style: preserve-3d;
                ">
                    <h3 style="
                        color: #3498db;
                        margin: 0 0 20px 0;
                        font-size: 1.5em;
                        font-weight: 600;
                    ">Experience</h3>
                    <p style="
                        color: #ecf0f1;
                        font-size: 1.1em;
                        line-height: 1.8;
                        margin: 0;
                    ">
                        5+ years of experience building modern web applications and interactive 3D experiences.
                        Passionate about creating innovative solutions and pushing the boundaries of web technology.
                    </p>
                </div>
            </div>

            <div style="
                margin-top: 40px;
                text-align: center;
            ">
                <button onclick="window.hideOverlay()" style="
                    background: linear-gradient(135deg, #3498db, #2980b9);
                    color: white;
                    border: none;
                    padding: 15px 40px;
                    border-radius: 30px;
                    font-size: 1.2em;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    box-shadow: 0 5px 15px rgba(52, 152, 219, 0.3);
                    transform: translateY(0);
                ">
                    Close
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);

    // Store references to billboards for animation
    window.billboards = {
        logo: billboard,
        aboutMe: aboutMeBillboard,
        originalScales: {
            logo: { x: 1, y: 1, z: 1 },
            aboutMe: { x: 1, y: 1, z: 1 }
        },
        isAnimating: {
            logo: false,
            aboutMe: false
        }
    };

    // Add mouse interaction detection
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let hoveredObject = null;

    // Handle mouse move for hover effect
    function onMouseMove(event) {
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(scene.children, true);

        if (intersects.length > 0) {
            const intersectedObject = intersects[0].object;
            
            // Check if it's a clickable object
            if (intersectedObject === billboard || 
                intersectedObject === aboutMeBillboard || 
                intersectedObject.phoneBox) {
                
                if (hoveredObject !== intersectedObject) {
                    // Reset previous hover if exists
                    if (hoveredObject) {
                        animateObjectScale(hoveredObject, false);
                    }
                    hoveredObject = intersectedObject;
                    animateObjectScale(hoveredObject, true);
                    document.body.style.cursor = 'pointer';
                }
            }
        } else if (hoveredObject) {
            animateObjectScale(hoveredObject, false);
            hoveredObject = null;
            document.body.style.cursor = 'default';
        }
    }

    // Update showOverlay function with mobile detection
    function showOverlay() {
        const overlay = document.getElementById('aboutMeOverlay');
        const content = document.getElementById('overlayContent');
        const isMobile = window.innerWidth <= 480;
        
        overlay.style.visibility = 'visible';
        overlay.style.opacity = '1';
        overlay.classList.add('active');
        
        if (isMobile) {
            overlay.style.transform = 'translate(-50%, -50%) scale(1)';
            content.style.transform = 'translateY(0)';
        } else {
            overlay.style.transform = 'translate(-50%, -50%) scale(1) perspective(2000px) rotateX(0deg)';
        }
        
        setTimeout(() => {
            content.style.opacity = '1';
            content.classList.add('active');
        }, 300);
    }

    // Update hideOverlay function with mobile detection
    function hideOverlay() {
        const overlay = document.getElementById('aboutMeOverlay');
        const content = document.getElementById('overlayContent');
        const isMobile = window.innerWidth <= 480;
        
        content.style.opacity = '0';
        content.classList.remove('active');
        overlay.classList.remove('active');
        
        if (isMobile) {
            overlay.style.transform = 'translate(-50%, -50%) scale(0.6)';
        } else {
            overlay.style.transform = 'translate(-50%, -60%) scale(0.6) perspective(2000px) rotateX(45deg)';
        }
        
        setTimeout(() => {
            overlay.style.visibility = 'hidden';
        }, 800);
    }

    // Add touch event handling
    let touchStartY = 0;
    let touchEndY = 0;

    overlay.addEventListener('touchstart', (e) => {
        touchStartY = e.touches[0].clientY;
    }, false);

    overlay.addEventListener('touchmove', (e) => {
        touchEndY = e.touches[0].clientY;
    }, false);

    overlay.addEventListener('touchend', () => {
        const swipeDistance = touchEndY - touchStartY;
        if (swipeDistance > 100) { // Swipe down threshold
            hideOverlay();
        }
    }, false);

    // Make functions globally accessible
    window.hideOverlay = hideOverlay;
    window.showOverlay = showOverlay;

    // Handle click for expanded view
    function onMouseClick(event) {
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(scene.children, true);

        if (intersects.length > 0) {
            const clickedObject = intersects[0].object;
            
            // Find the root object (billboard) if we clicked a child mesh
            let targetObject = clickedObject;
            while (targetObject.parent && !(targetObject === aboutMeBillboard || targetObject === billboard || targetObject.userData.type)) {
                targetObject = targetObject.parent;
            }
            
            // Check if we clicked the about me billboard
            if (targetObject === aboutMeBillboard) {
                console.log('About billboard clicked'); // Debug log
                window.showOverlay();
            } else if (targetObject === billboard) {
                window.open('https://your-portfolio-url.com', '_blank');
            } else if (clickedObject.phoneBox) {
                showContactOverlay();
            } else if (targetObject.userData && targetObject.userData.type === 'portfolioBillboard') {
                const githubUrl = targetObject.userData.githubUrl;
                if (githubUrl) {
                    // Animate the billboard on click
                    const originalScale = targetObject.scale.x;
                    const originalRotation = targetObject.rotation.y;
                    
                    // Scale up and rotate slightly
                    targetObject.scale.set(originalScale * 1.1, originalScale * 1.1, originalScale * 1.1);
                    targetObject.rotation.y = originalRotation + 0.1;
                    
                    // Reset after animation
                    setTimeout(() => {
                        targetObject.scale.set(originalScale, originalScale, originalScale);
                        targetObject.rotation.y = originalRotation;
                        
                        // Open GitHub link after animation
                        window.open(githubUrl, '_blank');
                    }, 200);
                }
            }
        }
    }

    // Smooth object animation
    function animateObjectScale(object, isHovering) {
        // If it's a phone box mesh, animate the whole phone box
        const targetObject = object.phoneBox || object;
        
        const billboardType = targetObject === window.billboards.logo ? 'logo' : 
                             targetObject === window.billboards.aboutMe ? 'aboutMe' : 'portfolio';
        
        if (window.billboards.isAnimating[billboardType] && !object.phoneBox) return;

        if (object.phoneBox) {
            // For phone box, do a simple scale animation
            const scale = isHovering ? 5.5 : 5;
            targetObject.scale.set(scale, scale, scale);
            return;
        }

        window.billboards.isAnimating[billboardType] = true;
        
        // Enhanced scale effect for portfolio billboards
        const targetScale = isHovering ? 
            (targetObject.userData.type === 'portfolioBillboard' ? 1.4 : 1.2) : 1; // Bigger hover scale
        const duration = 400;
        const startScale = targetObject.scale.x;
        const startRotation = targetObject.rotation.y;
        const startPosition = targetObject.position.clone();
        
        // Calculate target position for hover (move slightly forward)
        const targetPosition = isHovering && targetObject.userData.type === 'portfolioBillboard' ?
            new THREE.Vector3(startPosition.x - 2, startPosition.y, startPosition.z) :
            startPosition.clone();
        
        const targetRotation = isHovering ? 
            (targetObject.userData.type === 'portfolioBillboard' ? startRotation - 0.15 : startRotation) : 
            (targetObject.userData.type === 'portfolioBillboard' ? Math.PI / 2 : startRotation);
        
        const startTime = Date.now();

        function animate() {
            const currentTime = Date.now();
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Smooth easing function
            const easeProgress = progress < .5 ? 
                4 * progress * progress * progress : 
                1 - Math.pow(-2 * progress + 2, 3) / 2;

            const currentScale = startScale + (targetScale - startScale) * easeProgress;
            targetObject.scale.set(currentScale, currentScale, currentScale);

            // Add rotation and position animation for portfolio billboards
            if (targetObject.userData.type === 'portfolioBillboard') {
                const currentRotation = startRotation + (targetRotation - startRotation) * easeProgress;
                targetObject.rotation.y = currentRotation;

                // Smooth position transition
                targetObject.position.lerpVectors(startPosition, targetPosition, easeProgress);

                // Add floating effect when hovered
                if (isHovering) {
                    targetObject.position.y = targetPosition.y + Math.sin(currentTime * 0.003) * 0.3;
                } else {
                    targetObject.position.y = startPosition.y;
                }

                // Add slight tilt effect
                if (isHovering) {
                    targetObject.rotation.x = Math.sin(currentTime * 0.002) * 0.05;
                } else {
                    targetObject.rotation.x = 0;
                }
            }

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                window.billboards.isAnimating[billboardType] = false;
            }
        }

        animate();
    }

    // Add event listeners
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('click', onMouseClick);

    // ======== EVENT LISTENERS ========
    const toggle = document.getElementById('mode-toggle');
    toggle.addEventListener('change', (event) => {
        if (event.target.checked) {
            switchToNight();
        } else {
            switchToDay();
        }
    });
    window.addEventListener('resize', onWindowResize);

    // Add contact overlay
    const contactOverlay = document.createElement('div');
    contactOverlay.id = 'contactOverlay';
    contactOverlay.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%) scale(0.6) perspective(2000px) rotateX(45deg);
        background: rgba(14, 22, 33, 0.95);
        color: white;
        padding: 0;
        border-radius: 20px;
        max-width: 90vw;
        width: 800px;
        height: auto;
        min-height: 400px;
        max-height: 90vh;
        opacity: 0;
        visibility: hidden;
        z-index: 1000;
        backdrop-filter: blur(20px);
        border: 2px solid rgba(52, 152, 219, 0.5);
        box-shadow: 
            0 0 50px rgba(52, 152, 219, 0.3),
            0 0 100px rgba(52, 152, 219, 0.2),
            inset 0 0 30px rgba(52, 152, 219, 0.2);
        transition: all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
        overflow: auto;
        transform-origin: center center;
        display: flex;
        flex-direction: column;
    `;

    contactOverlay.innerHTML = `
        <div id="contactOverlayContent" class="touch-scroll" style="
            position: relative;
            padding: 40px;
            flex: 1;
            background: linear-gradient(135deg, rgba(52, 152, 219, 0.1), rgba(52, 152, 219, 0.05));
            opacity: 0;
            transform: translateY(20px);
            transition: all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
            transition-delay: 0.2s;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
        ">
            <div class="close-button" style="
                position: absolute;
                top: 20px;
                right: 20px;
                cursor: pointer;
                background: rgba(52, 152, 219, 0.2);
                width: 40px;
                height: 40px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.3s ease;
                border: 2px solid rgba(52, 152, 219, 0.3);
                transform: rotate(0deg);
                z-index: 2;
            " onclick="hideContactOverlay()" ontouchstart="this.style.transform='rotate(90deg)'" ontouchend="this.style.transform='rotate(0deg)'"
               onmouseover="this.style.transform='rotate(90deg)'" onmouseout="this.style.transform='rotate(0deg)'">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </div>

            <div class="title-section" style="
                text-align: center;
                margin-bottom: 40px;
                position: relative;
            ">
                <h2 style="
                    color: #3498db;
                    margin: 0 0 20px 0;
                    font-size: 3em;
                    font-weight: 800;
                    text-transform: uppercase;
                    letter-spacing: 2px;
                    text-shadow: 0 2px 10px rgba(52, 152, 219, 0.3);
                ">Contact Me</h2>
                <div style="
                    width: 100px;
                    height: 4px;
                    background: linear-gradient(90deg, #3498db, transparent);
                    margin: 0 auto;
                    border-radius: 2px;
                "></div>
            </div>

                            <div class="contact-grid" style="
                display: grid;
                grid-template-columns: 1fr;
                gap: 30px;
                margin-top: 40px;
                flex: 1;
            ">
                <div class="card" style="
                    background: rgba(52, 152, 219, 0.1);
                    padding: 30px;
                    border-radius: 15px;
                    border: 1px solid rgba(52, 152, 219, 0.2);
                ">
                    <form id="contactForm" onsubmit="handleContactSubmit(event)" style="
                        display: flex;
                        flex-direction: column;
                        gap: 20px;
                        min-height: 400px;
                        position: relative;
                        padding-bottom: 60px;
                    ">
                        <div style="display: grid; gap: 8px;">
                            <label for="name" style="
                                color: #3498db;
                                font-size: 1.1em;
                                font-weight: 600;
                            ">Name</label>
                            <input type="text" id="name" required style="
                                width: 100%;
                                padding: 12px;
                                border: 2px solid rgba(52, 152, 219, 0.5);
                                border-radius: 8px;
                                background: rgba(14, 22, 33, 0.8);
                                color: white;
                                font-size: 1em;
                                transition: all 0.3s ease;
                                outline: none;
                                box-sizing: border-box;
                                box-shadow: 0 0 15px rgba(52, 152, 219, 0.2);
                                backdrop-filter: blur(5px);
                            " onFocus="this.style.borderColor='rgba(52, 152, 219, 0.8)';this.style.boxShadow='0 0 20px rgba(52, 152, 219, 0.3)'"
                               onBlur="this.style.borderColor='rgba(52, 152, 219, 0.5)';this.style.boxShadow='0 0 15px rgba(52, 152, 219, 0.2)'">
                        </div>

                        <div style="display: grid; gap: 8px;">
                            <label for="email" style="
                                color: #3498db;
                                font-size: 1.1em;
                                font-weight: 600;
                            ">Email</label>
                            <input type="email" id="email" required style="
                                width: 100%;
                                padding: 12px;
                                border: 2px solid rgba(52, 152, 219, 0.5);
                                border-radius: 8px;
                                background: rgba(14, 22, 33, 0.8);
                                color: white;
                                font-size: 1em;
                                transition: all 0.3s ease;
                                outline: none;
                                box-sizing: border-box;
                                box-shadow: 0 0 15px rgba(52, 152, 219, 0.2);
                                backdrop-filter: blur(5px);
                            " onFocus="this.style.borderColor='rgba(52, 152, 219, 0.8)';this.style.boxShadow='0 0 20px rgba(52, 152, 219, 0.3)'"
                               onBlur="this.style.borderColor='rgba(52, 152, 219, 0.5)';this.style.boxShadow='0 0 15px rgba(52, 152, 219, 0.2)'">
                        </div>

                        <div style="display: grid; gap: 8px;">
                            <label for="message" style="
                                color: #3498db;
                                font-size: 1.1em;
                                font-weight: 600;
                            ">Message</label>
                            <textarea id="message" required rows="5" style="
                                width: 100%;
                                padding: 12px;
                                border: 2px solid rgba(52, 152, 219, 0.5);
                                border-radius: 8px;
                                background: rgba(14, 22, 33, 0.8);
                                color: white;
                                font-size: 1em;
                                transition: all 0.3s ease;
                                outline: none;
                                resize: vertical;
                                min-height: 120px;
                                box-sizing: border-box;
                                box-shadow: 0 0 15px rgba(52, 152, 219, 0.2);
                                backdrop-filter: blur(5px);
                            " onFocus="this.style.borderColor='rgba(52, 152, 219, 0.8)';this.style.boxShadow='0 0 20px rgba(52, 152, 219, 0.3)'"
                               onBlur="this.style.borderColor='rgba(52, 152, 219, 0.5)';this.style.boxShadow='0 0 15px rgba(52, 152, 219, 0.2)'"></textarea>
                        </div>

                        <div style="
                            width: 100%;
                            margin-top: 20px;
                            padding: 0;
                            position: relative;
                            z-index: 10;
                        ">
                            <button type="submit" style="
                                width: 100%;
                                background: linear-gradient(135deg, #3498db, #2980b9);
                                color: white;
                                border: none;
                                padding: 18px 30px;
                                border-radius: 8px;
                                font-size: 1.2em;
                                cursor: pointer;
                                transition: all 0.3s ease;
                                display: block;
                                font-weight: 600;
                                letter-spacing: 1px;
                                text-transform: uppercase;
                                box-shadow: 0 4px 15px rgba(52, 152, 219, 0.3);
                                position: relative;
                                overflow: hidden;
                            " onmouseover="this.style.background='linear-gradient(135deg, #2980b9, #2472a4)';this.style.transform='translateY(-2px)';this.style.boxShadow='0 6px 20px rgba(52, 152, 219, 0.4)'" 
                               onmouseout="this.style.background='linear-gradient(135deg, #3498db, #2980b9)';this.style.transform='translateY(0)';this.style.boxShadow='0 4px 15px rgba(52, 152, 219, 0.3)'">
                                Send Message
                            </button>
                        </div>
                    </form>
                </div>

                <div class="card" style="
                    background: rgba(52, 152, 219, 0.1);
                    padding: 30px;
                    border-radius: 15px;
                    border: 1px solid rgba(52, 152, 219, 0.2);
                ">
                    <h3 style="
                        color: #3498db;
                        margin: 0 0 20px 0;
                        font-size: 1.5em;
                        font-weight: 600;
                    ">Other Ways to Connect</h3>
                    <div style="
                        display: grid;
                        gap: 20px;
                    ">
                        <a href="mailto:your.email@example.com" style="
                            display: flex;
                            align-items: center;
                            gap: 15px;
                            color: #ecf0f1;
                            text-decoration: none;
                            font-size: 1.1em;
                            transition: all 0.3s ease;
                        " onmouseover="this.style.transform='translateX(10px)'" 
                           onmouseout="this.style.transform='translateX(0)'">
                            📧 your.email@example.com
                        </a>
                        <a href="https://github.com/yourusername" target="_blank" style="
                            display: flex;
                            align-items: center;
                            gap: 15px;
                            color: #ecf0f1;
                            text-decoration: none;
                            font-size: 1.1em;
                            transition: all 0.3s ease;
                        " onmouseover="this.style.transform='translateX(10px)'" 
                           onmouseout="this.style.transform='translateX(0)'">
                            <svg height="24" width="24" viewBox="0 0 16 16" fill="#ecf0f1">
                                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
                            </svg>
                            GitHub
                        </a>
                        <a href="https://linkedin.com/in/yourusername" target="_blank" style="
                            display: flex;
                            align-items: center;
                            gap: 15px;
                            color: #ecf0f1;
                            text-decoration: none;
                            font-size: 1.1em;
                            transition: all 0.3s ease;
                        " onmouseover="this.style.transform='translateX(10px)'" 
                           onmouseout="this.style.transform='translateX(0)'">
                            <svg height="24" width="24" viewBox="0 0 24 24" fill="#ecf0f1">
                                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                            </svg>
                            LinkedIn
                        </a>
                    </div>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(contactOverlay);

    // Add form submission handler
    window.handleContactSubmit = function(event) {
        event.preventDefault();
        
        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const message = document.getElementById('message').value;
        
        // Here you would typically send this data to your server
        console.log('Contact form submitted:', { name, email, message });
        
        // Show success message
        const form = document.getElementById('contactForm');
        const originalContent = form.innerHTML;
        
        form.innerHTML = `
            <div style="
                text-align: center;
                color: #2ecc71;
                font-size: 1.2em;
                padding: 20px;
            ">
                <svg width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="#2ecc71" stroke-width="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
                <p style="margin-top: 20px;">Message sent successfully!</p>
                <button onclick="resetContactForm(this)" style="
                    background: linear-gradient(135deg, #2ecc71, #27ae60);
                    color: white;
                    border: none;
                    padding: 12px 30px;
                    border-radius: 25px;
                    font-size: 1.1em;
                    cursor: pointer;
                    margin-top: 20px;
                    transition: all 0.3s ease;
                    display: inline-block;
                    box-shadow: 0 5px 15px rgba(46, 204, 113, 0.3);
                    transform: translateY(0);
                " onmouseover="this.style.transform='translateY(-2px) scale(1.05)';this.style.boxShadow='0 8px 20px rgba(46, 204, 113, 0.4)'" 
                   onmouseout="this.style.transform='translateY(0) scale(1)';this.style.boxShadow='0 5px 15px rgba(46, 204, 113, 0.3)'">
                    Send Another Message
                </button>
            </div>
        `;
        
        // Store original content for reset
        form.originalContent = originalContent;
    };

    // Add form reset handler
    window.resetContactForm = function(button) {
        const form = document.getElementById('contactForm');
        form.innerHTML = form.originalContent;
    };

    // Add contact overlay functions
    window.showContactOverlay = function() {
        const overlay = document.getElementById('contactOverlay');
        const content = document.getElementById('contactOverlayContent');
        const isMobile = window.innerWidth <= 480;
        
        overlay.style.visibility = 'visible';
        overlay.style.opacity = '1';
        overlay.classList.add('active');
        
        if (isMobile) {
            overlay.style.transform = 'translate(-50%, -50%) scale(1)';
            content.style.transform = 'translateY(0)';
        } else {
            overlay.style.transform = 'translate(-50%, -50%) scale(1) perspective(2000px) rotateX(0deg)';
        }
        
        setTimeout(() => {
            content.style.opacity = '1';
            content.classList.add('active');
        }, 300);
    };

    window.hideContactOverlay = function() {
        const overlay = document.getElementById('contactOverlay');
        const content = document.getElementById('contactOverlayContent');
        const isMobile = window.innerWidth <= 480;
        
        content.style.opacity = '0';
        content.classList.remove('active');
        overlay.classList.remove('active');
        
        if (isMobile) {
            overlay.style.transform = 'translate(-50%, -50%) scale(0.6)';
        } else {
            overlay.style.transform = 'translate(-50%, -60%) scale(0.6) perspective(2000px) rotateX(45deg)';
        }
        
        setTimeout(() => {
            overlay.style.visibility = 'hidden';
        }, 800);
    };

    // Add touch event handling for contact overlay
    contactOverlay.addEventListener('touchstart', (e) => {
        touchStartY = e.touches[0].clientY;
    }, false);

    contactOverlay.addEventListener('touchmove', (e) => {
        touchEndY = e.touches[0].clientY;
    }, false);

    contactOverlay.addEventListener('touchend', () => {
        const swipeDistance = touchEndY - touchStartY;
        if (swipeDistance > 100) { // Swipe down threshold
            hideContactOverlay();
        }
    }, false);

    // Create skill billboards
    const skillBillboards = [
        {
            icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg',
            title: 'JavaScript',
            description: 'Modern JavaScript Development ES6+ & Node.js',
            position: new THREE.Vector3(20, 9, 150),
            level: 95
        },
        {
            icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg',
            title: 'Python',
            description: 'Backend Development & Data Science',
            position: new THREE.Vector3(20, 9, 165),
            level: 90
        },
        {
            icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/cplusplus/cplusplus-original.svg',
            title: 'C++',
            description: 'Systems & Game Development',
            position: new THREE.Vector3(20, 9, 180),
            level: 88
        },
        {
            icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/threejs/threejs-original.svg',
            title: 'Three.js',
            description: '3D Graphics & WebGL Development',
            position: new THREE.Vector3(20, 9, 195),
            level: 85
        }
    ];

    // Add portfolio projects data
    const portfolioProjects = [
        {
            image: 'https://picsum.photos/500/300?',
            title: 'Planet explorer',
            githubUrl: 'https://github.com/triquetradeveloper/Planet-explorer',
            position: new THREE.Vector3(-20, 6, 235) // Adjusted position: lower and further from road
        },
        
    ];

    // Create portfolio billboard function
    const createPortfolioBillboard = (imageUrl, title, description, githubUrl, position) => {
        const billboardWidth = 10;
        const billboardHeight = 8;
        const billboardDepth = 0.4;
        const billboardGeometry = new THREE.BoxGeometry(billboardWidth, billboardHeight, billboardDepth);

        // Create canvas for the billboard
        const canvas = document.createElement('canvas');
        canvas.width = 1024;
        canvas.height = 1024;
        const context = canvas.getContext('2d');

        // Set background with gradient
        const gradient = context.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#2c3e50');
        gradient.addColorStop(1, '#3498db');
        context.fillStyle = gradient;
        context.fillRect(0, 0, canvas.width, canvas.height);

        // Create texture and materials first
        const billboardTexture = new THREE.CanvasTexture(canvas);
        billboardTexture.encoding = THREE.sRGBEncoding;

        const materials = [
            new THREE.MeshStandardMaterial({ color: 0x2c3e50, emissive: 0x2c3e50, emissiveIntensity: 0 }), // right
            new THREE.MeshStandardMaterial({ color: 0x2c3e50, emissive: 0x2c3e50, emissiveIntensity: 0 }), // left
            new THREE.MeshStandardMaterial({ color: 0x2c3e50, emissive: 0x2c3e50, emissiveIntensity: 0 }), // top
            new THREE.MeshStandardMaterial({ color: 0x2c3e50, emissive: 0x2c3e50, emissiveIntensity: 0 }), // bottom
            new THREE.MeshStandardMaterial({ 
                map: billboardTexture,
                emissive: 0xffffff,
                emissiveMap: billboardTexture,
                emissiveIntensity: 0
            }), // front
            new THREE.MeshStandardMaterial({ color: 0x2c3e50, emissive: 0x2c3e50, emissiveIntensity: 0 })  // back
        ];

        // Create the billboard mesh
        const billboard = new THREE.Mesh(billboardGeometry, materials);
        billboard.position.copy(position);
        billboard.rotation.y = Math.PI / 2;
        billboard.castShadow = true;
        billboard.receiveShadow = true;
        billboard.userData.githubUrl = githubUrl;

        // Load project image with error handling
        const img = new Image();
        img.crossOrigin = "anonymous";
        
        img.onload = () => {
            // Clear the canvas
            context.fillStyle = gradient;
            context.fillRect(0, 0, canvas.width, canvas.height);

            // Add glow effect
            context.shadowColor = '#3498db';
            context.shadowBlur = 20;

            // Draw project image
            const imageSize = 600;
            const imageX = (canvas.width - imageSize) / 2;
            const imageY = 50;
            
            // Draw image with rounded corners
            context.save();
            context.beginPath();
            context.moveTo(imageX + 20, imageY);
            context.lineTo(imageX + imageSize - 20, imageY);
            context.quadraticCurveTo(imageX + imageSize, imageY, imageX + imageSize, imageY + 20);
            context.lineTo(imageX + imageSize, imageY + imageSize - 20);
            context.quadraticCurveTo(imageX + imageSize, imageY + imageSize, imageX + imageSize - 20, imageY + imageSize);
            context.lineTo(imageX + 20, imageY + imageSize);
            context.quadraticCurveTo(imageX, imageY + imageSize, imageX, imageY + imageSize - 20);
            context.lineTo(imageX, imageY + 20);
            context.quadraticCurveTo(imageX, imageY, imageX + 20, imageY);
            context.closePath();
            context.clip();
            
            context.drawImage(img, imageX, imageY, imageSize, imageSize);
            context.restore();

            // Draw title
            context.shadowColor = 'rgba(0, 0, 0, 0.5)';
            context.shadowBlur = 10;
            context.shadowOffsetY = 2;
            context.fillStyle = '#ffffff';
            context.font = 'bold 72px Arial';
            context.textAlign = 'center';
            context.fillText(title, canvas.width/2, imageY + imageSize + 80);

            // Draw description if provided
            if (description) {
                context.font = '36px Arial';
                context.shadowBlur = 5;
                context.fillText(description, canvas.width/2, imageY + imageSize + 140);
            }

            // Draw GitHub link
            const githubY = imageY + imageSize + (description ? 200 : 160);
            context.font = 'bold 42px Arial';
            context.fillStyle = '#3498db';
            context.shadowColor = 'rgba(52, 152, 219, 0.5)';
            context.shadowBlur = 10;
            context.fillText('View on GitHub', canvas.width/2, githubY);

            // Add hover indicator
            context.font = '24px Arial';
            context.fillStyle = '#ffffff';
            context.shadowBlur = 5;
            context.fillText('(Click to open)', canvas.width/2, githubY + 40);

            // Update texture
            billboardTexture.needsUpdate = true;
        };

        img.onerror = () => {
            // If image fails to load, draw a placeholder
            context.fillStyle = gradient;
            context.fillRect(0, 0, canvas.width, canvas.height);

            // Draw placeholder image design
            const imageSize = 600;
            const imageX = (canvas.width - imageSize) / 2;
            const imageY = 50;

            context.fillStyle = '#34495e';
            context.fillRect(imageX, imageY, imageSize, imageSize);

            // Draw placeholder icon
            context.fillStyle = '#3498db';
            context.font = '120px Arial';
            context.textAlign = 'center';
            context.fillText('🖼️', canvas.width/2, imageY + imageSize/2);

            // Draw "Image Unavailable"
            context.fillStyle = '#ffffff';
            context.font = '48px Arial';
            context.fillText('Image Unavailable', canvas.width/2, imageY + imageSize/2 + 80);

            // Draw rest of the content
            context.shadowColor = 'rgba(0, 0, 0, 0.5)';
            context.shadowBlur = 10;
            context.shadowOffsetY = 2;
            context.fillStyle = '#ffffff';
            context.font = 'bold 72px Arial';
            context.fillText(title, canvas.width/2, imageY + imageSize + 80);

            if (description) {
                context.font = '36px Arial';
                context.shadowBlur = 5;
                context.fillText(description, canvas.width/2, imageY + imageSize + 140);
            }

            // Update texture
            billboardTexture.needsUpdate = true;
        };

        // Start loading the image
        img.src = imageUrl;

        scene.add(billboard);

        // Store materials for day/night switching
        if (!window.portfolioBillboardMaterials) {
            window.portfolioBillboardMaterials = [];
        }
        window.portfolioBillboardMaterials.push(...materials);

        return billboard;
    };

    // Create portfolio billboards
    portfolioProjects.forEach(project => {
        const billboard = createPortfolioBillboard(
            project.image,
            project.title,
            project.description,
            project.githubUrl,
            project.position
        );
        billboard.userData.type = 'portfolioBillboard';
        billboard.userData.title = project.title;
    });

    // Create skill billboards
    const createSkillBillboard = (iconUrl, title, description, position, level) => {
        const billboardWidth = 12;
        const billboardHeight = 12;
        const billboardDepth = 0.4;
        const billboardGeometry = new THREE.BoxGeometry(billboardWidth, billboardHeight, billboardDepth);

        // Create canvas for the billboard
        const canvas = document.createElement('canvas');
        canvas.width = 1024;
        canvas.height = 1024;
        const context = canvas.getContext('2d');

        // Set background with gradient
        const gradient = context.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#2c3e50');
        gradient.addColorStop(1, '#3498db');
        context.fillStyle = gradient;
        context.fillRect(0, 0, canvas.width, canvas.height);

        // Add glow effect
        context.shadowColor = '#3498db';
        context.shadowBlur = 20;

        // Load icon
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.onload = () => {
            // Draw icon
            const iconSize = 200;
            context.drawImage(img, (canvas.width - iconSize) / 2, 100, iconSize, iconSize);

            // Draw title
            context.fillStyle = '#ffffff';
            context.font = 'bold 64px Arial';
            context.textAlign = 'center';
            context.fillText(title, canvas.width/2, 400);

            // Draw description
            context.font = '32px Arial';
            context.fillText(description, canvas.width/2, 460);

            // Draw single progress bar
            const barY = 600;
            const barHeight = 40;
            const barWidth = 700;
            
            // Draw bar background
            context.fillStyle = 'rgba(255, 255, 255, 0.1)';
            context.fillRect((canvas.width - barWidth) / 2, barY, barWidth, barHeight);
            
            // Draw progress bar with gradient
            const barGradient = context.createLinearGradient(
                (canvas.width - barWidth) / 2, 0,
                (canvas.width + barWidth) / 2, 0
            );
            barGradient.addColorStop(0, '#3498db');
            barGradient.addColorStop(1, '#2980b9');
            context.fillStyle = barGradient;
            context.fillRect(
                (canvas.width - barWidth) / 2,
                barY,
                barWidth * (level / 100),
                barHeight
            );
            
            // Add shine effect
            const shineGradient = context.createLinearGradient(
                (canvas.width - barWidth) / 2, barY,
                (canvas.width - barWidth) / 2, barY + barHeight
            );
            shineGradient.addColorStop(0, 'rgba(255, 255, 255, 0.2)');
            shineGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.1)');
            shineGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
            context.fillStyle = shineGradient;
            context.fillRect(
                (canvas.width - barWidth) / 2,
                barY,
                barWidth * (level / 100),
                barHeight
            );

            // Draw percentage
            context.font = 'bold 48px Arial';
            context.fillStyle = '#ffffff';
            context.textAlign = 'center';
            context.fillText(level + '%', canvas.width/2, barY + barHeight + 50);

            // Update texture
            billboardTexture.needsUpdate = true;
        };
        img.src = iconUrl;

        // Create texture and materials
        const billboardTexture = new THREE.CanvasTexture(canvas);
        billboardTexture.encoding = THREE.sRGBEncoding;

        const materials = [
            new THREE.MeshStandardMaterial({ color: 0x2c3e50, emissive: 0x2c3e50, emissiveIntensity: 0 }), // right
            new THREE.MeshStandardMaterial({ color: 0x2c3e50, emissive: 0x2c3e50, emissiveIntensity: 0 }), // left
            new THREE.MeshStandardMaterial({ color: 0x2c3e50, emissive: 0x2c3e50, emissiveIntensity: 0 }), // top
            new THREE.MeshStandardMaterial({ color: 0x2c3e50, emissive: 0x2c3e50, emissiveIntensity: 0 }), // bottom
            new THREE.MeshStandardMaterial({ 
                map: billboardTexture,
                emissive: 0xffffff,
                emissiveMap: billboardTexture,
                emissiveIntensity: 0
            }), // front
            new THREE.MeshStandardMaterial({ color: 0x2c3e50, emissive: 0x2c3e50, emissiveIntensity: 0 })  // back
        ];

        const billboard = new THREE.Mesh(billboardGeometry, materials);
        billboard.position.copy(position);
        billboard.rotation.y = -Math.PI / 2;
        billboard.castShadow = true;
        billboard.receiveShadow = true;

        scene.add(billboard);

        // Store materials for day/night switching
        if (!window.skillBillboardMaterials) {
            window.skillBillboardMaterials = [];
        }
        window.skillBillboardMaterials.push(...materials);

        return billboard;
    };

    // Update skill billboard creation
    skillBillboards.forEach(skill => {
        const billboard = createSkillBillboard(
            skill.icon,
            skill.title,
            skill.description,
            skill.position,
            skill.level
        );
        billboard.userData.type = 'skillBillboard';
        billboard.userData.title = skill.title;
    });

    // ... rest of the existing code ...
}

function updateSunPosition(elevation) {
    const phi = THREE.MathUtils.degToRad(90 - elevation);
    const theta = THREE.MathUtils.degToRad(180);
    sun.setFromSphericalCoords(1, phi, theta);
    sky.material.uniforms['sunPosition'].value.copy(sun);
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(sky).texture;
    directionalLight.position.copy(sun).multiplyScalar(100);
}

function switchToNight() {
    updateSunPosition(nightSettings.elevation);
    scene.fog.color.setHex(nightSettings.fogColor);
    scene.fog.near = nightSettings.fogNear;
    scene.fog.far = nightSettings.fogFar;
    ambientLight.intensity = nightSettings.ambientIntensity;
    directionalLight.intensity = nightSettings.directionalIntensity;
    if(carHeadlight1) carHeadlight1.intensity = 300;
    if(carHeadlight2) carHeadlight2.intensity = 300;

    // Make billboards glow
    if(window.billboardMaterials) {
        window.billboardMaterials.forEach(material => {
            if(material.emissiveMap) {
                material.emissiveIntensity = 2.0;
            }
        });
    }
    if(window.aboutMeMaterials) {
        window.aboutMeMaterials.forEach(material => {
            if(material.emissiveMap) {
                material.emissiveIntensity = 3.0;
            }
        });
    }
    if(window.skillBillboardMaterials) {
        window.skillBillboardMaterials.forEach(material => {
            if(material.emissiveMap) {
                material.emissiveIntensity = 2.0;
            }
        });
    }
    if(window.portfolioBillboardMaterials) {
        window.portfolioBillboardMaterials.forEach(material => {
            if(material.emissiveMap) {
                material.emissiveIntensity = 2.0;
            }
        });
    }
}

function switchToDay() {
    updateSunPosition(daySettings.elevation);
    scene.fog.color.setHex(daySettings.fogColor);
    scene.fog.near = daySettings.fogNear;
    scene.fog.far = daySettings.fogFar;
    ambientLight.intensity = daySettings.ambientIntensity;
    directionalLight.intensity = daySettings.directionalIntensity;
    if(carHeadlight1) carHeadlight1.intensity = 0;
    if(carHeadlight2) carHeadlight2.intensity = 0;

    // Turn off billboard glow
    if(window.billboardMaterials) {
        window.billboardMaterials.forEach(material => {
            material.emissiveIntensity = 0;
        });
    }
    if(window.aboutMeMaterials) {
        window.aboutMeMaterials.forEach(material => {
            material.emissiveIntensity = 0;
        });
    }
    if(window.skillBillboardMaterials) {
        window.skillBillboardMaterials.forEach(material => {
            material.emissiveIntensity = 0;
        });
    }
    if(window.portfolioBillboardMaterials) {
        window.portfolioBillboardMaterials.forEach(material => {
            material.emissiveIntensity = 0;
        });
    }
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);
    
    // Animate floating billboards
    const time = Date.now() * 0.001; // Convert to seconds
    window.floatingBillboards?.forEach(billboard => {
        const floatHeight = 0.3; // Maximum float height
        const floatSpeed = 1.5; // Speed of floating animation
        
        // Calculate new Y position with smooth sine wave
        const newY = billboard.userData.initialY + 
                    Math.sin((time + billboard.userData.floatOffset) * floatSpeed) * floatHeight;
        
        billboard.position.y = newY;
        
        // Add subtle rotation
        billboard.rotation.z = Math.sin((time + billboard.userData.floatOffset) * floatSpeed) * 0.02;
    });

    controls.update();
    renderer.render(scene, camera);
}