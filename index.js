import * as THREE from 'https://threejsfundamentals.org/threejs/resources/threejs/r127/build/three.module.js';

const canvas = document.querySelector('#c');
const renderer = new THREE.WebGLRenderer({canvas: canvas});
let currCamera = 0;
renderer.setClearColor(0xAAAAAA);
renderer.shadowMap.enabled = true;

function makeCamera(fov = 40) {
  const aspect = 2;  // the canvas default
  const zNear = 0.1;
  const zFar = 1000;
  return new THREE.PerspectiveCamera(fov, aspect, zNear, zFar);
}
const camera = makeCamera();
camera.position.set(8, 4, 10).multiplyScalar(3);
camera.lookAt(0, 0, 0);

const scene = new THREE.Scene();

{
  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(0, 20, 0);
  scene.add(light);
  light.castShadow = true;
  light.shadow.mapSize.width = 2048;
  light.shadow.mapSize.height = 2048;

  const d = 50;
  light.shadow.camera.left = -d;
  light.shadow.camera.right = d;
  light.shadow.camera.top = d;
  light.shadow.camera.bottom = -d;
  light.shadow.camera.near = 1;
  light.shadow.camera.far = 50;
  light.shadow.bias = 0.001;
}

{
  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(1, 2, 4);
  scene.add(light);
}

const groundGeometry = new THREE.PlaneGeometry(50, 50);
const groundMaterial = new THREE.MeshPhongMaterial({color: 0xCC8866});
const groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
groundMesh.rotation.x = Math.PI * -.5;
groundMesh.receiveShadow = true;
scene.add(groundMesh);


let isAvatarAttached = false;
let isAvatarMoving = false;

const jumpStartForce = 3;
const gravity = 0.05;
let isAvatarJumping = false;
let jumpStartHeight = 0;
let currJumpForce = 0;

const avatar = new THREE.Object3D();
avatar.name = 'avatar';
avatar.userData.bb = new THREE.Box3(new THREE.Vector3(-0.8,0,-0.8), new THREE.Vector3(0.8,4,0.8));
scene.add(avatar);

const avatarGeometry = new THREE.CylinderGeometry(0.3, 0.5, 4, 10);
const avatarMaterial = new THREE.MeshPhongMaterial({color: 0xFF00DD});
const avatarMesh = new THREE.Mesh(avatarGeometry, avatarMaterial);
avatarMesh.position.y = 2;
avatarMesh.castShadow = true;
avatar.add(avatarMesh);

const avatarHeadGeometry = new THREE.CylinderGeometry(0.01, 0.5, 1, 6);
const avatarHeadMaterial = new THREE.MeshPhongMaterial({color: 0xFFDD00});
const avatarHeadMesh = new THREE.Mesh(avatarHeadGeometry, avatarHeadMaterial);
avatarHeadMesh.rotation.x = Math.PI * 0.5;
avatarHeadMesh.position.y = 2;
avatarHeadMesh.position.z = 0.2;
avatarHeadMesh.castShadow = true;
avatarMesh.add(avatarHeadMesh);

const avatarFov = 90;
const avatarCamera = makeCamera(avatarFov);
avatarCamera.position.y = 4;
avatarCamera.rotation.y = Math.PI;
avatar.add(avatarCamera);


const carWidth = 4;
const carHeight = 4;
const carLength = 8;

const coach = new THREE.Object3D();
coach.userData.hasBB = true;
// scene.add(coach);

const bodyGeometry = new THREE.BoxGeometry(carWidth, carHeight, carLength);
const bodyMaterial = new THREE.MeshPhongMaterial({color: 0x6688AA});
const bodyMesh = new THREE.Mesh(bodyGeometry, bodyMaterial);
bodyMesh.name = 'cb';
bodyMesh.position.y = 3;
bodyMesh.castShadow = true;
bodyMesh.geometry.computeBoundingBox();
coach.add(bodyMesh);

const trainCameraFov = 75;
const trainCamera = makeCamera(trainCameraFov);
trainCamera.position.y = 3;
trainCamera.position.z = -6;
trainCamera.rotation.y = Math.PI;
bodyMesh.add(trainCamera);

const wheelRadius = 1;
const wheelThickness = .5;
const wheelSegments = 6;
const wheelGeometry = new THREE.CylinderGeometry(
    wheelRadius,     // top radius
    wheelRadius,     // bottom radius
    wheelThickness,  // height of cylinder
    wheelSegments);
const wheelMaterial = new THREE.MeshPhongMaterial({color: 0x888888});
const wheelPositions = [
  [-carWidth / 2 - wheelThickness / 2, -carHeight / 2,  carLength / 3],
  [ carWidth / 2 + wheelThickness / 2, -carHeight / 2,  carLength / 3],
  [-carWidth / 2 - wheelThickness / 2, -carHeight / 2, 0],
  [ carWidth / 2 + wheelThickness / 2, -carHeight / 2, 0],
  [-carWidth / 2 - wheelThickness / 2, -carHeight / 2, -carLength / 3],
  [ carWidth / 2 + wheelThickness / 2, -carHeight / 2, -carLength / 3],
];
const wheelMeshes = wheelPositions.map((position, index) => {
  const mesh = new THREE.Mesh(wheelGeometry, wheelMaterial);
  mesh.position.set(...position);
  mesh.rotation.z = Math.PI * .5;
  mesh.castShadow = true;
  mesh.name = 'w'+index;
  bodyMesh.add(mesh);
  return mesh;
});

