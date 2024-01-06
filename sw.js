if ( window.location.port !== '3000' ) {
  console.log( 'Registering service worker...' );
  if ( 'serviceWorker' in navigator ) {
    navigator.serviceWorker.register( './service-worker.js' );
  }
}