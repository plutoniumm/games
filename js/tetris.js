// TODO: convert all number lists to int8 arrays
const row = ( nums ) => new Int8Array( nums );
const $ = ( sel ) => document.getElementById( sel );
class Game {
  colors = [
    null, "#f72585", "#7209b7", "#3a0ca3",
    "#4361ee", "#4cc9f0", "#4361ee", "#3a0ca3"
  ];
  startGameBtn = null;
  restartGameBtn = null;
  pauseGameBtn = null;
  continueGameBtn = null;
  levelDisplay = null;
  scoreDisplay = null;
  canvas = null;
  context = null;
  arena = null;
  player = null;
  dropCounter = null;
  dropInterval = null;
  lastTime = null;

  constructor () {
    this.canvas = $( "tetris" );
    this.context = this.canvas.getContext( "2d" );
    this.startGameBtn = $( "start_game" );
    this.restartGameBtn = $( "restart_game" );
    this.pauseGameBtn = $( "pause_game" );
    this.continueGameBtn = $( "continue_game" );
    this.levelDisplay = $( "levels" );
    this.scoreDisplay = $( "score" );
    this.addEventListeners();
    this.init();
  }

  addEventListeners () {
    this.startGameBtn.addEventListener( "click", () => this.startGame() );
    this.startGameBtn.addEventListener( "touchstart", ( e ) => {
      e.preventDefault();
      this.startGame();
    } );

    this.restartGameBtn.addEventListener( "click", () => this.restartGame() );
    this.restartGameBtn.addEventListener( "touchstart", ( e ) => {
      e.preventDefault();
      this.restartGame();
    } );

    this.pauseGameBtn.addEventListener( "click", () => this.pauseGame() );
    this.pauseGameBtn.addEventListener( "touchstart", ( e ) => {
      e.preventDefault();
      this.pauseGame();
    } );

    this.continueGameBtn.addEventListener( "click", () => this.continueGame() );
    this.continueGameBtn.addEventListener( "touchstart", ( e ) => {
      e.preventDefault();
      this.continueGame();
    } );
  }

  addKeyboardControls () {
    document.addEventListener( "keydown", ( event ) => {
      if ( event.keyCode === 37 ) {
        this.playerMove( -1 );
      } else if ( event.keyCode === 39 ) {
        this.playerMove( 1 );
      } else if ( event.keyCode === 40 ) {
        this.playerDrop();
      } else if ( event.keyCode === 38 ) {
        this.playerRotate( 1 );
      }
    } );
  }

  addTouchControls () {
    let initialX = null;
    let initialY = null;

    document.addEventListener( "touchstart", ( e ) => {
      initialX = e.touches[ 0 ].clientX;
      initialY = e.touches[ 0 ].clientY;
    } );

    document.addEventListener( "touchmove", ( e ) => {
      if ( initialX === null || initialY === null ) return;

      const currentX = e.touches[ 0 ].clientX;
      const currentY = e.touches[ 0 ].clientY;
      const deltaX = currentX - initialX;
      const deltaY = currentY - initialY;

      // Horizontal swipe
      if ( Math.abs( deltaX ) > Math.abs( deltaY ) ) {
        this.playerMove( deltaX > 0 ? 1 : -1 );
      } else {
        if ( deltaY > 0 ) {
          this.playerDrop();
        } else {
          this.playerRotate( 1 );
        }
      }

      // Reset initialX and initialY to null after handling the swipe
      initialX = null;
      initialY = null;
    } );
  }

  init () {
    this.addKeyboardControls();
    this.addTouchControls();

    this.context.shadowColor = "black";
    this.context.shadowOffsetX = 0.5;
    this.context.shadowOffsetY = 0.5;

    this.context.scale( 20, 20 );
    this.arena = this.createMatrix( 12, 20 );
    this.player = {
      pos: { x: 0, y: 0 },
      matrix: null,
      score: 0
    };

    this.playerReset();

    this.dropCounter = 0;
    this.dropInterval = 500;
    this.lastTime = 0;
  }

  startGame () {
    this.startGameBtn.style.display = "none";
    this.restartGameBtn.style.display = "block";
    this.update();
  }

  restartGame () {
    this.player.pos.y = 0;
    this.merge( this.arena, this.player );
    this.dropInterval = 500;
    this.levelDisplay.innerText = "Level 1";
  }

  pauseGame () {
    this.dropInterval = 2000000;
    this.pauseGameBtn.style.display = "none";
    this.continueGameBtn.style.display = "block";
  }

  continueGame () {
    this.dropInterval = 200;
    this.pauseGameBtn.style.display = "block";
    this.continueGameBtn.style.display = "none";
  }

  drawMatrix ( matrix, offset ) {
    if ( !matrix ) {
      throw new Error( "Matrix is not defined" );
    }

    matrix.forEach( ( row, y ) => {
      row.forEach( ( value, x ) => {
        if ( value !== 0 ) {
          this.context.fillStyle = this.colors[ value ];
          this.context.shadowColor = this.colors[ value ];
          this.context.fillRect( x + offset.x, y + offset.y, 1, 1 );
        }
      } );
    } );
  }

  arenaSweep () {
    let rowCount = 1;
    outer: for ( let y = this.arena.length - 1;y > 0;--y ) {
      for ( let x = 0;x < this.arena[ y ].length;++x ) {
        if ( this.arena[ y ][ x ] === 0 ) {
          continue outer;
        }
      }

      const row = this.arena.splice( y, 1 )[ 0 ].fill( 0 );
      this.arena.unshift( row );
      ++y;

      this.player.score += rowCount * 10;
      rowCount *= 2;
    }
  }

