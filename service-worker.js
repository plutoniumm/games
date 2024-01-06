const PRECACHE = 'precache-v1';
const RUNTIME = 'runtime';

// A list of local resources we always want to be cached.
const PRECACHE_URLS = [
  // 'index.html',
  // './', // Alias for index.html
  /// games
  // 2048
  '2048.html', 'css/2048.css', 'js/2048.js',
];

// The install handler takes care of precaching the resources we always need.
self.addEventListener( 'install', event => {
  event.waitUntil(
    caches.open( PRECACHE )
      .then( cache => cache.addAll( PRECACHE_URLS ) )
      .then( self.skipWaiting() )
  );
} );

// The activate handler takes care of cleaning up old caches.
self.addEventListener( 'activate', event => {
  const currentCaches = [ PRECACHE, RUNTIME ];
  event.waitUntil(
    caches.keys().then( names =>
      names.filter( name => !currentCaches.includes( name ) )
    ).then( cachesToDelete =>
      Promise.all( cachesToDelete.map( caches.delete ) )
    ).then( () => self.clients.claim() )
  );
} );

self.addEventListener( 'fetch', event => {
  // Skip cross-origin requests, like those for Google Analytics.
  if ( event.request.url.startsWith( self.location.origin ) ) {
    event.respondWith(
      caches.match( event.request ).then( cachedResponse => {
        if ( cachedResponse ) return cachedResponse;

        return caches
          .open( RUNTIME )
          .then( cache =>
            fetch( event.request )
              .then( response =>
                cache
                  .put( event.request, response.clone() )
                  .then( () => response )
              )
          );
      } )
    );
  }
} );