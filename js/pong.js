const canvas = new OffscreenCanvas( 0, 0 );
const ctx = canvas.getContext( "2d" );
const visualCanvas = document.getElementById( "onscreen-canvas" );
const vctx = visualCanvas.getContext( "2d" );

const IW = window.innerWidth;
// let totalPixels = 720300
let totalPixels = window.innerWidth > 1024 ? 720300 : 480200;

let pong = {
  lastRun: 0,
  cWidth: null,
  cHeight: null,
  quadW: null,
  quadH: null,
  totalPixels: totalPixels, // 980 wide, 4:3 aspect ratio
  gradient: null,

  paddle: {
    new: ( n ) => {
      return {
        w: this.paddleW,
        h: this.paddleH,
        x: n === 'player' ? 0 : canvas.width - this.paddleW,
        y: ( canvas.height - this.paddleH ) / 2,
        score: 0,
        direction: 0,
        maxSpeed: n === 'player' ? 300 : 200
      }
    }
  },

  detectCollision: ( paddle ) => {
    if ( (
      this.ball.xPos <= paddle.x + paddle.w &&
      this.ball.xPos >= paddle.x ||
      this.ball.xPos + this.ball.w <= paddle.x + paddle.w &&
      this.ball.xPos + this.ball.w >= paddle.x
    )
      && this.ball.yPos <= paddle.y + paddle.h
      && this.ball.yPos >= paddle.y
    ) {
      this.ball.xDir = this.ball.xDir * -1;
      const offset = ( paddle.y + paddle.h / 2 ) - ( this.ball.yPos + this.ball.h / 2 );
      this.ball.yDir = -offset * 7.5;
    }
  },

  initialize: () => {
    pong.scaleCanvas();
    this.paddleW = 10;
    this.paddleH = 80;
    this.player = pong.paddle.new.call( this, 'player' );
    this.opponent = pong.paddle.new.call( this, 'opponent' );
    this.ball = {
      xPos: canvas.width / 2 - 5,
      yPos: canvas.height / 2 - 5,
      w: 10,
      h: 10,
      xDir: 0,
      yDir: 0
    }

    let timer = null;
    window.addEventListener( "touchstart", ( e ) => {
      e.preventDefault();
      this.touchStart = e.touches[ 0 ].clientX;
    } );
    window.addEventListener( "touchmove", ( e ) => {
      e.preventDefault();
      clearTimeout( timer );
      let drag = e.touches[ 0 ].clientX - this.touchStart;
      if ( Math.abs( drag ) < 0.5 ) return;
      this.touchStart = e.touches[ 0 ].clientX;
      this.player.direction = Math.sign( drag );
      timer = setTimeout( () => {
        this.touchStart = e.touches[ 0 ].clientX;
        this.player.direction = 0;
      }, 10 );
    } );
    window.addEventListener( "touchend", ( e ) => {
      e.preventDefault();
      this.player.direction = 0;
    } );
    window.addEventListener( "resize", pong.scaleCanvas );
    document.addEventListener( "keydown", pong.movePlayer );
    document.addEventListener( "keyup",
      () => this.player.direction = 0
    );

    pong.startGame()
    requestAnimationFrame( pong.loop );
  },

  paddleY: ( num ) => Math.min(
    num, canvas.height - this.paddleH
  ),

  pause: () => {
    xdir = this.ball.xDir * -1;
    this.ball.xPos = canvas.width / 2 - 5;
    this.ball.yPos = canvas.height / 2 - 5;
    this.ball.xDir = 0;
    this.ball.yDir = 0;
  },

  increaseScore: ( paddle ) => {
    paddle.score += 1;
    paddle.score === 11 ?
      pong.gameOver() : pong.newTurn();
  },

  newTurn: () => {
    pong.pause();
    setTimeout( () => {
      this.ball.xDir = xdir;
      this.ball.yDir = 150;
    }, 1500 );
  },

  movePlayer: ( e ) => {
    switch ( e.keyCode ) {
      case 37:
        this.player.direction = -1;
        break;
      case 39:
        this.player.direction = 1;
        break;
    }
  },

  scaleCanvas: () => {
    cWidth = visualCanvas.offsetWidth;
    if ( typeof this.opponent !== 'undefined' ) {
      this.opponent.x = canvas.width - this.paddleW;
    }

    h = Math.round( pong.totalPixels / cWidth )

    canvas.width = visualCanvas.offsetWidth;
    canvas.height = h;
    this.gradient = ctx.createLinearGradient( 0, 0, 0, canvas.height );
    this.gradient.addColorStop( 1.0, "#111" );
    this.gradient.addColorStop( 0.5, "#000" );
    this.gradient.addColorStop( 0.0, "#111" );

    visualCanvas.width = visualCanvas.offsetWidth;
    visualCanvas.height = h;
  },

  loop: ( timestamp ) => {
    const progress = ( this.lastRun ) ? ( timestamp - this.lastRun ) / 1000 : 0;
    ctx.clearRect( 0, 0, canvas.width, canvas.height );
    vctx.clearRect( 0, 0, canvas.width, canvas.height );

    ctx.beginPath();
    ctx.fillStyle = this.gradient;
    ctx.rect( 0, 0, canvas.width, canvas.height );
    ctx.fill();

    // draw the net
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.setLineDash( [ 15, 15 ] );

    ctx.moveTo( canvas.width / 2, 0 );
    ctx.lineTo( canvas.width / 2, canvas.height );
    ctx.stroke();

    // draw the ball
    ctx.fillStyle = "#fff";
    this.ball.xPos += progress * this.ball.xDir;
    this.ball.yPos += progress * this.ball.yDir;
    if ( this.ball.yPos <= 0 || this.ball.yPos + this.ball.h >= ( canvas.height ) ) {
      this.ball.yDir = this.ball.yDir * -1;
    }
    ctx.fillRect( this.ball.xPos, this.ball.yPos, this.ball.w, this.ball.h );

    // detect ball interactions
    pong.detectCollision( this.player );
    pong.detectCollision( this.opponent );

    if ( this.ball.xPos + this.ball.w <= this.player.x ) {
      pong.increaseScore( this.opponent );
    }
    if ( this.ball.xPos >= this.opponent.x + this.opponent.w ) {
      pong.increaseScore( this.player );
    }

    // Draw the score
    ctx.font = '90px VT323';
    ctx.textAlign = "right";
    ctx.fillText( player.score, canvas.width / 2 - 30, 100 );
    ctx.textAlign = "left";
    ctx.fillText( opponent.score, canvas.width / 2 + 30, 100 );

    // Draw the paddles
    ctx.fillStyle = "#fff";
    if ( this.player.direction != 0 ) {
      this.player.y = pong.paddleY(
        this.player.y + progress * this.player.maxSpeed * this.player.direction
      );
    }

    ballCenter = ( this.ball.yPos + this.ball.h / 2 );
    opponentCenter = ( this.opponent.y + this.opponent.h / 2 );
    if ( Math.abs( ballCenter - opponentCenter ) > 30 ) {
      yMultiplier = ( this.ball.yPos + this.ball.h / 2 ) > ( this.opponent.y + this.opponent.h / 2 ) ? 1 : -1
      this.opponent.y += progress * this.opponent.maxSpeed * yMultiplier;
    }

    ctx.fillRect( this.player.x, this.player.y, this.player.w, this.player.h );
    ctx.fillRect( this.opponent.x, this.opponent.y, this.opponent.w, this.opponent.h );

    vctx.drawImage( canvas, 0, 0 );
    this.lastRun = timestamp;
    requestAnimationFrame( pong.loop );
  },

  startGame: () => {
    this.player.score = 0;
    this.opponent.score = 0;
    this.ball.xDir = 500;
    this.ball.yDir = 150
    pong.newTurn();
  },

  gameOver: () => {
    pong.pause();
    alert( 'Game Over. Replay?' );
  }
}

if ( visualCanvas.clientWidth > 0 ) {
  pong.initialize();
} else {
  var ro = new ResizeObserver( entries => {
    for ( let entry of entries ) {
      if ( entry.contentRect.width > 0 ) {
        pong.initialize();
        ro.disconnect();
      }
    }
  } );
  ro.observe( visualCanvas );
}
