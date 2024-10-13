let gridSize = {
  x: 5,
  y: 5
};
let gridOffset = { x: 0, y: 0 };
let cellSize, selectedCell;
let grid = [];
let pairs = [];
let dirs = [
  [ 0, -1 ],
  [ -1, 0 ],
  [ 1, 0 ],
  [ 0, 1 ]
];

let debug = false;

class Cell {
  constructor ( x, y, idx, number = 0 ) {
    this.x = x;
    this.y = y;
    this.connections = [];
    this.solution = [];
    this.idx = idx;
    this.identifier = idx;
    this.selected = false;
    this.hovered = false;
    this.number = number;
    this.pair = undefined;
    this.hue = 0;
    this.maxConnections = this.number > 0 ? 1 : 2;
  }
  render () {
    pushPop( () => {
      noFill();
      if ( this.hovered ) fill( 1, .3 );
      if ( this.selected ) fill( 1, .6 );
      stroke( 1 );
      translate( gridOffset.x + this.x * cellSize, gridOffset.y + this.y * cellSize );
      rect( 0, 0, cellSize, cellSize );

      if ( debug ) {
        textSize( cellSize * .1 );
        text( this.maxConnections, cellSize * .1, cellSize * .1 );
      }

      strokeWeight( cellSize * .15 );
      stroke( .5 );

      if ( this.hue != 0 ) stroke( this.hue, .7, 1 );

      translate( cellSize / 2, cellSize / 2 )
      for ( let c of this.connections ) {
        line( 0, 0, ( c.x - this.x ) * cellSize, ( c.y - this.y ) * cellSize );
      }
    } )
  }
  renderText () {
    if ( debug ) {
      pushPop( () => {
        translate( gridOffset.x + this.x * cellSize, gridOffset.y + this.y * cellSize );
        fill( 1 );
        noStroke();
        translate( cellSize / 2, cellSize * .55 );
        textSize( cellSize * .2 );
        text( this.identifier, 0, 0 );
      } )
    }

    if ( this.number > 0 ) {
      pushPop( () => {
        translate( gridOffset.x + this.x * cellSize, gridOffset.y + this.y * cellSize );
        fill( this.hue, .7, 1 );
        noStroke();


        if ( this.number > 0 && ( this.hovered || this.pair.hovered ) ) {
          stroke( 1 );
          strokeWeight( cellSize * .05 );
        }

        rect( cellSize * .1, cellSize * .1, cellSize * .8, cellSize * .8, cellSize * .1 );
        fill( 0 );
        translate( cellSize / 2, cellSize * .55 );
        text( this.number, 0, 0 );
      } )
    }
  }

  reset () {
    this.solution = [ ...this.connections ];
    this.connections = [];
    this.identifier = this.idx;
    this.selected = false;
    if ( this.number == 0 ) this.hue = 0;
    this.maxConnections = ( this.number > 0 ) ? 1 : 2;
  }

  contains ( x, y ) {
    let x2 = this.x * cellSize + gridOffset.x;
    let y2 = this.y * cellSize + gridOffset.y;
    return ( x > x2 && y > y2 && x < x2 + cellSize && y < y2 + cellSize );
  }
  addConnection ( c, erase = true ) {
    if ( !this.connections.includes( c ) ) {
      this.connections.push( c );
    }
    else if ( erase ) this.removeConnection( c );

    if ( this.connections.length > this.maxConnections ) {
      let c2 = this.connections.splice( 0, 1 )[ 0 ];
      breakCells( this, c2 );
    }
  }
  removeConnection ( c ) {
    if ( this.connections.includes( c ) ) {
      let idx = this.connections.indexOf( c );
      this.connections.splice( idx, 1 );
      if ( this.connections.length == 0 && this.number == 0 ) this.hue = 0;
    }
  }
  distTo ( c ) { return ( abs( c.x - this.x ) + abs( c.y - this.y ) ) }

  changeIdentifier ( parent, current, identifier ) {
    this.identifier = identifier;
    if ( this.hue == 0 ) this.hue = parent.hue;
    for ( let c of this.connections ) {
      if ( c != parent && c != current ) c.changeIdentifier( parent, this, identifier );
    }
  }

