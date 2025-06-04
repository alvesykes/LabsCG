import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { VRButton } from "three/addons/webxr/VRButton.js";
import * as Stats from "three/addons/libs/stats.module.js";
import { GUI } from "three/addons/libs/lil-gui.module.min.js";

//////////////////////
/* GLOBAL VARIABLES */
//////////////////////
let camera, scene, renderer, plane, textura, directionalLight, ambientLight;
let lightOn = true;
let fixedCamera;
let ovni, spotlight, luzes = [], spotlightOn = true, luzesAtivas = true;
const keysPressed = {};

let meshes ={
    corpoMesh: null,
    cilindroMesh: null,
    cockpitMesh: null,
    esferaMesh: null,
}

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
  camera.position.set(35, 25, 35);
  camera.lookAt(0, 10, 0); 

  // Câmara fixa com vista geral
  fixedCamera = new THREE.PerspectiveCamera(70, aspect, 1, 1000);
  fixedCamera.position.set(80, 60, 80);
  fixedCamera.lookAt(0, 0, 0);

}

/////////////////////
/* CREATE LIGHT(S) */
/////////////////////
function createLight() {
    ambientLight = new THREE.AmbientLight(0xffffff,0.3);
    scene.add(ambientLight);
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
  canvas.width = 1012;
  canvas.height = 1012;
  const ctx = canvas.getContext('2d');

  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  grad.addColorStop(0, '#000022');
  grad.addColorStop(1, '#330033');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let i = 0; i < 700; i++) {
    ctx.beginPath();
    ctx.fillStyle = 'white';
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const r = Math.random() * 0.7 + 0.3;
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
        const numTrees = 75;
        for (let i = 0; i < numTrees; i++) {
            const arvore = createArvore();
            const posX = THREE.MathUtils.randFloatSpread(90); 
            const posZ = THREE.MathUtils.randFloatSpread(90);
            const u = (posX + 50) / 100;
            const v = (posZ + 50) / 100;

            const xPixel = Math.floor(u * image.width);
            const yPixel = Math.floor(v * image.height);
            const index = (yPixel * image.width + xPixel) * 4;
            const heightValue = imgData[index];
            const alturaNormalizada = (heightValue / 255) * 10;

            arvore.position.set(posX, alturaNormalizada, posZ);
            arvore.rotation.y = Math.random() * Math.PI * 2;

            const scale = THREE.MathUtils.randFloat(0.8, 1.4);
            arvore.scale.set(scale, scale, scale);

            if ((posX > 20 || posX < 0) && (posZ > 20 || posZ < 0)){ //Garantir que as árvores são geradas afastadas da casa alentejana
              scene.add(arvore);
            }  
        }
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
        new THREE.MeshStandardMaterial({ color: 0xd3d3d3, metalness: 0.5,
             roughness: 0.5,emissive: 0xffffdd, emissiveIntensity: 0.6 })
      );
    moon.position.set(-10, 35, 20);
    scene.add(moon);
    directionalLight = new THREE.DirectionalLight(0xffffff, 1.2); //Luz da lua
    directionalLight.position.set(-10, 35, 20);
    scene.add(directionalLight);
}

function createArvore() {
  const arvore = new THREE.Group();

  const copaMaterial = new THREE.MeshPhongMaterial({ color: 0x013220 });

  const tronco = new THREE.Mesh(
    new THREE.CylinderGeometry(0.5, 0.7, 4, 16),
    new THREE.MeshStandardMaterial({ color: 0xcc7722})
  );
  tronco.position.y = 2;
  tronco.rotation.z = THREE.MathUtils.degToRad(10);
  arvore.add(tronco);

  const ramo = new THREE.Mesh(
    new THREE.CylinderGeometry(0.2, 0.3, 2.5, 12),
    new THREE.MeshStandardMaterial({ color: 0xcc7722})
  );
  
  ramo.position.set(0.5, 4.5, 0);
  ramo.rotation.z = THREE.MathUtils.degToRad(-30);
  arvore.add(ramo);

  const numElipsoides = THREE.MathUtils.randInt(1, 3);
  for (let i = 0; i < numElipsoides; i++) {
    const escalaX = THREE.MathUtils.randFloat(1.5, 2.5);
    const escalaY = THREE.MathUtils.randFloat(1.0, 2.0);
    const escalaZ = THREE.MathUtils.randFloat(1.5, 2.5);

    const copa = new THREE.Mesh(
      new THREE.SphereGeometry(1, 16, 16),
      copaMaterial
    );
    copa.scale.set(escalaX, escalaY, escalaZ);
    copa.position.set(
      THREE.MathUtils.randFloat(-0.5, 0.5),
      THREE.MathUtils.randFloat(5.5, 6.5),
      THREE.MathUtils.randFloat(-0.5, 0.5)
    );
    arvore.add(copa);
  }

  return arvore;
}


