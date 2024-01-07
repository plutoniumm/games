const PRECACHE = 'precache-v1';
const PRECACHE_URLS = [];

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
  const currentCaches = [ PRECACHE ];
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
          .open( PRECACHE )
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