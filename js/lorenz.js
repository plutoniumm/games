const [ iw, ih ] = [ window.innerWidth, window.innerHeight ];
const canvas = document.getElementById( 'canvas' );
const form = {
  sigma: document.getElementById( 'sigma' ),
  rho: document.getElementById( 'rho' ),
  beta: document.getElementById( 'beta' )
};

let scene, camera, renderer, lorenz, controls, lorenzBead, axesHelper;

let //
  soln = [],
  idx = 0,
  batch = 10;

function createLorenzAttractor ( sigma, rho, beta ) {
  let x = 1, y = 1, z = 1;
  const steps = 5000
  const points = [];
  const dt = 0.005;

  for ( let i = 0;i < steps;i++ ) {
    const dx = sigma * ( y - x ) * dt;
    const dy = ( x * ( rho - z ) - y ) * dt;
    const dz = ( x * y - beta * z ) * dt;

    x += dx; y += dy; z += dz;
    points.push( new THREE.Vector3( x, y, z ) );
  };
  return points;
}

function getLorenz ( sigma, rho, beta ) {
  soln = createLorenzAttractor( sigma, rho, beta );

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute( 'position', new THREE.BufferAttribute(
    new Float32Array( soln.length * 3 ), 3
  ) );

  const material = new THREE.LineBasicMaterial( { color: 0x40E0D0 } );

  return new THREE.Line( geometry, material );
};

function init () {
  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera( 75, iw / ih, 0.1, 1000 );
  renderer = new THREE.WebGLRenderer( { canvas } );
  renderer.setSize( iw, ih );

  camera.position.set( 90, 30, -60 );
  controls = new THREE.OrbitControls( camera, renderer.domElement );

  lorenz = getLorenz( 10, 28, 2.667 );
  scene.add( lorenz );

  const beadGeometry = new THREE.SphereGeometry( 0.5, 32, 32 ); // Sphere with small radius
  const beadMaterial = new THREE.MeshStandardMaterial( {
    color: 0xffffff,
    emissive: 0xffffff
  } );
  lorenzBead = new THREE.Mesh( beadGeometry, beadMaterial );
  scene.add( lorenzBead );

  // axesHelper = new THREE.AxesHelper( 30 );
  // scene.add( axesHelper );

  animate();
};

function animate () {
  requestAnimationFrame( animate );

  const pos = lorenz.geometry.attributes.position.array;
  const tot = soln.length;

  for ( let i = 0;i < batch && idx < tot;i++, idx++ ) {
    const p = soln[ idx ];
    pos[ idx * 3 ] = p.y;
    pos[ idx * 3 + 1 ] = p.z;
    pos[ idx * 3 + 2 ] = p.x;
  }

  if ( idx < soln.length ) {
    const beadPos = soln[ idx ];
    lorenzBead.position.set( beadPos.y, beadPos.z, beadPos.x );
  }
  lorenz.geometry.attributes.position.needsUpdate = true;

  controls.update();
  renderer.render( scene, camera );
};


document.getElementById( 'lorenzForm' ).addEventListener( 'submit', ( event ) => {
  event.preventDefault();
  scene.remove( lorenz );
  idx = 0;

  lorenz = getLorenz(
    parseFloat( form.sigma.value ),
    parseFloat( form.rho.value ),
    parseFloat( form.beta.value )
  );
  scene.add( lorenz );
} );

init();