function createAlentejoHouse() {
    const house = new THREE.Group();
    house.position.set(0, 3, 4);

    // Paredes principais (brancas)
    const wallMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff });
    const walls = new THREE.Mesh(
        new THREE.BoxGeometry(18, 4.5, 8),
        wallMaterial
    );
    walls.position.y = 3;
    house.add(walls);

    // Faixa azul em rodapé (base da casa)
    const faixaMaterial = new THREE.MeshLambertMaterial({ color: 0x0074d9 });
    const faixa = new THREE.Mesh(
        new THREE.BoxGeometry(18.05, 0.5, 8.05),
        faixaMaterial
    );
    faixa.position.y = 1; // junto ao chão
    house.add(faixa);

    // Porta (azul)
    const doorMaterial = new THREE.MeshLambertMaterial({ color: 0x0074d9 });
    const door = new THREE.Mesh(
        new THREE.BoxGeometry(1.5, 3.5, 0.2),
        doorMaterial
    );
    door.position.set(-1.75, 2.5, 4);
    house.add(door);

    // Janelas (azul) - duas à frente
    const windowMaterial = new THREE.MeshLambertMaterial({ color: 0x0074d9 });
    const window1 = new THREE.Mesh(
        new THREE.BoxGeometry(2, 2, 0.2),
        windowMaterial
    );

    window1.position.set(-6.5, 3.25, 4);
    house.add(window1);

    const window2 = window1.clone();
    window2.position.set(-4, 3.25, 4);
    house.add(window2);

    const window3 = window1.clone();
    window3.position.set(2, 3.25, 4);
    house.add(window3);

    const window4 = window1.clone();
    window4.position.set(6.5, 3.25, 4);
    house.add(window4);

    const window5 = window1.clone();
    window5.position.set(9, 3.25, 0); 
    window5.rotation.y = -Math.PI / 2; 
    house.add(window5);

    // Telhado com altura de 2 e junto às paredes
    const roofGeometry = new THREE.BufferGeometry();
    const vertices = new Float32Array([
        // Base do telhado (em cima das paredes)
        -9, 7, -4,   // 0: canto esquerdo-trás
         9, 7, -4,   // 1: canto direito-trás
         9, 7,  4,   // 2: canto direito-frente
        -9, 7,  4,   // 3: canto esquerdo-frente
        // Topo esquerdo (meio da lateral esquerda)
        -9, 9, 0,    // 4: topo lateral esquerda (altura 7+2=9)
        // Topo direito (meio da lateral direita)
         9, 9, 0     // 5: topo lateral direita (altura 7+2=9)
    ]);
    // Faces: duas laterais triangulares, frente e trás retangulares
    const indices = [
        // Lateral esquerda (triângulo)
        0, 3, 4,
        // Lateral direita (triângulo)
        1, 2, 5,
        // Frente (retângulo)
        3, 2, 5,
        3, 5, 4,
        // Trás (retângulo)
        0, 1, 5,
        0, 5, 4,
        // Fundo do telhado (base inferior, para garantir que as laterais fiquem visíveis)
        0, 1, 2,
        0, 2, 3
    ];
    roofGeometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    roofGeometry.setIndex(indices);
    roofGeometry.computeVertexNormals();

    const roofMaterial = new THREE.MeshLambertMaterial({ color: 0xff6600, side: THREE.DoubleSide });
    const roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.y = -1.75; 
    house.add(roof);


    const chimney = new THREE.Mesh(
        new THREE.BoxGeometry(2.5, 2.5, 1),
        new THREE.MeshLambertMaterial({ color: 0xffffff })
    );

    const chimneyLeft = chimney.clone();
    chimneyLeft.position.set(-4.25, 6.5, -3.5);
    house.add(chimneyLeft);

    const chimneyRight = chimney.clone();
    chimneyRight.position.set(4.25, 6.5, 3.5);
    house.add(chimneyRight);

    const pilares = new THREE.Group();
    const pilarRectangle = new THREE.Mesh(
        new THREE.BoxGeometry(1, 4, 0.5),
        new THREE.MeshLambertMaterial({ color: 0xffffff }) 
    );

    const pilarRectangle1 = pilarRectangle.clone();
    pilarRectangle1.position.set(8.5, 2.75, 4.25);
    const pilarRectangle2 = pilarRectangle.clone();
    pilarRectangle2.position.set(-8.5, 2.75, 4.25);
    const pilarRectangle3 = pilarRectangle.clone();
    pilarRectangle3.position.set(0, 2.75, 4.25);
    const pilarRectangle4 = pilarRectangle.clone();
    pilarRectangle4.position.set(0, 2.75, -4.25);
    const pilarRectangle5 = pilarRectangle.clone();
    pilarRectangle5.position.set(8.5, 2.75, -4.25);
    const pilarRectangle6 = pilarRectangle.clone();
    pilarRectangle6.position.set(-8.5, 2.75, -4.25);

    pilares.add(pilarRectangle1);
    pilares.add(pilarRectangle2);
    pilares.add(pilarRectangle3);
    pilares.add(pilarRectangle4);
    pilares.add(pilarRectangle5);
    pilares.add(pilarRectangle6);

    const pilarRamp = new THREE.Mesh(
        new THREE.BoxGeometry(1, 5, 5),
        new THREE.MeshLambertMaterial({ color: 0xffffff })
    );

    const pilarRamp1 = pilarRamp.clone();
    pilarRamp1.position.set(8.5, 1.5, 3);
    pilarRamp1.rotation.x = - Math.PI / 10; 
    const pilarRamp2 = pilarRamp.clone();
    pilarRamp2.position.set(-8.5, 1.5, 3);
    pilarRamp2.rotation.x = - Math.PI / 10;
    const pilarRamp3 = pilarRamp.clone();
    pilarRamp3.position.set(0, 1.5, 3);
    pilarRamp3.rotation.x = - Math.PI / 10;
    const pilarRamp4 = pilarRamp.clone();
    pilarRamp4.position.set(0, 1.5, -3);
    pilarRamp4.rotation.x = Math.PI / 10;
    const pilarRamp5 = pilarRamp.clone();
    pilarRamp5.position.set(8.5, 1.5, -3);
    pilarRamp5.rotation.x = Math.PI / 10;
    const pilarRamp6 = pilarRamp.clone();
    pilarRamp6.position.set(-8.5, 1.5, -3);
    pilarRamp6.rotation.x = Math.PI / 10;
    pilares.add(pilarRamp1);
    pilares.add(pilarRamp2);
    pilares.add(pilarRamp3);
    pilares.add(pilarRamp4);
    pilares.add(pilarRamp5);
    pilares.add(pilarRamp6);
    house.add(pilares);

    scene.add(house);
}

