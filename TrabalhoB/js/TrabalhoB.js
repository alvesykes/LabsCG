import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { VRButton } from "three/addons/webxr/VRButton.js";
import * as Stats from "three/addons/libs/stats.module.js";
import { GUI } from "three/addons/libs/lil-gui.module.min.js";

//////////////////////
/* GLOBAL VARIABLES */
//////////////////////
let camera, scene, renderer;
let cameras = {};

/////////////////////
/* CREATE SCENE(S) */
/////////////////////
function createScene() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf0f0f0);

  scene.add(new THREE.AxesHelper(10));

}

//////////////////////
/* CREATE CAMERA(S) */
//////////////////////
function createCameras() {
  const aspect = window.innerWidth / window.innerHeight;
  const frustumSize = 60;

  // Frontal (olha de +Z para o centro)
  cameras.frontal = new THREE.OrthographicCamera(
    (-frustumSize * aspect) / 2,
    (frustumSize * aspect) / 2,
    frustumSize / 2,
    (-frustumSize) / 2,
    1,
    1000
  );
  cameras.frontal.position.set(0, 0, 50);
  cameras.frontal.lookAt(0, 0, 0);

  // Lateral (olha de +X para o centro)
  cameras.lateral = new THREE.OrthographicCamera(
    (-frustumSize * aspect) / 2,
    (frustumSize * aspect) / 2,
    frustumSize / 2,
    (-frustumSize) / 2,
    1,
    1000
  );
  cameras.lateral.position.set(50, 0, 0);
  cameras.lateral.lookAt(0, 0, 0);

  // Topo (olha de +Y para o centro)
  cameras.topo = new THREE.OrthographicCamera(
    (-frustumSize * aspect) / 2,
    (frustumSize * aspect) / 2,
    frustumSize / 2,
    (-frustumSize) / 2,
    1,
    1000
  );
  cameras.topo.position.set(0, 50, 0);
  cameras.topo.lookAt(0, 0, 0);

  // Perspetiva (posição sobre a cena)
  cameras.perspetiva = new THREE.PerspectiveCamera(70, aspect, 1, 1000);
  cameras.perspetiva.position.set(50, 50, 50);
  cameras.perspetiva.lookAt(0, 0, 0);

  // Inicialmente ativa a perspetiva
  camera = cameras.perspetiva;
}

/////////////////////
/* CREATE LIGHT(S) */
/////////////////////

////////////////////////
/* CREATE OBJECT3D(S) */
////////////////////////


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
  createCameras();

  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("resize", onResize);
}

/////////////////////
/* ANIMATION CYCLE */
/////////////////////
function animate() {
  render();
  requestAnimationFrame(animate);
}

////////////////////////////
/* RESIZE WINDOW CALLBACK */
////////////////////////////
function onResize() {
  const aspect = window.innerWidth / window.innerHeight;
  const frustumSize = 60;

  // Atualiza o tamanho da câmera
  ["frontal", "lateral", "topo"].forEach((key) => {
    if (cameras[key]) {
      cameras[key].left = (-frustumSize * aspect) / 2;
      cameras[key].right = (frustumSize * aspect) / 2;
      cameras[key].top = frustumSize / 2;
      cameras[key].bottom = (-frustumSize) / 2;
      cameras[key].updateProjectionMatrix();
    }
  });

  // Atualiza perspetiva
  if (cameras.perspetiva) {
    cameras.perspetiva.aspect = aspect;
    cameras.perspetiva.updateProjectionMatrix();
  }

  renderer.setSize(window.innerWidth, window.innerHeight);
}

///////////////////////
/* KEY DOWN CALLBACK */
///////////////////////
function onKeyDown(e) {
  switch (e.key) {
    case "1":
      camera = cameras.frontal;
      break;
    case "2":
      camera = cameras.lateral;
      break;
    case "3":
      camera = cameras.topo;
      break;
    case "4":
      camera = cameras.perspetiva;
      break;
    default:
      break;
  }
}

///////////////////////
/* KEY UP CALLBACK */
///////////////////////
function onKeyUp(e) {}

init();
animate();