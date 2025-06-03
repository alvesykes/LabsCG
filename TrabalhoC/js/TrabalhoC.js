import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { VRButton } from "three/addons/webxr/VRButton.js";
import * as Stats from "three/addons/libs/stats.module.js";
import { GUI } from "three/addons/libs/lil-gui.module.min.js";

//////////////////////
/* GLOBAL VARIABLES */
//////////////////////
let camera, scene, renderer, plane, textura, directionalLight;
let lightOn = true;
// Adiciona variáveis para câmara fixa e estereoscópica
let fixedCamera, stereoCamera;
let ovni, spotlight, luzes = [], spotlightOn = true, luzesAtivas = true;
const keysPressed = {};

/////////////////////
/* CREATE SCENE(S) */
/////////////////////
function createScene() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);
    
    scene.add(new THREE.AxesHelper(10));
    
    createLight();
    const textura0 = gerarTexturaCampoFloral();
    //createPlaneWithTexture(textura0);
    createMoon();
    createPlaneWithHeightmap("heightmap.png", textura0);
    createSkydome();

    // Adiciona a casa alentejana
    createAlentejoHouse();
    createOvni();
}

//////////////////////
/* CREATE CAMERA(S) */
//////////////////////
function createCamera() {
  const aspect = window.innerWidth / window.innerHeight;
  camera = new THREE.PerspectiveCamera(70, aspect, 1, 1000);
  camera.position.set(45, 30, 45);
  camera.lookAt(0, 15, 0); 

  // Câmara fixa com vista geral
  fixedCamera = new THREE.PerspectiveCamera(70, aspect, 1, 1000);
  fixedCamera.position.set(80, 60, 80);
  fixedCamera.lookAt(0, 0, 0);

  // StereoCamera para VR
  stereoCamera = new THREE.StereoCamera();
  stereoCamera.aspect = aspect;
}

/////////////////////
/* CREATE LIGHT(S) */
/////////////////////
function createLight() {
    //Luz da lua
    directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
    directionalLight.position.set(0, 40, 20);
    scene.add(directionalLight);

}

////////////////////////
/* CREATE OBJECT3D(S) */
////////////////////////
function gerarTexturaCampoFloral() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#88dd55';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const coresFlores = ['white', 'yellow', 'violet', '#69daff'];
  for (let i = 0; i < 700; i++) {
    ctx.beginPath();
    ctx.fillStyle = coresFlores[Math.floor(Math.random() * coresFlores.length)];
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const r = Math.random() * 1 + 0.5;
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  return new THREE.CanvasTexture(canvas);
}

function gerarTexturaCeuEstrelado() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  grad.addColorStop(0, '#000033');
  grad.addColorStop(1, '#2e003e');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let i = 0; i < 500; i++) {
    ctx.beginPath();
    ctx.fillStyle = 'white';
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const r = Math.random() * 1 + 0.5;
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  return new THREE.CanvasTexture(canvas);
}
function createPlaneWithTexture(texture) {
    
    if (plane) {
        scene.remove(plane);
        plane.geometry.dispose();
        plane.material.map.dispose();
        plane.material.dispose();
    }

    const geometry = new THREE.PlaneGeometry(110, 110);
    const material = new THREE.MeshStandardMaterial({ map: texture, side: THREE.DoubleSide });
    plane = new THREE.Mesh(geometry, material);
    plane.rotation.x = -Math.PI / 2; 
    scene.add(plane);
}

function createPlaneWithHeightmap(url, textura) {
    if (plane) {
            scene.remove(plane);
            plane.geometry.dispose();
            plane.material.map.dispose();
            plane.material.dispose();
        }
    const loader = new THREE.TextureLoader();

    loader.load(url, (heightmapTexture) => {
        const geometry = new THREE.PlaneGeometry(100, 100, 100, 100);
        const material = new THREE.MeshLambertMaterial({ map: textura });
        plane = new THREE.Mesh(geometry, material);
        plane.rotation.x = -Math.PI / 2;

        const image = heightmapTexture.image;

        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(image, 0, 0);

        const imgData = ctx.getImageData(0, 0, image.width, image.height).data;

        const vertices = geometry.attributes.position;
        const vertexCount = vertices.count;

        for (let i = 0; i < vertexCount; i++) {
        const x = i % image.width;
        const y = Math.floor(i / image.width);

        const index = (y * image.width + x) * 4;
        const altura = imgData[index]; 
        const alturaNormalizada = (altura / 255) * 10;

        vertices.setZ(i, alturaNormalizada);
        }

        vertices.needsUpdate = true;
        geometry.computeVertexNormals();

        scene.add(plane);
    }, undefined, (err) => {
        console.error("Erro ao carregar heightmap:", err);
    });
}

