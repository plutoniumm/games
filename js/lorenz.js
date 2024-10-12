const [ iw, ih ] = [ window.innerWidth, window.innerHeight ];
const canvas = document.getElementById( 'canvas' );
const form = {
  sigma: document.getElementById( 'sigma' ),
  rho: document.getElementById( 'rho' ),
  beta: document.getElementById( 'beta' )
}

let scene, camera, renderer, lorenz, controls, lorenzBead, axesHelper;

let //
  soln = [],
  idx = 0,
  batch = 10;

function createLorenzAttractor ( sigma, rho, beta ) {
  const steps = 5000
  const points = [];
  let x = 1, y = 1, z = 1;
  const dt = 0.005; // Reduced dt for smoother curves

  for ( let i = 0;i < steps;i++ ) {
    // DONT MERGE THIS INTO A SINGLE LINE
    // IT WILL UPDATE X BEFORE IT IS USED IN THE NEXT LINE
    const dx = sigma * ( y - x ) * dt;
    const dy = ( x * ( rho - z ) - y ) * dt;
    const dz = ( x * y - beta * z ) * dt;

    x += dx;
    y += dy;
    z += dz;
    points.push( new THREE.Vector3( x, y, z ) );
  }
  return points;
}

function init () {
  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera( 75, iw / ih, 0.1, 1000 );
  renderer = new THREE.WebGLRenderer( { canvas } );
  renderer.setSize( iw, ih );

  camera.position.set( 90, 30, -60 );
  controls = new THREE.OrbitControls( camera, renderer.domElement );

  soln = createLorenzAttractor( 10, 28, 2.667, 8000 );

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute( 'position', new THREE.BufferAttribute( new Float32Array( soln.length * 3 ), 3 ) );

  const colors = new Float32Array( soln.length * 3 );
  const color = new THREE.Color( 0x40E0D0 ); // Turquoise blue

  for ( let i = 0;i < soln.length;i++ ) {
    colors[ i * 3 ] = color.r;
    colors[ i * 3 + 1 ] = color.g;
    colors[ i * 3 + 2 ] = color.b;
  }

  geometry.setAttribute( 'color', new THREE.BufferAttribute( colors, 3 ) );
  const material = new THREE.LineBasicMaterial( { vertexColors: true } );
  lorenz = new THREE.Line( geometry, material );
  scene.add( lorenz );

  // Create the bead geometry and material
  const beadGeometry = new THREE.SphereGeometry( 0.5, 32, 32 ); // Sphere with small radius
  const beadMaterial = new THREE.MeshBasicMaterial( {
    color: 0xffffff, emissive: 0xffffff
  } );
  lorenzBead = new THREE.Mesh( beadGeometry, beadMaterial );
  scene.add( lorenzBead );

  // Create the axes helper
  // axesHelper = new THREE.AxesHelper( 30 );
  // scene.add( axesHelper );

  animate();
}

function animate () {
  requestAnimationFrame( animate );

  const pos = lorenz.geometry.attributes.position.array;
  const tot = soln.length;

  for ( let i = 0;i < batch && idx < tot;i++, idx++ ) {
    const p = soln[ idx ];
    // switch axes to rotate around the x-axis
    pos[ idx * 3 ] = p.y;
    pos[ idx * 3 + 1 ] = p.z;
    pos[ idx * 3 + 2 ] = p.x;
  }

  if ( idx < soln.length ) {
    const p = soln[ idx ];
    lorenzBead.position.set( p.y, p.z, p.x );
  }
  lorenz.geometry.attributes.position.needsUpdate = true;

  controls.update();
  renderer.render( scene, camera );
}


document.getElementById( 'lorenzForm' ).addEventListener( 'submit', ( event ) => {
  event.preventDefault();
  const sigma = parseFloat( form.sigma.value );
  const rho = parseFloat( form.rho.value );
  const beta = parseFloat( form.beta.value );

  // regenerate
  scene.remove( lorenz );
  soln = createLorenzAttractor( sigma, rho, beta );
  idx = 0;

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute( 'position', new THREE.BufferAttribute( new Float32Array( soln.length * 3 ), 3 ) );

  const colors = new Float32Array( soln.length * 3 );
  const color = new THREE.Color( 0x40E0D0 ); // Turquoise blue

  for ( let i = 0;i < soln.length;i++ ) {
    colors[ i * 3 ] = color.r;
    colors[ i * 3 + 1 ] = color.g;
    colors[ i * 3 + 2 ] = color.b;
  }

  geometry.setAttribute( 'color', new THREE.BufferAttribute( colors, 3 ) );

  const material = new THREE.LineBasicMaterial( { vertexColors: true } );
  lorenz = new THREE.Line( geometry, material );
  scene.add( lorenz );
} );

init();