function createOvni(){
    ovni = new THREE.Group();

    const corpoGeometry = new THREE.SphereGeometry(3, 32, 32);
    corpoGeometry.scale(1, 0.4, 1);
    const corpoMaterial = new THREE.MeshStandardMaterial({ color: 0x88ffaa});
    const corpoMesh = new THREE.Mesh(corpoGeometry, corpoMaterial);
    meshes.corpoMesh = corpoMesh;
    ovni.add(corpoMesh);

    const cockpitGeometry = new THREE.SphereGeometry(1.5, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2);
    const cockpitMaterial = new THREE.MeshStandardMaterial({ color: 0x44ffff, transparent: true, opacity: 0.6 });
    const cockpitMesh = new THREE.Mesh(cockpitGeometry, cockpitMaterial);
    cockpitMesh.position.y = 1;
    meshes.cockpitMesh = cockpitMesh;
    ovni.add(cockpitMesh);

    const cilindroMesh = new THREE.MeshStandardMaterial({ color: 0x444444 });
    const cilindro = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 0.2, 32), cilindroMesh);
    cilindro.position.y = -1.2;
    meshes.cilindroMesh = cilindroMesh;
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

        const esferaMesh = new THREE.MeshStandardMaterial({ color: 0xffffaa });
        const esfera = new THREE.Mesh(
        new THREE.SphereGeometry(0.2, 16, 16), esferaMesh);
        esfera.position.set(x, -0.7, z);
        meshes.esferaMesh = esferaMesh;
        ovni.add(esfera);


        const luz = new THREE.PointLight(0xffffaa, 10, 5);
        const lx = Math.cos(angle) * (2.8);
        const lz = Math.sin(angle) * (2.8);
        luz.position.set(lx, -0.8, lz);
        ovni.add(luz);
        luzes.push(luz);
    }
    
    ovni.position.y = 20;
    ovni.position.x = 20;
    meshes.corpoMesh = corpoMesh;
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
    renderer.render(scene, camera);
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

  renderer.setAnimationLoop(animate);
}

/////////////////////
/* ANIMATION CYCLE */
/////////////////////
function animate() {
    update();
    render();
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
        case 'q':
            meshes.cockpitMesh.material = new THREE.MeshLambertMaterial({ color: 0x44ffff, transparent: true, opacity: 0.6 });
            meshes.cilindroMesh.material = new THREE.MeshLambertMaterial({ color: 0x444444 });
            meshes.esferaMesh.material = new THREE.MeshLambertMaterial({ color: 0xffffaa });
            meshes.corpoMesh.material = new THREE.MeshLambertMaterial({ color: 0x88ffaa});
            break;
        case 'w':
            meshes.cockpitMesh.material = new THREE.MeshPhongMaterial({ color: 0x44ffff, transparent: true, opacity: 0.6 });
            meshes.cilindroMesh.material = new THREE.MeshPhongMaterial({ color: 0x444444 });
            meshes.esferaMesh.material = new THREE.MeshPhongMaterial({ color: 0xffffaa });
            meshes.corpoMesh.material = new THREE.MeshPhongMaterial({ color: 0x88ffaa});
            break;
        case 'e':
            meshes.cockpitMesh.material = new THREE.MeshToonMaterial({ color: 0x44ffff, transparent: true, opacity: 0.6 });
            meshes.cilindroMesh.material = new THREE.MeshToonMaterial({ color: 0x444444 });
            meshes.esferaMesh.material = new THREE.MeshToonMaterial({ color: 0xffffaa });
            meshes.corpoMesh.material = new THREE.MeshToonMaterial({ color: 0x88ffaa});
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