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
let wireframeMode = false;

const state = {
  theta1: 0, // pés
  theta2: 0, // pernas
  delta1: 0, // braços
  theta3: 0, // cabeça
  x:0, //Posição x do reboque
  y:-40, //Posição y do reboque
};
const limits = {
  theta1: { min: 0, max:  Math.PI},
  theta2: { min: 0, max: Math.PI / 2 },
  delta1: { min: -4, max: 0},
  theta3: { min: -Math.PI , max: 0},
};
const speed = {
  theta: 0.02,
  delta: 0.1,
};
const meshes = {
  troncoMesh: null,
  cabecaPrincipalMesh: null,
  olhoLMesh: null,
  antenaLMesh: null,
  superiorBracoMesh: null,
  escape1Mesh: null,
  escape2Mesh: null,
  antebracoMesh: null,
  abdomenMesh: null,
  cinturaBaseMesh: null,
  wheelMesh: null,
  coxaMesh: null,
  lowerPernaMesh: null,
  wheel2Mesh: null,
  wheel1Mesh: null,
  peMesh: null,
  contentorMesh: null,
  ligacaoMesh: null,
  rodaMesh: null,
};

let robotRefs = {
  pes: [],
  bracos: [],
  cabeca: null,
  pernas: [],
};

let reboqueRefs = {
  reboque: null,
}

const keysPressed = {};
const reboqueBox = new THREE.Box3();
const troncoBox = new THREE.Box3();
const cabecaBox = new THREE.Box3();
const olhoBox = new THREE.Box3();
const antenaBox = new THREE.Box3();
const bracoBox = new THREE.Box3();
const escape1Box = new THREE.Box3();
const escape2Box = new THREE.Box3();
const abdomenBox = new THREE.Box3();
const cinturaBaseBox = new THREE.Box3();
const lowerPernaBox = new THREE.Box3();
const coxaBox = new THREE.Box3();
const wheelBox = new THREE.Box3();
const peBox = new THREE.Box3();
const ligacaoBox = new THREE.Box3();
const rodaBox = new THREE.Box3();
const contentorBox = new THREE.Box3();