  deletePath () {
    while ( this.connections.length > 0 ) {
      let c = this.connections[ 0 ];
      breakCells( c, this );
      c.deletePath();
    }
  }

  randomConnection () {
    for ( let i = 0;i < 1;i++ ) {
      let dir = random( dirs );
      let mx = this.x + dir[ 0 ];
      let my = this.y + dir[ 1 ];
      if ( inGrid( mx, my ) ) {
        let c = getCell( mx, my );
        connectCells( c, this, false );
      }
    }
  }
  extend () {
    //check for 0s first
    for ( let d of dirs ) {
      let c1 = getCell( this.x + d[ 0 ], this.y + d[ 1 ] );
      if ( c1 != undefined ) {
        if ( c1.connections.length == 0 ) {
          connectCells( c1, this, false );
          return;
        }
      }
    }

    if ( this.connections.length == 1 ) {

      let c = this.connections[ 0 ];
      let mx = this.x + ( this.x - c.x );
      let my = this.y + ( this.y - c.y );
      if ( inGrid( mx, my ) ) {
        let c2 = getCell( mx, my );
        if ( c2.connections.length <= 1 || c.connections.length == 1 ) {
          connectCells( c2, this, false );
        }
      }
    }
  }

  validate () {
    let changed = false;
    if ( this.connections.length == 2 ) {
      let c1 = this.connections[ 0 ];
      let c2 = this.connections[ 1 ];

      if ( c1.connections.length == 2 ) {
        let c3 = c1.connections[ 0 ];
        if ( c3 == this ) c3 = c1.connections[ 1 ];
        if ( c2.distTo( c3 ) == 1 ) {
          breakCells( c1, this );
          changed = true;
        }
      }

      if ( c2.connections.length == 2 ) {
        let c3 = c2.connections[ 0 ];
        if ( c3 == this ) c3 = c2.connections[ 1 ];
        if ( c1.distTo( c3 ) == 1 ) {
          breakCells( c2, this );
          changed = true;
        }
      }
    }
    return changed
  }

  removeOverlap () {
    let changed = false;
    let same = 0;
    for ( let d of dirs ) {
      let c = getCell( this.x + d[ 0 ], this.y + d[ 1 ] );
      let c2 = getCell( this.x + d[ 0 ] * 2, this.y + d[ 1 ] * 2 );
      if ( c != undefined ) {
        if ( c.identifier == this.identifier ) {
          same++;
          if ( c.connections.length == 1 && this.connections.length == 1 ) same = 3;
        }
        else if ( c2 != undefined && c2.identifier == this.identifier && this.connections.length == 1 ) {
          same = 3;
        }
      }
    }
    if ( same >= 3 ) {
      let c = this.connections[ 0 ];
      breakCells( c, this );
      changed = true;
    }

    return changed;
  }
}

function connectCells ( c1, c2, erase = true ) {
  if ( c1.identifier == c2.identifier ) {
    breakCells( c1, c2 );
    return;
  }
  if ( c1.hue != c2.hue && c1.hue != 0 && c2.hue != 0 ) return;

  c1.addConnection( c2, erase );
  c2.addConnection( c1, erase );
  c1.changeIdentifier( c2, c1, c2.identifier );
  c2.changeIdentifier( c1, c2, c1.identifier );
}

function breakCells ( c1, c2 ) {
  c1.removeConnection( c2 );
  c2.removeConnection( c1 );
  c1.changeIdentifier( c1, c1, c1.idx );
  c2.changeIdentifier( c2, c2, c2.idx );
}

function getCell ( x, y ) {
  let cell;
  grid.map( c => { if ( c.x == x && c.y == y ) cell = c } );
  return cell;
}

function inGrid ( x, y ) {
  return ( x >= 0 && x < gridSize.x && y >= 0 && y < gridSize.y );
}

function reset () {
  grid.map( c => c.reset() );
  selectedCell = undefined;
}

function hasWin () {
  let win = true;
  let emptys = grid.filter( c => ( c.connections.length == 0 ) )

  if ( emptys.length > 0 ) win = false;

  for ( let pair of pairs ) {
    let c1 = pair[ 0 ];
    let c2 = pair[ 1 ];
    if ( c1.identifier != c2.identifier ) win = false;
  }
  return win;
}