  collide ( arena, player ) {
    const [ m, o ] = [ player.matrix, player.pos ];
    for ( let y = 0;y < m.length;++y ) {
      for ( let x = 0;x < m[ y ].length;++x ) {
        if (
          m[ y ][ x ] !== 0 && (
            arena[ y + o.y ] &&
            arena[ y + o.y ][ x + o.x ]
          ) !== 0
        ) {
          return true;
        }
      }
    }
    return false;
  }

  createMatrix ( w, h ) {
    const matrix = [];
    while ( h-- ) {
      matrix.push( new Int8Array( w ).fill( 0 ) );
    }
    return matrix;
  }

  draw = () => {
    this.context.fillStyle = "#090909";
    this.context.fillRect(
      0, 0, this.canvas.width, this.canvas.height
    );

    this.drawMatrix( this.arena, { x: 0, y: 0 } );
    this.drawMatrix( this.player.matrix, this.player.pos );
  };

  createPiece ( type ) {
    if ( type === "I" ) {
      return [
        row( [ 0, 1, 0, 0 ] ),
        row( [ 0, 1, 0, 0 ] ),
        row( [ 0, 1, 0, 0 ] ),
        row( [ 0, 1, 0, 0 ] ),
      ];
    } else if ( type === "L" ) {
      return [
        row( [ 0, 2, 0 ] ),
        row( [ 0, 2, 0 ] ),
        row( [ 0, 2, 2 ] ),
      ];
    } else if ( type === "J" ) {
      return [
        row( [ 0, 3, 0 ] ),
        row( [ 0, 3, 0 ] ),
        row( [ 3, 3, 0 ] ),
      ];
    } else if ( type === "O" ) {
      return [
        row( [ 4, 4 ] ),
        row( [ 4, 4 ] ),
      ];
    } else if ( type === "Z" ) {
      return [
        row( [ 5, 5, 0 ] ),
        row( [ 0, 5, 5 ] ),
        row( [ 0, 0, 0 ] ),
      ];
    } else if ( type === "S" ) {
      return [
        row( [ 0, 6, 6 ] ),
        row( [ 6, 6, 0 ] ),
        row( [ 0, 0, 0 ] ),
      ];
    } else if ( type === "T" ) {
      return [
        row( [ 0, 7, 0 ] ),
        row( [ 7, 7, 7 ] ),
        row( [ 0, 0, 0 ] ),
      ];
    }
  }

  merge ( arena, player ) {
    player.matrix.forEach( ( row, y ) => {
      row.forEach( ( value, x ) => {
        if ( value !== 0 ) {
          arena[ y + player.pos.y ][ x + player.pos.x ] = value;
        }
      } );
    } );
  }

  playerRotate ( dir ) {
    const pos = this.player.pos.x;
    let offset = 1;
    this.rotate( this.player.matrix, dir );

    while ( this.collide( this.arena, this.player ) ) {
      this.player.pos.x += offset;
      offset = -( offset + ( offset > 0 ? 1 : -1 ) );
      if ( offset > this.player.matrix[ 0 ].length ) {
        this.rotate( this.player.matrix, -dir );
        this.player.pos.x = pos;
        return;
      }
    }
  }

  rotate ( matrix, dir ) {
    for ( let y = 0;y < matrix.length;++y ) {
      for ( let x = 0;x < y;++x ) {
        [ matrix[ x ][ y ], matrix[ y ][ x ] ] = [ matrix[ y ][ x ], matrix[ x ][ y ] ];
      }
    }

    if ( dir > 0 ) {
      matrix.forEach( ( row ) => row.reverse() );
    } else {
      matrix.reverse();
    }
  }

  playerMove ( dir ) {
    this.player.pos.x += dir;
    if ( this.collide( this.arena, this.player ) ) {
      this.player.pos.x -= dir;
    }
  }

  playerReset () {
    const pieces = "TJLOSZI";
    this.player.matrix = this.createPiece(
      pieces[ ( pieces.length * Math.random() ) | 0 ]
    );
    this.player.pos.y = 0;
    this.player.pos.x =
      ( ( this.arena[ 0 ].length / 2 ) | 0 ) -
      ( ( this.player.matrix[ 0 ].length / 2 ) | 0 );

    if ( this.collide( this.arena, this.player ) ) {
      this.arena.forEach( ( row ) => row.fill( 0 ) );
      this.player.score = 0;
      this.updateScore();
      this.dropInterval = 500;
      $( "levels" ).innerText = "Level 1";
    }
  }

  playerDrop () {
    this.player.pos.y++;
    if ( this.collide( this.arena, this.player ) ) {
      this.player.pos.y--;
      this.merge( this.arena, this.player );
      this.playerReset();
      this.arenaSweep();
      this.updateScore();
    }
    this.dropCounter = 0;
  }

  updateScore () {
    $( "score" ).innerText = this.player.score;
    const scoring = $( "score" );
    const textScore = scoring.textContent;
    const numberScore = Number( textScore );

    // Calculate level based on score
    const level = Math.floor( numberScore / 100 ) + 1;

    const speedAdjustmentFactor = 50;

    // Adjust drop interval based on level
    this.dropInterval = 500 - level * speedAdjustmentFactor;

    // If the level is greater than 5, set the drop interval to 100
    if ( this.dropInterval < 100 ) {
      this.dropInterval = 100;
    }

    // Display the current level
    $( "levels" ).innerText = "Level " + level;
  }

  update ( time = 0 ) {
    const deltaTime = time - this.lastTime;
    this.lastTime = time;
    this.dropCounter += deltaTime;
    if ( this.dropCounter > this.dropInterval ) {
      this.playerDrop();
    }
    this.draw();
    requestAnimationFrame( this.update.bind( this ) );
  }
  // End of Game class
}

const game = new Game();
