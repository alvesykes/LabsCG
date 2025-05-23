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
let camiao = false;

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
  theta: 0.01,
  delta: 0.02,
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
  robot: null,
};

let reboqueRefs = {
  reboque: null,
}

const keysPressed = {};


const boxes = {
  reboqueBox: new THREE.Box3(),
  troncoBox: new THREE.Box3(),
  cabecaBox: new THREE.Box3(),
  olhoBox: new THREE.Box3(),
  antenaBox: new THREE.Box3(),
  bracoBox: new THREE.Box3(),
  escape1Box: new THREE.Box3(),
  escape2Box: new THREE.Box3(),
  abdomenBox: new THREE.Box3(),
  cinturaBaseBox: new THREE.Box3(),
  lowerPernaBox: new THREE.Box3(),
  coxaBox: new THREE.Box3(),
  wheelBox: new THREE.Box3(),
  peBox: new THREE.Box3(),
  ligacaoBox: new THREE.Box3(),
  rodaBox: new THREE.Box3(),
  contentorBox: new THREE.Box3(),
};

const allowedCollisions = [
  ["cabecaBox", "troncoBox"],
  ["cabecaBox", "olhoBox"],
  ["antenaBox", "cabecaBox"],
  ["coxaBox", "lowerPernaBox"],
  ["contentorBox", "ligacaoBox"],
  ["contentorBox", "rodaBox"],
  ["bracoBox", "escape1Box"],
  ["bracoBox", "escape2Box"],
  ["escape1Box", "escape2Box"],
  ["lowerPernaBox", "peBox"],
  ["abdomenBox", "troncoBox"]
];

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


  // Coxas e pernas
  function createPerna(side = 1) {
    const perna = new THREE.Group();
    perna.position.set(0, -12, 0);

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
  robot.add(pernaD);
  robot.add(pernaE);
  robotRefs.pernas = [pernaD, pernaE];

  robot.position.y = 0;
  robotRefs.robot = robot;
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
function checkCollisions() {
  let collisionDetected = false;
  if (boxes.peBox.intersectsBox(boxes.ligacaoBox)) {
    console.log("Collision detected between foot and trailer linkage!");
    handleTruckCollision();
    collisionDetected = true;
  }
  for (const [nameA, boxA] of Object.entries(boxes)) {
    for (const [nameB, boxB] of Object.entries(boxes)) {
      if (nameA === nameB) continue;

      // Verifica se colisão é permitida
      const pair = [nameA, nameB].sort(); // ordem alfabética
      const isAllowed = allowedCollisions.some(
        ([a, b]) => [a, b].sort().toString() === pair.toString()
      );
      if (isAllowed) continue;

      if (boxA.intersectsBox(boxB)) {
        console.warn(`Colisão detectada entre ${nameA} e ${nameB}`);
        collisionDetected = true;
      }
    }
  }
  return collisionDetected;
}


////////////////////////////////
/* Special collision where trailer fuses with the robot foot*/
////////////////////////////////
let counter =0;
function handleTruckCollision(){
  if (counter > 0){
  camiao = true;
  }
  counter ++;
  const peCenter = new THREE.Vector3();
  const ligacaoCenter = new THREE.Vector3();
  boxes.peBox.getCenter(peCenter);
  boxes.ligacaoBox.getCenter(ligacaoCenter);
  const offset = new THREE.Vector3().subVectors(peCenter, ligacaoCenter);
  reboqueRefs.reboque.position.add(offset);
}

////////////
/* UPDATE BOUNDING BOXES */
////////////
function updateBoundingBoxes() {
  reboqueRefs.reboque.updateMatrixWorld(true);
  meshes.ligacaoMesh.updateMatrixWorld(true);
  meshes.contentorMesh.updateMatrixWorld(true);
  meshes.rodaMesh.updateMatrixWorld(true);

  boxes.ligacaoBox.copy(meshes.ligacaoMesh.geometry.boundingBox).applyMatrix4(meshes.ligacaoMesh.matrixWorld);
  boxes.contentorBox.copy(meshes.contentorMesh.geometry.boundingBox).applyMatrix4(meshes.contentorMesh.matrixWorld);
  boxes.rodaBox.copy(meshes.rodaMesh.geometry.boundingBox).applyMatrix4(meshes.rodaMesh.matrixWorld);
}

////////////
/* UPDATE */
////////////
function update() {
  // Atualizar graus de liberdade com base nas teclas pressionadas
  if (!camiao) {
    // θ1: pés
    if (keysPressed["q"]) {
      state.theta1 = Math.min(state.theta1 + speed.theta, limits.theta1.max);
    }
    if (keysPressed["a"]) {
      state.theta1 = Math.max(state.theta1 - speed.theta, limits.theta1.min);
    }
    // θ2: pernas
    if (keysPressed["w"]) {
      state.theta2 = Math.min(state.theta2 + speed.theta, limits.theta2.max);
    }
    if (keysPressed["s"]) {
      state.theta2 = Math.max(state.theta2 - speed.theta, limits.theta2.min);
    }
  }
  // δ1: braços
  if (keysPressed["e"]) {
    state.delta1 = Math.min(state.delta1 + speed.delta, limits.delta1.max);
  }
  if (keysPressed["d"]) {
    state.delta1 = Math.max(state.delta1 - speed.delta, limits.delta1.min);
  }
  // θ3: cabeça
  if (keysPressed["r"]) {
    state.theta3 = Math.min(state.theta3 + speed.theta, limits.theta3.max);
  }
  if (keysPressed["f"]) {
    state.theta3 = Math.max(state.theta3 - speed.theta, limits.theta3.min);
  }

  // θ1: pés 
  for (const pe of robotRefs.pes) {
    pe.rotation.x = state.theta1;
    boxes.peBox.copy(meshes.peMesh.geometry.boundingBox).applyMatrix4(meshes.peMesh.matrixWorld);
  }
  if(meshes.ligacaoMesh){
    boxes.ligacaoBox.copy(meshes.ligacaoMesh.geometry.boundingBox).applyMatrix4(meshes.ligacaoMesh.matrixWorld);
  }
  // θ2: pernas
  if (robotRefs.pernas) {
    boxes.lowerPernaBox.copy(meshes.lowerPernaMesh.geometry.boundingBox).applyMatrix4(meshes.lowerPernaMesh.matrixWorld);
    boxes.coxaBox.copy(meshes.coxaMesh.geometry.boundingBox).applyMatrix4(meshes.coxaMesh.matrixWorld);
    robotRefs.pernas[0].rotation.x = state.theta2;
    robotRefs.pernas[1].rotation.x = state.theta2;
  }
  // δ1: braços 
  if (robotRefs.bracos) {
    boxes.bracoBox.copy(meshes.superiorBracoMesh.geometry.boundingBox).applyMatrix4(meshes.superiorBracoMesh.matrixWorld);
    boxes.escape1Box.copy(meshes.escape1Mesh.geometry.boundingBox).applyMatrix4(meshes.escape1Mesh.matrixWorld);
    boxes.escape2Box.copy(meshes.escape2Mesh.geometry.boundingBox).applyMatrix4(meshes.escape2Mesh.matrixWorld);
    robotRefs.bracos[0].position.x = state.delta1;  // direito
    robotRefs.bracos[1].position.x = -state.delta1; // esquerdo
    robotRefs.bracos[0].position.z = state.delta1;  // direito
    robotRefs.bracos[1].position.z = state.delta1; // esquerdo
    
  }
  // θ3: cabeça 
  if (robotRefs.cabeca) {
    boxes.cabecaBox.copy(meshes.cabecaPrincipalMesh.geometry.boundingBox).applyMatrix4(meshes.cabecaPrincipalMesh.matrixWorld);
    robotRefs.cabeca.rotation.x = state.theta3;
  }

  //Combinações de arrows
  let moveX = 0;
  let moveZ = 0;
  if (keysPressed["arrowup"]) moveZ -= 0.2;
  if (keysPressed["arrowdown"]) moveZ += 0.2;
  if (keysPressed["arrowleft"]) moveX -= 0.2;
  if (keysPressed["arrowright"]) moveX += 0.2;

  if (moveX !== 0 || moveZ !== 0) {
    if (!camiao) {
      reboqueRefs.reboque.position.x += moveX;
      reboqueRefs.reboque.position.z += moveZ;
      updateBoundingBoxes();
      checkCollisions();
    } else {
      reboqueRefs.reboque.position.x += moveX;
      reboqueRefs.reboque.position.z += moveZ;
      robotRefs.robot.position.x += moveX;
      robotRefs.robot.position.z += moveZ;
    }
  }

  updateBoundingBoxes();

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
  console.log(keysPressed);
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