function setup () {
  pixelDensity( displayDensity() );
  createCanvas();
  colorMode( HSB, 1, 1, 1 );
  textAlign( CENTER, CENTER );
  strokeJoin( BEVEL );
  windowResized();
  init();
}

function init () {
  grid = [];
  pairs = [];
  for ( let i = 0;i < gridSize.x;i++ ) {
    for ( let j = 0;j < gridSize.y;j++ ) {
      grid.push( new Cell( i, j, i + j * gridSize.x ) );
    }
  }
  generate();
}

function generate () {
  grid.map( c => c.randomConnection() );

  let hasChanges = true;
  while ( hasChanges ) {
    hasChanges = false;
    grid = shuffle( grid );
    grid.map( c => c.extend() );
    grid.map( c => { hasChanges |= c.validate() } );
    grid.map( c => { hasChanges |= c.removeOverlap() } );
  }

  let endPoints = grid.filter( c => ( c.connections.length == 1 ) );
  let idx = 1;
  while ( endPoints.length > 0 ) {
    let c1 = endPoints.pop();
    let c2 = endPoints.filter( c => c.identifier == c1.identifier )[ 0 ];

    let hue = ( idx / 11.3 ) % 1
    c1.number = idx;
    c2.number = idx;
    c1.hue = hue;
    c2.hue = hue;
    c1.pair = c2;
    c2.pair = c1;
    idx++;

    endPoints = endPoints.filter( c => c.identifier != c1.identifier );
    pairs.push( [ c1, c2 ] );
  }

  reset();
}

function draw () {
  background( 0 );
  if ( grid.length > 0 && hasWin() ) background( 1 );
  grid.map( c => c.render() );
  grid.map( c => c.renderText() );
}

function keyPressed () {
  if ( keyCode == 32 ) init();
  if ( key === "v" ) {
    grid.map( c => c.validate() );
    grid.map( c => c.removeOverlap() );
    grid = shuffle( grid );
  }
  if ( key === "e" ) {
    grid.map( c => c.extend() );
  }

  if ( key === "r" ) { reset(); }
  if ( key === "s" ) { grid.map( c => c.randomConnection() ) }
  if ( key === "p" ) grid.map( c => {
    let temp = [ ...c.solution ];
    c.solution = [ ...c.connections ];
    c.connections = [ ...temp ];
  } );
}

function windowResized () {
  resizeCanvas( windowWidth, windowHeight );
  cellSize = min( width / gridSize.x, height / gridSize.y );
  textSize( cellSize * .6 );
  gridOffset.x = width / 2 - cellSize * gridSize.x / 2;
  gridOffset.y = height / 2 - cellSize * gridSize.y / 2;
}

function mousePressed () {
  selectedCell = undefined;
  grid.map( c => {
    c.selected = c.contains( mouseX, mouseY );
    if ( c.selected ) selectedCell = c;
  } )
}

function mouseMoved () {
  grid.map( c => {
    c.hovered = c.contains( mouseX, mouseY );
    if ( c.hovered && c.hue != 0 );
  } );
}

function doubleClicked () {
  let cell = undefined;
  grid.map( c => { if ( c.contains( mouseX, mouseY ) ) cell = c } );
  if ( cell != undefined ) cell.deletePath();
}

function mouseDragged () {
  if ( selectedCell && selectedCell.hue == 0 ) return;

  let cell;
  grid.map( c => {
    c.hovered = c.contains( mouseX, mouseY );
    if ( c.hovered ) cell = c;
  } )

  if ( selectedCell && cell ) {
    let dist = abs( cell.x - selectedCell.x ) + abs( cell.y - selectedCell.y )

    if ( dist == 1 ) {
      connectCells( cell, selectedCell );

      cell.selected = true;
      selectedCell.selected = false;
      selectedCell = cell;
    }
  }
}

function mouseReleased () {
  if ( selectedCell ) selectedCell.selected = false;
  selectedCell = undefined;
}

function pushPop ( f ) { push(); f(); pop(); }