function createSkydome() {
    const texturaCeu = gerarTexturaCeuEstrelado();

    const geometria = new THREE.SphereGeometry(50, 64, 64, 0, Math.PI * 2, 0, Math.PI / 2); 
    const material = new THREE.MeshStandardMaterial({
        map: texturaCeu,
        side: THREE.BackSide 
    });

    const skydome = new THREE.Mesh(geometria, material);
    scene.add(skydome);
}


function createMoon(){

    const moon = new THREE.Mesh(
        new THREE.SphereGeometry(3),
        new THREE.MeshStandardMaterial({ color: 0xd3d3d3, metalness: 0.5, roughness: 0.5 })
      );
    moon.position.set(0, 40, 20);
    scene.add(moon);
}


function createAlentejoHouse() {
    const house = new THREE.Group();
    house.position.set(0, 5, 0);

    // Paredes principais (brancas)
    const wallMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff });
    const walls = new THREE.Mesh(
        new THREE.BoxGeometry(18, 7, 8),
        wallMaterial
    );
    walls.position.y = 3;
    house.add(walls);

    
    // Porta (azul)
    const doorMaterial = new THREE.MeshLambertMaterial({ color: 0x0074d9 });
    const door = new THREE.Mesh(
        new THREE.BoxGeometry(2, 2.5, 0.2),
        doorMaterial
    );
    door.position.set(0, 1.25, 4.11);
    house.add(door);

    // Janelas (azul) - duas à frente
    const windowMaterial = new THREE.MeshLambertMaterial({ color: 0x0074d9 });
    const window1 = new THREE.Mesh(
        new THREE.BoxGeometry(1, 1, 0.2),
        windowMaterial
    );
    window1.position.set(-3, 3.5, 4.11);
    house.add(window1);

    const window2 = window1.clone();
    window2.position.set(3, 3.5, 4.11);
    house.add(window2);

    // Telhado (laranja, prisma triangular)
    const roofGeometry = new THREE.BufferGeometry();
    const vertices = new Float32Array([
        // base
        -6, 6, -4,   6, 6, -4,   6, 6, 4,
        -6, 6, -4,   6, 6, 4,   -6, 6, 4,
        // lados
        -6, 6, -4,   0, 9, 0,   6, 6, -4,
        6, 6, -4,    0, 9, 0,   6, 6, 4,
        6, 6, 4,     0, 9, 0,   -6, 6, 4,
        -6, 6, 4,    0, 9, 0,   -6, 6, -4,
    ]);
    roofGeometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    roofGeometry.computeVertexNormals();
    const roofMaterial = new THREE.MeshLambertMaterial({ color: 0xff6600 });
    const roof = new THREE.Mesh(roofGeometry, roofMaterial);
    house.add(roof);

    scene.add(house);
}
function createOvni(){
    ovni = new THREE.Group();

    const corpoGeometry = new THREE.SphereGeometry(3, 32, 32);
    corpoGeometry.scale(1, 0.4, 1);
    const corpoMaterial = new THREE.MeshStandardMaterial({ color: 0x88ffaa});
    const corpoMesh = new THREE.Mesh(corpoGeometry, corpoMaterial);
    ovni.add(corpoMesh);

    const cockpitGeometry = new THREE.SphereGeometry(1.5, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2);
    const cockpitMaterial = new THREE.MeshStandardMaterial({ color: 0x44ffff, transparent: true, opacity: 0.6 });
    const cockpitMesh = new THREE.Mesh(cockpitGeometry, cockpitMaterial);
    cockpitMesh.position.y = 1;
    ovni.add(cockpitMesh);

    const cilindro = new THREE.Mesh(
        new THREE.CylinderGeometry(0.8, 0.8, 0.2, 32),
        new THREE.MeshStandardMaterial({ color: 0x444444 })
    );
    cilindro.position.y = -1.2;
    ovni.add(cilindro);

    spotlight = new THREE.SpotLight(0xffffff, 30, 0, 0.56);
    spotlight.position.set(0, -1.2, 0);
    spotlight.target.position.set(0, -3, 0);
    ovni.add(spotlight);
    ovni.add(spotlight.target);

    for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * 2 * Math.PI;
        const x = Math.cos(angle) * 2.5;
        const z = Math.sin(angle) * 2.5;

        const esfera = new THREE.Mesh(
        new THREE.SphereGeometry(0.2, 16, 16),
        new THREE.MeshStandardMaterial({ color: 0xffffaa })
        );
        esfera.position.set(x, -0.7, z);
        ovni.add(esfera);

        const luz = new THREE.PointLight(0xffffaa, 1, 5);
        const lx = Math.cos(angle) * (2.8);
        const lz = Math.sin(angle) * (2.8);
        luz.position.set(lx, -0.8, lz);
        ovni.add(luz);
        luzes.push(luz);
    }
    
    ovni.position.y = 20;
    ovni.position.x = 20;
    scene.add(ovni);
}

