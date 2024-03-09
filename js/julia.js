import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const shader = ( url ) => fetch( `/shaders/${ url }` ).then( res => res.text() );

// Get shader source code
const vertexShader = await shader( 'mandel.vert' );
const fragmentShader = await shader( 'mandel.frag' );

const canvas = document.getElementById( 'mandelbulb' );
const IH = window.innerHeight;
const IW = window.innerWidth;

const Vec = ( a, b, c ) => new THREE.Vector3( a, b, c );

canvas.width = IW;
canvas.height = IH;

const init = () => {
  const renderer = new THREE.WebGLRenderer( {
    antialias: true,
    canvas: canvas
  } );

  const scene = new THREE.Scene();

  const orthoCam = new THREE.OrthographicCamera(
    IW / - 2.0, IW / +2.0, IH / +2.0, IH / -2.0, 0, 1
  );
  const perspective = new THREE.PerspectiveCamera(
    45.0, IW / IH, 0.1, 1000
  );
  const controls = new OrbitControls(
    perspective, renderer.domElement
  );
  const clock = new THREE.Clock();

  perspective.position.set( 0, 0, 5.0 );
  perspective.lookAt( new THREE.Vector3( 0, 0, 0 ) );

  const geometry = new THREE.PlaneGeometry( IW, IH );

  const uniforms = {
    uApp: {
      value: {
        time: clock.getElapsedTime(),
        resolution: new THREE.Vector2( IW, IH )
      }
    },
    uCamera: {
      value: {
        position: perspective.position,
        viewMatrix: perspective.matrixWorldInverse,
        projectionMatrix: perspective.projectionMatrix
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
        backgroundColor: Vec( 0, 0, 0 ),
        lights: [
          {
            direction: Vec( 1, 1, 1 ),
            ambientColor: Vec( 1, 1, 1 ),
            diffuseColor: Vec( 1, 1, 1 ),
            specularColor: Vec( 1, 1, 1 )
          },
          {
            direction: Vec( -1, -1, -1 ),
            ambientColor: Vec( 1, 1, 1 ),
            diffuseColor: Vec( 1, 1, 1 ),
            specularColor: Vec( 1, 1, 1 )
          }
        ],
        material: {
          ambientColor: Vec( 0.05, 0.05, 0.05 ),
          diffuseColor: Vec( 0.5, 0.5, 0.5 ),
          specularColor: Vec( 1, 1, 1 ),
          emissionColor: Vec( 0, 0, 0 ),
          shininess: 64.0
        },
        bound: {
          position: Vec( 0, 0, 0 ),
          radius: 2.0
        },
        fractal: {
          power: 6,
          numIterations: 4,
          escapeCriteria: 2.0
        }
      }
    }
  }

  const material = new THREE.ShaderMaterial( {
    vertexShader, fragmentShader, uniforms
  } );

  scene.add( new THREE.Mesh( geometry, material ) );

  const onWindowResize = ( event ) => {
    uniforms.uApp.value.resolution.x = IW * window.devicePixelRatio;
    uniforms.uApp.value.resolution.y = IH * window.devicePixelRatio;
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( IW, IH );
    perspective.aspect = IW / IH;
    perspective.updateProjectionMatrix();
  }
  onWindowResize();
  window.addEventListener( 'resize', onWindowResize, false );

  const animate = async () => {
    requestAnimationFrame( animate );

    const update = () => {
      controls.update();
      perspective.lookAt( Vec( 0, 0, 0 ) );
      uniforms.uApp.value.time = clock.getElapsedTime();
      uniforms.uCamera.value.position = perspective.position;
      uniforms.uCamera.value.viewMatrix = perspective.matrixWorldInverse;
      uniforms.uCamera.value.projectionMatrix = perspective.projectionMatrix;
    }

    update();
    renderer.render( scene, orthoCam );
  };

  animate();
}
init()