const engine = coach.clone(true);
engine.name = 'eng';
const domeGeometry = new THREE.SphereGeometry(2, 10, 10, 0, Math.PI*2, 0, Math.PI * 0.5);
const domeMesh = new THREE.Mesh(domeGeometry, bodyMaterial);
domeMesh.castShadow = true;
console.log(engine);
engine.getObjectById(32).add(domeMesh);
domeMesh.position.y = 2;
domeMesh.position.z = -2;

scene.add(engine);

let coaches = [];
let prevId = engine.id;
const noOfCoaches = 3;
for (let i = 0; i < noOfCoaches; i++) {
  const c = coach.clone(true);
  c.position.z += (i+1) * carLength * 1.2;
  c.name = 'c'+i;
  c.userData.followId = prevId;
  prevId = c.id;
  scene.add(c);
  coaches.push(c);
}

// const turretWidth = .1;
// const turretHeight = .1;
// const turretLength = carLength * .75 * .2;
// const turretGeometry = new THREE.BoxGeometry(
//     turretWidth, turretHeight, turretLength);
// const turretMesh = new THREE.Mesh(turretGeometry, bodyMaterial);
// const turretPivot = new THREE.Object3D();
// turretMesh.castShadow = true;
// turretPivot.scale.set(5, 5, 5);
// turretPivot.position.y = .5;
// turretMesh.position.z = turretLength * .5;
// turretPivot.add(turretMesh);
// bodyMesh.add(turretPivot);

// const turretCamera = makeCamera();
// turretCamera.position.y = .75 * .2;
// turretMesh.add(turretCamera);

// const targetGeometry = new THREE.SphereGeometry(.5, 6, 3);
// const targetMaterial = new THREE.MeshPhongMaterial({color: 0x00FF00, flatShading: true});
// const targetMesh = new THREE.Mesh(targetGeometry, targetMaterial);
// const targetOrbit = new THREE.Object3D();
// const targetElevation = new THREE.Object3D();
// const targetBob = new THREE.Object3D();
// targetMesh.castShadow = true;
// scene.add(targetOrbit);
// targetOrbit.add(targetElevation);
// targetElevation.position.z = carLength * 2;
// targetElevation.position.y = 8;
// targetElevation.add(targetBob);
// targetBob.add(targetMesh);

// const targetCamera = makeCamera();
// const targetCameraPivot = new THREE.Object3D();
// targetCamera.position.y = 1;
// targetCamera.position.z = -2;
// targetCamera.rotation.y = Math.PI;
// targetBob.add(targetCameraPivot);
// targetCameraPivot.add(targetCamera);

// Create a sine-like wave
const splinePointsArr = [
  new THREE.Vector2( -20, -20 ),
  new THREE.Vector2( 20, 20 ),
  new THREE.Vector2( 20, -20 ),
  new THREE.Vector2( -20, 20 ),
  new THREE.Vector2( -20, -20 ),
  // new THREE.Vector2( 15, 10 ),
  // new THREE.Vector2( 2, 15 ),
  // new THREE.Vector2( -10, 0 ),
  // new THREE.Vector2( -10, -20 ),
  // new THREE.Vector2( -20, -10 ),
  // new THREE.Vector2( -20, 0 ),
  // new THREE.Vector2( -10, 5 ),
];
// const splinePoints = 10;
// let splinePointsArr = [];
// for(let i=0; i<splinePoints; i++){
//   splinePointsArr.push(new THREE.Vector2( Math.floor(Math.random()*100 - 50),
//               Math.floor(Math.random()*20 - 10)));
// }

const curve = new THREE.SplineCurve( splinePointsArr );

const points = curve.getPoints( 50 );
const geometry = new THREE.BufferGeometry().setFromPoints( points );
const material = new THREE.LineBasicMaterial( { color : 0xff0000 } );
const splineObject = new THREE.Line( geometry, material );
splineObject.rotation.x = Math.PI * .5;
splineObject.position.y = 0.05;
scene.add(splineObject);

function resizeRendererToDisplaySize(renderer) {
  const canvas = renderer.domElement;
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const needResize = canvas.width !== width || canvas.height !== height;
  if (needResize) {
    renderer.setSize(width, height, false);
  }
  return needResize;
}

// const targetPosition = new THREE.Vector3();
const trainPosition = new THREE.Vector2();
const trainTarget = new THREE.Vector2();

const cameras = [
  { cam: camera, desc: 'Fixed camera', },
  { cam: avatarCamera, desc: 'Avatar POV'},
//   { cam: turretCamera, desc: 'on turret looking at target', },
//   { cam: targetCamera, desc: 'near target looking at train', },
  { cam: trainCamera, desc: 'above back of train', },
];

