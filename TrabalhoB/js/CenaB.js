import * as THREE from "three";

let camera, scene, renderer;
let cameras = {};

function createScene() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf0f0f0); 

  scene.add(new THREE.AxesHelper(10));

  createTable(0, 8, 0);
  createBall(0, 0, 15);
}

function createCameras() {
  const aspect = window.innerWidth / window.innerHeight;
  const frustumSize = 60;

  // Frontal (olha de +Z para o centro)
  cameras.frontal = new THREE.OrthographicCamera(
    -frustumSize * aspect / 2, frustumSize * aspect / 2,
    frustumSize / 2, -frustumSize / 2,
    1, 1000
  );
  cameras.frontal.position.set(0, 0, 50);
  cameras.frontal.lookAt(0, 0, 0);

  // Lateral (olha de +X para o centro)
  cameras.lateral = new THREE.OrthographicCamera(
    -frustumSize * aspect / 2, frustumSize * aspect / 2,
    frustumSize / 2, -frustumSize / 2,
    1, 1000
  );
  cameras.lateral.position.set(50, 0, 0);
  cameras.lateral.lookAt(0, 0, 0);

  // Topo (olha de +Y para o centro)
  cameras.topo = new THREE.OrthographicCamera(
    -frustumSize * aspect / 2, frustumSize * aspect / 2,
    frustumSize / 2, -frustumSize / 2,
    1, 1000
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

function render() {
  renderer.render(scene, camera);
}

function onKeyDown(event) {
  switch (event.key) {
    case '1':
      camera = cameras.frontal;
      break;
    case '2':
      camera = cameras.lateral;
      break;
    case '3':
      camera = cameras.topo;
      break;
    case '4':
      camera = cameras.perspetiva;
      break;
    default:
      break;
  }
}

function onWindowResize() {
  const aspect = window.innerWidth / window.innerHeight;
  const frustumSize = 60;

  // Atualiza o tamanho da câmera 
  ['frontal', 'lateral', 'topo'].forEach(key => {
    if (cameras[key]) {
      cameras[key].left = -frustumSize * aspect / 2;
      cameras[key].right = frustumSize * aspect / 2;
      cameras[key].top = frustumSize / 2;
      cameras[key].bottom = -frustumSize / 2;
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

function init() {
  renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  createScene();
  createCameras();

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('resize', onWindowResize);
}

function animate() {
  render();
  requestAnimationFrame(animate);
}

init();

animate();
