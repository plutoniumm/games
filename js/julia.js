import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const shader = ( url ) => fetch( `/shaders/${ url }` ).then( res => res.text() );

// Get shader source code
const VERTEX_SHADER = await shader( 'mandel.vert' );
const FRAGMENT_SHADER = await shader( 'mandel.frag' );

const canvas = document.getElementById( 'mandelbulb' );
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const init = () => {
  const renderer = new THREE.WebGLRenderer( {
    antialias: true, canvas: canvas
  } );

  const scene = new THREE.Scene();

  const orthographiCamera = new THREE.OrthographicCamera( window.innerWidth / -2.0, window.innerWidth / +2.0, window.innerHeight / +2.0, window.innerHeight / -2.0, 0.0, 1.0 );
  const perspectiveCamera = new THREE.PerspectiveCamera( 45.0, window.innerWidth / window.innerHeight, 0.1, 1000.0 );
  const controls = new OrbitControls( perspectiveCamera, renderer.domElement );
  const clock = new THREE.Clock();

  perspectiveCamera.position.set( 0.0, 0.0, 5.0 );
  perspectiveCamera.lookAt( new THREE.Vector3( 0.0, 0.0, 0.0 ) );

  const geometry = new THREE.PlaneGeometry( window.innerWidth, window.innerHeight );

  const uniforms = {
    uApp: {
      value: {
        time: clock.getElapsedTime(),
        resolution: new THREE.Vector2( window.innerWidth, window.innerHeight )
      }
    },
    uCamera: {
      value: {
        position: perspectiveCamera.position,
        viewMatrix: perspectiveCamera.matrixWorldInverse,
        projectionMatrix: perspectiveCamera.projectionMatrix
      }
    },
    uParams: {
      value: {
        numIterations: 300,
        convergenceCriteria: 0.0001,
        finiteDifferenceEpsilon: 0.0001
      }
    },
    uScene: {
      value: {
        backgroundColor: new THREE.Vector3( 0.0, 0.0, 0.0 ),
        lights: [
          {
            direction: new THREE.Vector3( 1.0, 1.0, 1.0 ),
            ambientColor: new THREE.Vector3( 1.0, 1.0, 1.0 ),
            diffuseColor: new THREE.Vector3( 1.0, 1.0, 1.0 ),
            specularColor: new THREE.Vector3( 1.0, 1.0, 1.0 )
          },
          {
            direction: new THREE.Vector3( -1.0, -1.0, -1.0 ),
            ambientColor: new THREE.Vector3( 1.0, 1.0, 1.0 ),
            diffuseColor: new THREE.Vector3( 1.0, 1.0, 1.0 ),
            specularColor: new THREE.Vector3( 1.0, 1.0, 1.0 )
          }
        ],
        material: {
          ambientColor: new THREE.Vector3( 0.05, 0.05, 0.05 ),
          diffuseColor: new THREE.Vector3( 0.5, 0.5, 0.5 ),
          specularColor: new THREE.Vector3( 1.0, 1.0, 1.0 ),
          emissionColor: new THREE.Vector3( 0.0, 0.0, 0.0 ),
          shininess: 64.0
        },
        bound: {
          position: new THREE.Vector3( 0.0, 0.0, 0.0 ),
          radius: 2.0
        },
        fractal: {
          power: 8,
          numIterations: 4,
          escapeCriteria: 2.0
        }
      }
    }
  }

  const material = new THREE.ShaderMaterial( {
    vertexShader: VERTEX_SHADER,
    fragmentShader: FRAGMENT_SHADER,
    uniforms: uniforms
  } );

  scene.add( new THREE.Mesh( geometry, material ) );

  const onWindowResize = ( event ) => {
    uniforms.uApp.value.resolution.x = window.innerWidth * window.devicePixelRatio;
    uniforms.uApp.value.resolution.y = window.innerHeight * window.devicePixelRatio;
    // NOTE: https://ics.media/tutorial-three/renderer_resize/
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    perspectiveCamera.aspect = window.innerWidth / window.innerHeight;
    perspectiveCamera.updateProjectionMatrix();
  }
  onWindowResize();
  window.addEventListener( 'resize', onWindowResize, false );

  const animate = async () => {
    requestAnimationFrame( animate );

    const update = () => {
      controls.update();
      perspectiveCamera.lookAt( new THREE.Vector3( 0.0, 0.0, 0.0 ) );
      uniforms.uApp.value.time = clock.getElapsedTime();
      uniforms.uCamera.value.position = perspectiveCamera.position;
      uniforms.uCamera.value.viewMatrix = perspectiveCamera.matrixWorldInverse;
      uniforms.uCamera.value.projectionMatrix = perspectiveCamera.projectionMatrix;
    }

    update();

    renderer.render( scene, orthographiCamera );
  };

  animate();
}
init()
