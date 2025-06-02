import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { VRButton } from "three/addons/webxr/VRButton.js";
import * as Stats from "three/addons/libs/stats.module.js";
import { GUI } from "three/addons/libs/lil-gui.module.min.js";

//////////////////////
/* GLOBAL VARIABLES */
//////////////////////
let camera, scene, renderer, plane, directionalLight
let lightOn = true;

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
}

//////////////////////
/* CREATE CAMERA(S) */
//////////////////////
function createCamera() {
  const aspect = window.innerWidth / window.innerHeight;
  const frustumSize = 80;

  camera = new THREE.PerspectiveCamera(70, aspect, 1, 1000);
  camera.position.set(50, 50, 50);
  camera.lookAt(0, 0, 0);

}

/////////////////////
/* CREATE LIGHT(S) */
/////////////////////
function createLight() {
 
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

  ctx.fillStyle = '#77ee77';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const coresFlores = ['white', 'yellow', 'violet', 'lightblue'];
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

    const geometry = new THREE.PlaneGeometry(50, 50);
    const material = new THREE.MeshStandardMaterial({ map: texture, side: THREE.DoubleSide });
    plane = new THREE.Mesh(geometry, material);
    plane.rotation.x = -Math.PI / 2; 
    scene.add(plane);
}

function createPlaneWithHeightmap(url, textura) {
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
function update() {}

/////////////
/* DISPLAY */
/////////////
function render() {
    renderer.render(scene, camera);
}

////////////////////////////////
/* INITIALIZE ANIMATION CYCLE */
////////////////////////////////
function init() {
  renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

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
    renderer.setSize(window.innerWidth, window.innerHeight);
}

///////////////////////
/* KEY DOWN CALLBACK */
///////////////////////
function onKeyDown(e) { 
    if (e.key === '1') {
        const textura = gerarTexturaCampoFloral();
        createPlaneWithTexture(textura);
    } 
    else if (e.key === '2') {
        const textura = gerarTexturaCeuEstrelado();
        createPlaneWithTexture(textura);
    }
    else if (e.key === 'd' || e.key === "D") {
        if (lightOn) {
            directionalLight.visible = false;  
            lightOn = false;
        } else { 
            directionalLight.visible = true;
            lightOn = true;
        }
    }
    
}



///////////////////////
/* KEY UP CALLBACK */
///////////////////////
function onKeyUp(e) {}

init();
animate();