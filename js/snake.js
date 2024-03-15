let canvas = document.getElementById( 'game' );
let context = canvas.getContext( '2d' );

const IW = window.innerWidth;
const IH = window.innerHeight;
let grid = 16;

canvas.width = ( ( IW / grid ) | 0 ) * grid;
canvas.height = ( ( IH / grid ) | 0 ) * grid;

// the canvas width & height, snake x & y, and the apple x & y, all need to be a multiples of the grid size in order for collision detection to work
// (e.g. 16 * 25 = 400)
let count = 0;
let snake = {
  x: 160,
  y: 160,
  dx: grid,
  dy: 0,
  cells: [],
  maxCells: 4
};
let apple = { x: 320, y: 320 };

const rand = ( a, b ) => ( Math.random() * ( b - a ) ) | 0 + a;

function loop () {
  requestAnimationFrame( loop );
  // slow down the animation dynamically
  // (the higher the value, the faster it gets)
  let speed = 4;
  if ( snake.cells.length > 4 ) {
    speed = 4 - ( snake.cells.length - 4 ) * 0.1;
    // if speed is x.5 round it with 50% probability up or down
    let rem = speed % 1;
    if ( Math.random() > rem ) {
      speed = Math.ceil( speed );
    } else {
      speed = Math.floor( speed );
    }
  };
  if ( ++count <= Math.max( speed, 1 ) ) {
    return;
  }

  count = 0;
  context.clearRect( 0, 0, canvas.width, canvas.height );
  snake.x += snake.dx;
  snake.y += snake.dy;
  if ( snake.x < 0 ) {
    snake.x = canvas.width - grid;
  }
  else if ( snake.x >= canvas.width ) {
    snake.x = 0;
  }
  if ( snake.y < 0 ) {
    snake.y = canvas.height - grid;
  }
  else if ( snake.y >= canvas.height ) {
    snake.y = 0;
  }

  snake.cells.unshift( { x: snake.x, y: snake.y } );
  if ( snake.cells.length > snake.maxCells ) {
    snake.cells.pop();
  }

  context.fillStyle = 'red';
  context.fillRect( apple.x, apple.y, grid - 1, grid - 1 );

  context.fillStyle = 'black';
  snake.cells.forEach( ( cell, _ ) => {
    context.fillRect( cell.x, cell.y, grid - 1, grid - 1 );
    if ( cell.x === apple.x && cell.y === apple.y ) {
      snake.maxCells++;
      apple.x = rand( 0, 25 ) * grid;
      apple.y = rand( 0, 25 ) * grid;
    };

    // self eating
    for ( let i = 1;i < snake.cells.length;i++ ) {
      if ( snake.cells[ i ].x === snake.x && snake.cells[ i ].y === snake.y ) {
        snake.x = 160;
        snake.y = 160;
        snake.cells = [];
        snake.maxCells = 4;
        snake.dx = grid;
        snake.dy = 0;
        apple.x = rand( 0, 25 ) * grid;
        apple.y = rand( 0, 25 ) * grid;
      }
    }
  } );
}

// listen to keyboard events to move the snake
document.addEventListener( 'keydown', function ( e ) {
  // if going left, can't go right
  // left arrow key
  if ( e.which === 37 && snake.dx === 0 ) {
    snake.dx = -grid;
    snake.dy = 0;
  }
  // up arrow key
  else if ( e.which === 38 && snake.dy === 0 ) {
    snake.dy = -grid;
    snake.dx = 0;
  }
  // right arrow key
  else if ( e.which === 39 && snake.dx === 0 ) {
    snake.dx = grid;
    snake.dy = 0;
  }
  // down arrow key
  else if ( e.which === 40 && snake.dy === 0 ) {
    snake.dy = grid;
    snake.dx = 0;
  }
} );
requestAnimationFrame( loop );