/////////////////////
/* CREATE SCENE(S) */
/////////////////////
function createScene() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf0f0f0);

  scene.add(new THREE.AxesHelper(10));

  createLight();
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
function createLight() {
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(30, 50, 50);
  scene.add(directionalLight);
}

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

  tronco.geometry.computeBoundingBox();
  robot.add(tronco);

  // Cabeça
  const cabeca = new THREE.Group();
  const cabecaPrincipal = new THREE.Mesh(
    new THREE.CylinderGeometry(2.5, 2.5, 5, 6),
    new THREE.MeshStandardMaterial({ color: 0x0000ff })
  );
  meshes.cabecaPrincipalMesh = cabecaPrincipal;
  cabecaPrincipal.position.set(0, 2.5, 0);
  cabeca.add(cabecaPrincipal);
  cabecaPrincipal.geometry.computeBoundingBox();

  // Olhos 
  const olhoL = new THREE.Mesh(
    new THREE.CylinderGeometry(0.5, 0.5, 1, 6),
    new THREE.MeshStandardMaterial({ color: 0x000000 })
  );
  meshes.olhoLMesh = olhoL;
  olhoL.rotation.x = Math.PI / 2;
  olhoL.position.set(-1.2, 4.2, 1.8);
  cabeca.add(olhoL);

  const olhoR = olhoL.clone();
  olhoR.position.x = 1.2;
  cabeca.add(olhoR);
  olhoL.geometry.computeBoundingBox();
  olhoR.geometry.computeBoundingBox();

  // Antenas
  const antenaL = new THREE.Mesh(
    new THREE.CylinderGeometry(0.5, 0.5, 2.5, 6),
    new THREE.MeshStandardMaterial({ color: 0xff0000 })
  );
  meshes.antenaLMesh = antenaL;
  antenaL.position.set(-2.5, 5, 0);
  cabeca.add(antenaL);

  const antenaR = antenaL.clone();
  antenaR.position.x = 2.5;
  cabeca.add(antenaR);

  cabeca.position.set(0, 5, 0);
  robot.add(cabeca);
  robotRefs.cabeca = cabeca;
  antenaL.geometry.computeBoundingBox();
  antenaR.geometry.computeBoundingBox();

  // Braços (esquerdo e direito)
  function createBraco(side = 1) {
    const braco = new THREE.Group();

    // Braço superior
    const superiorBraco = new THREE.Mesh(
      new THREE.BoxGeometry(10, 4, 4),
      new THREE.MeshStandardMaterial({ color: 0x0000ff })
    );
    meshes.superiorBracoMesh = superiorBraco;
    superiorBraco.rotation.z = Math.PI / 2;
    superiorBraco.position.set(12 * side, 0, -4);
    superiorBraco.geometry.computeBoundingBox();
    braco.add(superiorBraco);

    // Tubos de escape
    const escape1 = new THREE.Mesh(
      new THREE.CylinderGeometry(0.75, 0.75, 10, 6),
      new THREE.MeshStandardMaterial({ color: 0xffffff })
    );
    meshes.escape1Mesh = escape1;
    escape1.position.set(14.5 * side, 4, -4.5);
    braco.add(escape1);

    const escape2 = escape1.clone();
    escape2.position.z = -3.5;
    braco.add(escape2);
    meshes.escape2Mesh = escape2;
    escape1.geometry.computeBoundingBox();
    escape2.geometry.computeBoundingBox();

    // Antebraço
    const antebraco = new THREE.Mesh(
      new THREE.BoxGeometry(4, 4, 10),
      new THREE.MeshStandardMaterial({ color: 0x0000ff })
    );
    meshes.antebracoMesh = antebraco;
    antebraco.position.set(12 * side, -7, 3);
    antebraco.geometry.computeBoundingBox();
    braco.add(antebraco);

    return braco;
  }
  const bracoD = createBraco(1);  // Direito
  const bracoE = createBraco(-1); // Esquerdo
  robot.add(bracoD);
  robot.add(bracoE);
  robotRefs.bracos = [bracoD, bracoE];

  // Abdómen
  const abdomen = new THREE.Mesh(
    new THREE.BoxGeometry(12, 4, 12),
    new THREE.MeshStandardMaterial({ color: 0xffffff })
  );
  meshes.abdomenMesh = abdomen;
  abdomen.position.set(0, -7, 0);
  abdomen.geometry.computeBoundingBox();
  robot.add(abdomen);

  // Cintura
  function createCintura() {
    const cintura = new THREE.Group();

    const cinturaBase = new THREE.Mesh(
      new THREE.BoxGeometry(20, 6, 12),
      new THREE.MeshStandardMaterial({ color: 0xff0000 })
    );
    meshes.cinturaBaseMesh = cinturaBase;
    cinturaBase.position.set(0, -12, 0);
    cinturaBase.geometry.computeBoundingBox();
    cintura.add(cinturaBase);
    cinturaBase.geometry.computeBoundingBox();

    // Rodas na cintura (direita e esquerda)
    for (let side of [1, -1]) {
      const wheel = new THREE.Mesh(
        new THREE.CylinderGeometry(2, 2, 2, 16),
        new THREE.MeshStandardMaterial({ color: 0x111111 })
      );
      meshes.wheelMesh = wheel;
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(11 * side, -15, 0); 
      wheel.geometry.computeBoundingBox();
      cintura.add(wheel);
    }
    return cintura;
  }
  const cintura = createCintura();
  robot.add(cintura);

  // Pivots para rodar as pernas
  const pivotD = new THREE.Group();
  const pivotE = new THREE.Group();
  pivotD.position.set(0, -12, 0);
  pivotE.position.set(0, -12, 0);

  // Coxas e pernas
  function createPerna(side = 1) {
    const perna = new THREE.Group();

    // Coxa
    const coxa = new THREE.Mesh(
      new THREE.BoxGeometry(3, 4, 3),
      new THREE.MeshStandardMaterial({ color: 0xffffff })
    );
    meshes.coxaMesh = coxa;
    coxa.position.set(3 * side, -5, 0);
    coxa.geometry.computeBoundingBox();
    perna.add(coxa);

    // Perna
    const lowerPerna = new THREE.Mesh(
      new THREE.BoxGeometry(4, 16, 4),
      new THREE.MeshStandardMaterial({ color: 0x0000ff })
    );
    meshes.lowerPernaMesh = lowerPerna;
    lowerPerna.position.set(3 * side, -15, 0);
    lowerPerna.geometry.computeBoundingBox();
    perna.add(lowerPerna);
    

    // Rodas nas pernas (direita e esquerda)
    for (let side of [1, -1]) {
      const wheel2 = new THREE.Mesh(
        new THREE.CylinderGeometry(2, 2, 2, 16),
        new THREE.MeshStandardMaterial({ color: 0x111111 })
      );
      meshes.wheel2Mesh = wheel2;
      wheel2.rotation.z = Math.PI / 2;
      wheel2.position.set(5.5 * side, -19, 3);
      wheel2.geometry.computeBoundingBox();
      perna.add(wheel2);

      const wheel1 = new THREE.Mesh(
        new THREE.CylinderGeometry(2, 2, 2, 16),
        new THREE.MeshStandardMaterial({ color: 0x111111 })
      );
      meshes.wheel1Mesh = wheel1;
      wheel1.rotation.z = Math.PI / 2;
      wheel1.position.set(5.5 * side, -14, 3);
      wheel1.geometry.computeBoundingBox();
      perna.add(wheel1);
    }

    // Pé 
    const pivotPe = new THREE.Group();
    pivotPe.position.set(0, -23, 2);
    const pe = new THREE.Mesh(
      new THREE.BoxGeometry(4, 2, 4),
      new THREE.MeshStandardMaterial({ color: 0x333333 })
    );
    meshes.peMesh = pe;
    pe.position.set(3 *side, 1, 2);
    pe.geometry.computeBoundingBox();
    pivotPe.add(pe);
    perna.add(pivotPe);
    robotRefs.pes.push(pivotPe);

    return perna;
  }

  const pernaD = createPerna(1);  // Direita
  const pernaE = createPerna(-1); // Esquerda
  pivotD.add(pernaD);
  pivotE.add(pernaE);
  robot.add(pivotD);
  robot.add(pivotE);
  robotRefs.pernas = [pivotD, pivotE];

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
  contentor.geometry.computeBoundingBox();
  reboque.add(contentor);
  meshes.contentorMesh = contentor;

  // Peça de ligação (barra)
  const ligacao = new THREE.Mesh(
    new THREE.BoxGeometry(6, 2, 2),
    new THREE.MeshStandardMaterial({ color: 0x333333 })
  );
  ligacao.position.set(-16, 2, 0);
  ligacao.geometry.computeBoundingBox();
  reboque.add(ligacao);
  meshes.ligacaoMesh = ligacao;

  // Rodas (4)
  const rodaOffsets = [
    [12, -1, 8],   // frente direita
    [12, -1, -8],  // frente esquerda
    [8, -1, 8],  // trás direita
    [8, -1, -8], // trás esquerda
  ];

  let iterator = 0;
  for (let [x, y, z] of rodaOffsets) {
    
    const roda = new THREE.Mesh(
      new THREE.CylinderGeometry(2, 2, 2, 16),
      new THREE.MeshStandardMaterial({ color: 0x111111 })
    );
    roda.rotation.z = Math.PI / 2;
    roda.rotation.y = Math.PI / 2;
    roda.position.set(x, y, z);
    roda.geometry.computeBoundingBox();
    reboque.add(roda);
    meshes.rodaMesh = roda;
    iterator ++;
  }

  // Rodar o reboque para ficar de frente para a camera frontal
  reboque.rotation.y = Math.PI / 2;

  // Posiciona o reboque atrás do camião (ajuste conforme necessário)
  reboque.position.set(0, -14, -40);
  reboqueRefs.reboque = reboque;
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
function update() {
  // θ1: pés 
  for (const pe of robotRefs.pes) {
    pe.rotation.x = state.theta1;
    peBox.copy(meshes.peMesh.geometry.boundingBox).applyMatrix4(meshes.peMesh.matrixWorld);
  }
  if(meshes.ligacaoMesh){
    ligacaoBox.copy(meshes.ligacaoMesh.geometry.boundingBox).applyMatrix4(meshes.ligacaoMesh.matrixWorld);
  }
  // θ2: pernas
  if (robotRefs.pernas) {
    lowerPernaBox.copy(meshes.lowerPernaMesh.geometry.boundingBox).applyMatrix4(meshes.lowerPernaMesh.matrixWorld);
    coxaBox.copy(meshes.coxaMesh.geometry.boundingBox).applyMatrix4(meshes.coxaMesh.matrixWorld);
    robotRefs.pernas[0].rotation.x = state.theta2;
    robotRefs.pernas[1].rotation.x = state.theta2;
  }
  // δ1: braços 
  if (robotRefs.bracos) {
    bracoBox.copy(meshes.superiorBracoMesh.geometry.boundingBox).applyMatrix4(meshes.superiorBracoMesh.matrixWorld);
    escape1Box.copy(meshes.escape1Mesh.geometry.boundingBox).applyMatrix4(meshes.escape1Mesh.matrixWorld);
    escape2Box.copy(meshes.escape2Mesh.geometry.boundingBox).applyMatrix4(meshes.escape2Mesh.matrixWorld);
    robotRefs.bracos[0].position.x = state.delta1;  // direito
    robotRefs.bracos[1].position.x = -state.delta1; // esquerdo
    robotRefs.bracos[0].position.z = state.delta1;  // direito
    robotRefs.bracos[1].position.z = state.delta1; // esquerdo
    
  }
  // θ3: cabeça 
  if (robotRefs.cabeca) {
    cabecaBox.copy(meshes.cabecaBox.geometry.boundingBox).applyMatrix4(meshes.cabecaBox.matrixWorld);
    robotRefs.cabeca.rotation.x = state.theta3;
  }
  // x: Reboque 
  if (reboqueRefs.reboque) {
    ligacaoBox.copy(meshes.ligacaoBox.geometry.boundingBox).applyMatrix4(meshes.ligacaoBox.matrixWorld);
    contentorBox.copy(meshes.contentorBox.geometry.boundingBox).applyMatrix4(meshes.contentorBox.matrixWorld);
    rodaBox.copy(meshes.rodaBox.geometry.boundingBox).applyMatrix4(meshes.rodaBox.matrixWorld);
    reboqueRefs.reboque.position.x = state.x;
  }

  // x: Reboque 
  if (reboqueRefs.reboque) {
    ligacaoBox.copy(meshes.ligacaoBox.geometry.boundingBox).applyMatrix4(meshes.ligacaoBox.matrixWorld);
    contentorBox.copy(meshes.contentorBox.geometry.boundingBox).applyMatrix4(meshes.contentorBox.matrixWorld);
    rodaBox.copy(meshes.rodaBox.geometry.boundingBox).applyMatrix4(meshes.rodaBox.matrixWorld);
    reboqueRefs.reboque.position.y = state.y;
  }
  
}

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
  update();
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
  keysPressed[e.key.toLowerCase()] = true;
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
    case "7":
      // alternar modelo arames e solida
      wireframeMode = !wireframeMode;
      scene.traverse((child) => {
      if (child.isMesh && child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach((mat) => (mat.wireframe = wireframeMode));
        } else {
          child.material.wireframe = wireframeMode;
        }
      }
      });
      break;
    
    // θ1: Q/A
    case "q":
      state.theta1 = Math.min(state.theta1 + speed.theta, limits.theta1.max);
      break;
    case "a":
      state.theta1 = Math.max(state.theta1 - speed.theta, limits.theta1.min);
      break;
    // θ2: W/S
    case "w":
      state.theta2 = Math.min(state.theta2 + speed.theta, limits.theta2.max);
      break;
    case "s":
      state.theta2 = Math.max(state.theta2 - speed.theta, limits.theta2.min);
      break;
    // δ1: E/D
    case "e":
      state.delta1 = Math.min(state.delta1 + speed.delta, limits.delta1.max);
      break;
    case "d":
      state.delta1 = Math.max(state.delta1 - speed.delta, limits.delta1.min);
      break;
    // θ3: R/F
    case "r":
      state.theta3 = Math.min(state.theta3 + speed.theta, limits.theta3.max);
      break;
    case "f":
      state.theta3 = Math.max(state.theta3 - speed.theta, limits.theta3.min);
      break;
    case "ArrowUp":
      reboqueRefs.reboque.position.z -= 0.5;
      break;
    case "ArrowDown":
      reboqueRefs.reboque.position.z += 0.5;
      break;
    case "ArrowLeft":
      reboqueRefs.reboque.position.x -= 0.5;
      break;
    case "ArrowRight":
      reboqueRefs.reboque.position.x += 0.5;
      break;
    default:
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

//To do: 
// ver teclas ao mesmo tempo
// por tudo como bracoL ou bracoE (sem trocar de pt para inglês)

