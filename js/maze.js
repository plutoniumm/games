let canvas = document.getElementById( "canvas" );
let ctx = canvas.getContext( "2d" );

const IW = window.innerWidth;
const IH = window.innerHeight;

const sz = Math.min( IW, IH );

let w = canvas.width = sz;
let h = canvas.height = sz;
let center = {
  x: w / 2,
  y: h / 2
};
const
  sin = Math.sin,
  cos = Math.cos,
  pi = Math.PI;

let width = 30;
let height = width * sin( pi / 3 );
let rings = 15;
let totalWidth = ( rings * 2 - 1 ) * width * 0.75;
let totalHeight = ( rings * 2 - 1 ) * height * 1.5;
let cells = [];

class Cell {
  constructor ( fill ) {
    if ( fill === undefined )
      this.fill = false;
    this.sides = new Array( 6 )
      .fill( 1 )
      .map( e => Math.random() > 0.5 ? 1 : 0 );
  }
  drawHex ( posx, posy ) {
    ctx.beginPath();
    ctx.moveTo( posx + width / 2 * cos( 0 ), posy + width / 2 * sin( 0 ) );

    for ( let a = 0;a < 6;a++ ) {
      let x = posx + width / 2 * cos( ( a + 1 ) * pi / 3 );
      let y = posy + width / 2 * sin( ( a + 1 ) * pi / 3 );

      if ( this.sides[ a ] ) {
        ctx.lineTo( x, y );
      } else {
        ctx.moveTo( x, y );
      }
    };
    ctx.stroke();
    if ( this.fill === true ) {
      ctx.beginPath();
      ctx.arc( posx, posy, 8, 0, 2 * pi );
      ctx.fillStyle = "#2af";
      ctx.fill();
    }
  }
}

function fillCells () {
  cells = [];
  for ( let r = 0;r < rings * 2 - 1;r++ ) {
    let row = [];
    for ( let c = 0;c < rings * 2 - 1;c++ ) {
      const check = (
        rings - 1 <= r + c &&
        r + c <= ( rings - 1 ) * 3
      )
      const type = Math.random() > 0.5 ? "cell" : "wall";

      row.push( check ? new Cell( type ) : 0 );
    }
    cells.push( row );
  }
}

const xoff = center.x - ( rings - 1 ) * width * 0.75;
const yoff = center.y - ( rings - 1 ) * height * 1.5;
function drawMap () {
  for ( let c = 0;c < cells.length;c++ ) {
    let columnOffset = height / 2 * c;
    let x = c * width * 0.75 + xoff;
    for ( let r = 0;r < cells[ c ].length;r++ ) {
      if ( cells[ r ][ c ] ) {
        let y = r * height + columnOffset + yoff;
        cells[ r ][ c ].drawHex( x, y );
      }
    }
  }
}

fillCells();
drawMap();
canvas.onclick = ( e ) => {
  let x = e.clientX;
  let y = e.clientY;
  let c = Math.round( ( x - xoff ) / ( width * 0.75 ) ) - rings - 2;
  let r = Math.round( ( y - yoff - height / 2 * c ) / height );
  if ( !cells[ r ]?.[ c ] ) return;

  console.log( r, c );
  cells[ r ][ c ].fill = !cells[ r ][ c ].fill;
  drawMap();
};

function DFS ( cell1, cell2 ) {
  let stack = [];
  stack.push( cell1 );
  let visited = [];
  for ( let i = 0;i < cells.length;i++ ) {
    let row = [];
    for ( let j = 0;j < cells[ i ].length;j++ ) {
      row.push( false );
    }
    visited.push( row );
  }
  visited[ cell1[ 0 ] ][ cell1[ 1 ] ] = true;
  while ( stack.length > 0 ) {
    let current = stack.pop();
    if ( current[ 0 ] === cell2[ 0 ] && current[ 1 ] === cell2[ 1 ] ) {
      return true;
    }
    let neighbors = getNeighbors( current );
    for ( let i = 0;i < neighbors.length;i++ ) {
      if ( !visited[ neighbors[ i ][ 0 ] ][ neighbors[ i ][ 1 ] ] ) {
        stack.push( neighbors[ i ] );
        visited[ neighbors[ i ][ 0 ] ][ neighbors[ i ][ 1 ] ] = true;
      }
    }
  }
  return false;
};

function getNeighbors ( cell ) {
  let r = cell[ 0 ];
  let c = cell[ 1 ];
  let neighbors = [];
  if ( r - 1 >= 0 ) {
    neighbors.push( [ r - 1, c ] );
  }
  if ( r + 1 < cells.length ) {
    neighbors.push( [ r + 1, c ] );
  }
  if ( c - 1 >= 0 ) {
    neighbors.push( [ r, c - 1 ] );
  }
  if ( c + 1 < cells[ r ].length ) {
    neighbors.push( [ r, c + 1 ] );
  }
  if ( r % 2 === 0 ) {
    if ( r - 1 >= 0 && c - 1 >= 0 ) {
      neighbors.push( [ r - 1, c - 1 ] );
    }
    if ( r + 1 < cells.length && c - 1 >= 0 ) {
      neighbors.push( [ r + 1, c - 1 ] );
    }
  } else {
    if ( r - 1 >= 0 && c + 1 < cells[ r ].length ) {
      neighbors.push( [ r - 1, c + 1 ] );
    }
    if ( r + 1 < cells.length && c + 1 < cells[ r ].length ) {
      neighbors.push( [ r + 1, c + 1 ] );
    }
  }
  return neighbors;
}

// loop around all points and find all edge point to edge point paths