const infoElem = document.querySelector('#info');

function render(time) {
  time *= 0.001;

  if (resizeRendererToDisplaySize(renderer)) {
    const canvas = renderer.domElement;
    cameras.forEach((cameraInfo) => {
      const camera = cameraInfo.cam;
      camera.aspect = canvas.clientWidth / canvas.clientHeight;
      camera.updateProjectionMatrix();
    });
  }

//   // move target
//   targetOrbit.rotation.y = time * .27;
//   targetBob.position.y = Math.sin(time * 2) * 4;
//   targetMesh.rotation.x = time * 7;
//   targetMesh.rotation.y = time * 13;
//   targetMaterial.emissive.setHSL(time * 10 % 1, 1, .25);
//   targetMaterial.color.setHSL(time * 10 % 1, 1, .25);

  // move train
  const trainTime = time * .05;
  curve.getPointAt(trainTime % 1, trainPosition);
  curve.getPointAt((trainTime + 0.01) % 1, trainTarget);
  engine.position.set(trainPosition.x, 0, trainPosition.y);
  engine.lookAt(trainTarget.x, 0, trainTarget.y);

//   // face turret at target
//   targetMesh.getWorldPosition(targetPosition);
//   turretPivot.lookAt(targetPosition);

//   // make the turretCamera look at target
//   turretCamera.lookAt(targetPosition);

  // make the targetCameraPivot look at the at the train
//   train.getWorldPosition(targetPosition);
//   targetCameraPivot.lookAt(targetPosition);

  let flag = true;
  let avatarBB = avatar.userData.bb.clone();
  avatarBB.applyMatrix4(avatar.matrixWorld);
  if(isAvatarMoving && !isAvatarAttached 
    && flag && avatarBB.intersectsBox(new THREE.Box3().copy( engine.getObjectByName('cb').geometry.boundingBox ).applyMatrix4( engine.matrixWorld ))) {
      flag = false;
    }
  

  for (let i = 0; i < 6; i++) {
    engine.getObjectByName('w'+i).rotation.x = time*3;
  }
  let folPos = new THREE.Vector3();
  folPos.copy(engine.position);
  coaches.forEach((c)=>{
    // const folObj = scene.getObjectById(c.userData.followId);

    // let dir = new THREE.Vector3();
    // dir.subVectors(folObj.position, c.position);
    // dir.normalize();
    // let dist = c.position.distanceTo(folObj.position);
    let prevPos = new THREE.Vector3();
    prevPos.copy(c.position);
    let dist = c.position.distanceTo(folPos);
    if(dist > 1.2 * carLength)
      c.position.lerp(folPos, (dist - 1.2 * carLength)/(dist));

    // c.position.addScaledVector(dir, 0.2);
    c.lookAt(folPos);
    folPos.copy(prevPos);


    for (let i = 0; i < 6; i++) {
      c.getObjectByName('w'+i).rotation.x = time*3 + i;
    }

    let coachBody = c.getObjectByName('cb');

    if(isAvatarMoving && !isAvatarAttached 
      && flag && avatarBB.intersectsBox(new THREE.Box3().copy( coachBody.geometry.boundingBox ).applyMatrix4( coachBody.matrixWorld ))) {
        flag = false;
      }
  
  });
  // wheelMeshes.forEach((obj) => {
  //   obj.rotation.x = time * 3;
  // });

  // const camera = cameras[time * .25 % cameras.length | 0];
  const camera = cameras[currCamera];
  infoElem.textContent = camera.desc;

  if(isAvatarMoving && !isAvatarAttached && flag)
    avatar.translateZ(0.1);
  else
    isAvatarMoving = false;

  if(isAvatarJumping){
    avatar.position.y += currJumpForce * 0.4;
    currJumpForce = currJumpForce - gravity * (avatar.position.y - jumpStartHeight);
    if(avatar.position.y < jumpStartHeight){
      avatar.position.y = jumpStartHeight;
      isAvatarJumping = false;
    }
  }


  renderer.render(scene, camera.cam);

  requestAnimationFrame(render);
}

window.addEventListener('keydown', function (event){
  switch(event.key){
    case 'w':
      if(!isAvatarAttached)
        isAvatarMoving = true;
      break;
    case 's':
      if(!isAvatarAttached)
        isAvatarMoving = false;
      break;
    case 'a':
      avatar.rotation.y += 0.05;
      break;
    case 'd':
      avatar.rotation.y += -0.05;
      break;
    case 'c':
      currCamera = 1- currCamera;
      break;
    case 'f':
      if(!isAvatarAttached){
        avatar.position.set(0,2,2);
        engine.add(avatar);
      }else{
        engine.remove(avatar);
        avatar.position.copy(engine.position);
        scene.add(avatar);
      }
      isAvatarAttached = !isAvatarAttached;
      break;
    case ' ':
      if(!isAvatarJumping){
        isAvatarJumping = true;
        jumpStartHeight = avatar.position.y;
        currJumpForce = jumpStartForce;
      }
  }
}, true);

requestAnimationFrame(render);
