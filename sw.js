// const ver = +new Date();
// const CACHE = `cache-${ ver }`;

// const ASSETS = new Array( build.length + files.length ).fill( 0 );
// for ( let i = 0;i < build.length;i++ )
//   ASSETS[ i ] = build[ i ];
// for ( let i = 0;i < files.length;i++ )
//   ASSETS[ build.length + i ] = files[ i ];

// self.addEventListener( 'install', ( req ) => {
//   const addfiles = () => caches
//     .open( CACHE )
//     .then( c => c.addAll( ASSETS ) );

//   req.waitUntil( addfiles() );
// } );

// self.addEventListener( 'activate', ( req ) => {
//   // Remove previous cached data from disk
//   async function clear () {
//     const keys = await caches.keys();
//     for ( let i = 0;i < keys.length;i++ ) {
//       if ( keys[ i ] !== CACHE )
//         await caches.delete( keys[ i ] );
//     }
//   }

//   req.waitUntil( clear() );
// } );

// // 24 * 864e5
// const expires = new Map( [
//   [ '/api', 4 * 36e5 ],
// ] );
// function getExpiry ( url ) {
//   for ( const [ path, expire ] of expires ) {
//     if ( url.pathname.startsWith( path ) )
//       return expire;
//   }
//   return 7 * 24 * 36e5;
// }

// self.addEventListener( 'fetch', ( event ) => {
//   if ( event.request.method !== 'GET' ) return;

//   async function respond () {
//     const url = new URL( event.request.url );
//     const cache = await caches.open( CACHE );

//     // `build`/`files` can always be served from the cache
//     if ( ASSETS.includes( url.pathname ) ) {
//       const response = await cache.match( url.pathname );
//       if ( response ) {
//         const fetched = response.headers.get( 'sw-expire' );
//         const expired = fetched && ( +fetched < Date.now() );
//         if ( !expired )
//           return response;
//         // otherwise, refetch
//       };
//     }

//     // for everything else, try the network first, but
//     // fall back to the cache if we're offline
//     try {
//       const response = await fetch( event.request );
//       if ( !( response instanceof Response ) ) {
//         throw new Error( 'invalid response from fetch' );
//       }
//       if ( response.status === 200 ) {
//         // insert headers to cache expiration if not present
//         const cloned = response.clone();
//         const fetched = cloned.headers.get( 'sw-expire' );
//         if ( !fetched ) {
//           const headers = new Headers( cloned.headers );
//           headers.set( 'sw-expire', Date.now() + expire );
//           cache.put( url.pathname, new Response( cloned.body, { status: 200, headers } ) );
//         }
//         return response;
//       }
//     } catch ( err ) {
//       const response = await cache.match( event.request );
//       if ( response ) return response;

//       throw err;
//     }
//   }

//   event.respondWith( respond() );
// } );