//////////////////////
/* CHECK COLLISIONS */
//////////////////////
function checkCollisions() {}

///////////////////////
/* HANDLE COLLISIONS */
///////////////////////
function handleCollisions() {}

////////////
/* UPDATE */
////////////
function update() {
    if (ovni) {
        // Rodar sobre o eixo
        ovni.rotation.y += 0.01;

        // Movimento horizontal com setas
        const speed = 0.1;
        if (keysPressed['arrowup']) ovni.position.z -= speed;
        if (keysPressed['arrowdown']) ovni.position.z += speed;
        if (keysPressed['arrowleft']) ovni.position.x -= speed;
        if (keysPressed['arrowright']) ovni.position.x += speed;
    }
}

/////////////
/* DISPLAY */
/////////////
function render() {
    // Renderização normal ou VR
    if (renderer.xr.isPresenting) {
        renderer.render(scene, camera);
    } else {
        renderer.render(scene, camera);
    }
}

////////////////////////////////
/* INITIALIZE ANIMATION CYCLE */
////////////////////////////////
function init() {
  renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  // Ativa VR e adiciona VRButton
  renderer.xr.enabled = true;
  document.body.appendChild(VRButton.createButton(renderer));

  createScene();
  createCamera();

  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);
  window.addEventListener("resize", onResize);
}

/////////////////////
/* ANIMATION CYCLE */
/////////////////////
function animate() {
    update();
    render();
    requestAnimationFrame(animate);
    checkCollisions();
}

////////////////////////////
/* RESIZE WINDOW CALLBACK */
////////////////////////////
function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    fixedCamera.aspect = window.innerWidth / window.innerHeight;
    fixedCamera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

///////////////////////
/* KEY DOWN CALLBACK */
///////////////////////
function onKeyDown(e) { 
    keysPressed[e.key.toLowerCase()] = true;
    switch (e.key){

    
        case '1':
            textura = gerarTexturaCampoFloral();
            createPlaneWithTexture(textura);
            break;
        case '2':
            textura = gerarTexturaCeuEstrelado();
            createPlaneWithTexture(textura);
            break;
        case '3':
            textura = gerarTexturaCampoFloral();
            createPlaneWithHeightmap("heightmap.png", textura);
            break;
        case 'd' :
            if (lightOn) {
                directionalLight.visible = false;  
                lightOn = false;
            } else { 
                directionalLight.visible = true;
                lightOn = true;
            }
            break;
        case 'p':
            luzesAtivas = !luzesAtivas;
            luzes.forEach(l => l.visible = luzesAtivas);
            break;
        case 's':
            spotlightOn = !spotlightOn;
            spotlight.visible = spotlightOn;
            break;
        case '7':
            // Alterna para a câmara fixa
            camera = fixedCamera;
            break;
    }
}



///////////////////////
/* KEY UP CALLBACK */
///////////////////////
function onKeyUp(e) {
    keysPressed[e.key.toLowerCase()] = false;
}

init();
animate();