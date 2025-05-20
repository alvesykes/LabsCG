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

  // Add lighting so MeshStandardMaterial shows colors
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(30, 50, 50);
  scene.add(directionalLight);

  createRobot();
  createReboque();
}

//////////////////////
/* CREATE CAMERA(S) */
//////////////////////
function createCameras() {
  const aspect = window.innerWidth / window.innerHeight;
  const frustumSize = 80;

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

function createRobot() {
  const robot = new THREE.Group();

  // Tronco
  const tronco = new THREE.Mesh(
    new THREE.BoxGeometry(20, 10, 12),
    new THREE.MeshStandardMaterial({ color: 0xff0000 })
  );
  tronco.position.set(0, 0, 0);
  robot.add(tronco);

  // Cabeça
  const cabeca = new THREE.Group();
  const cabecaPrincipal = new THREE.Mesh(
    new THREE.CylinderGeometry(2.5, 2.5, 5, 6),
    new THREE.MeshStandardMaterial({ color: 0x0000ff })
  );
  cabecaPrincipal.position.set(0, 2.5, 0);
  cabeca.add(cabecaPrincipal);

  // Olhos 
  const olhoL = new THREE.Mesh(
    new THREE.CylinderGeometry(0.5, 0.5, 1, 6),
    new THREE.MeshStandardMaterial({ color: 0x000000 })
  );
  olhoL.rotation.x = Math.PI / 2;
  olhoL.position.set(-1.2, 4.2, 1.8);
  cabeca.add(olhoL);

  const olhoR = olhoL.clone();
  olhoR.position.x = 1.2;
  cabeca.add(olhoR);

  // Antenas
  const antenaL = new THREE.Mesh(
    new THREE.CylinderGeometry(0.5, 0.5, 2.5, 6),
    new THREE.MeshStandardMaterial({ color: 0xff0000 })
  );
  antenaL.position.set(-2.5, 5, 0);
  cabeca.add(antenaL);

  const antenaR = antenaL.clone();
  antenaR.position.x = 2.5;
  cabeca.add(antenaR);

  cabeca.position.set(0, 5, 0);
  robot.add(cabeca);

  // Braços (esquerdo e direito)
  function createBraco(side = 1) {
    const braco = new THREE.Group();

    // Braço superior
    const superiorBraco = new THREE.Mesh(
      new THREE.BoxGeometry(10, 4, 4),
      new THREE.MeshStandardMaterial({ color: 0x0000ff })
    );
    superiorBraco.rotation.z = Math.PI / 2;
    superiorBraco.position.set(12 * side, 0, -4);
    braco.add(superiorBraco);

    // Tubos de escape
    const escape1 = new THREE.Mesh(
      new THREE.CylinderGeometry(0.75, 0.75, 10, 6),
      new THREE.MeshStandardMaterial({ color: 0xffffff })
    );
    escape1.position.set(14.5 * side, 4, -4.5);
    braco.add(escape1);

    const escape2 = escape1.clone();
    escape2.position.z = -3.5;
    braco.add(escape2);

    // Antebraço
    const antebraco = new THREE.Mesh(
      new THREE.BoxGeometry(4, 4,10),
      new THREE.MeshStandardMaterial({ color: 0x0000ff })
    );
    antebraco.position.set(12 * side, -7, 3);
    braco.add(antebraco);

    return braco;
  }
  robot.add(createBraco(1));  // Direito
  robot.add(createBraco(-1)); // Esquerdo

  // Abdómen
  const abdomen = new THREE.Mesh(
    new THREE.BoxGeometry(12, 4, 12),
    new THREE.MeshStandardMaterial({ color: 0xffffff })
  );
  abdomen.position.set(0, -7, 0);
  robot.add(abdomen);

  // Cintura
  const cintura = new THREE.Mesh(
    new THREE.BoxGeometry(20, 6, 12),
    new THREE.MeshStandardMaterial({ color: 0xff0000 })
  );
  cintura.position.set(0, -12, 0);
  robot.add(cintura);

  // Coxas e pernas
  function createPerna(side = 1) {
    const perna = new THREE.Group();

    // Coxa
    const coxa = new THREE.Mesh(
      new THREE.BoxGeometry(3, 4, 3),
      new THREE.MeshStandardMaterial({ color: 0xffffff })
    );
    coxa.position.set(3 * side, -17, 0);
    perna.add(coxa);

    // Perna
    const lowerPerna = new THREE.Mesh(
      new THREE.BoxGeometry(4, 16, 4),
      new THREE.MeshStandardMaterial({ color: 0x0000ff })
    );
    lowerPerna.position.set(3 * side, -27, 0);
    perna.add(lowerPerna);

    // Pé
    const pe = new THREE.Mesh(
      new THREE.BoxGeometry(4, 2, 4),
      new THREE.MeshStandardMaterial({ color: 0x333333 })
    );
    pe.position.set(3 * side, -34, 4);
    perna.add(pe);

    return perna;
  }
  robot.add(createPerna(1));
  robot.add(createPerna(-1));

  // Rodas na cintura (direita e esquerda)
  for (let side of [1, -1]) {
    const wheel = new THREE.Mesh(
      new THREE.CylinderGeometry(2, 2, 2, 16),
      new THREE.MeshStandardMaterial({ color: 0x111111 })
    );
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(11 * side, -12, 0); 
    robot.add(wheel);
  }

  // Rodas nas pernas (direita e esquerda)
  for (let side of [1, -1]) {
    const wheel2 = new THREE.Mesh(
      new THREE.CylinderGeometry(2, 2, 2, 16),
      new THREE.MeshStandardMaterial({ color: 0x111111 })
    );
    wheel2.rotation.z = Math.PI / 2;
    wheel2.position.set(5.5 * side, -32, 0);
    robot.add(wheel2);

    const wheel1 = new THREE.Mesh(
      new THREE.CylinderGeometry(2, 2, 2, 16),
      new THREE.MeshStandardMaterial({ color: 0x111111 })
    );
    wheel1.rotation.z = Math.PI / 2;
    wheel1.position.set(5.5 * side, -27, 0); 
    robot.add(wheel1);
  }

  robot.position.y = 0;

  scene.add(robot);
}

function createReboque() {
  const reboque = new THREE.Group();

  // Contentor (caixa principal)
  const contentor = new THREE.Mesh(
    new THREE.BoxGeometry(32, 12, 20),
    new THREE.MeshStandardMaterial({ color: 0x888888 })
  );
  contentor.position.set(0, 6, 0);
  reboque.add(contentor);

  // Peça de ligação (barra)
  const ligacao = new THREE.Mesh(
    new THREE.BoxGeometry(6, 2, 2),
    new THREE.MeshStandardMaterial({ color: 0x333333 })
  );
  ligacao.position.set(-16, 2, 0);
  reboque.add(ligacao);

  // Rodas (4)
  const rodaOffsets = [
    [12, -2, 8],   // frente direita
    [12, -2, -8],  // frente esquerda
    [8, -2, 8],  // trás direita
    [8, -2, -8], // trás esquerda
  ];
  for (let [x, y, z] of rodaOffsets) {
    const roda = new THREE.Mesh(
      new THREE.CylinderGeometry(2, 2, 2, 16),
      new THREE.MeshStandardMaterial({ color: 0x111111 })
    );
    roda.rotation.z = Math.PI / 2;
    roda.rotation.y = Math.PI / 2;
    roda.position.set(x, y, z);
    reboque.add(roda);
  }

  // Rodar o reboque para ficar de frente para a camera frontal
  reboque.rotation.y = Math.PI / 2;

  // Posiciona o reboque atrás do camião (ajuste conforme necessário)
  reboque.position.set(-30, 0, 0);

  scene.add(reboque);
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
  const frustumSize = 80;

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