const SHELL_CACHE =
  "pntt-reader-shell-v2";


const CHAPTER_CACHE =
  "pntt-reader-chapters-v2";


const SHELL_FILES = [

  "./",

  "./index.html",

  "./style.css",

  "./app.js",

  "./manifest.webmanifest",

  "./data/index.json",

  "./data/toc-part1.json",

  "./data/toc-part2.json",

];


// ============================================================
// INSTALL
// ============================================================

self.addEventListener(
  "install",
  event => {

    event.waitUntil(

      caches
        .open(
          SHELL_CACHE
        )

        .then(
          cache =>
            cache.addAll(
              SHELL_FILES
            )
        )

    );


    self.skipWaiting();

  }
);


// ============================================================
// ACTIVATE
// ============================================================

self.addEventListener(
  "activate",
  event => {

    event.waitUntil(

      Promise.all([

        self.clients.claim(),

        caches
          .keys()

          .then(
            keys => {

              return Promise.all(

                keys.map(
                  key => {

                    if (
                      key.startsWith(
                        "pntt-reader-shell-"
                      )
                      &&
                      key
                      !== SHELL_CACHE
                    ) {

                      return caches.delete(
                        key
                      );

                    }

                  }
                )

              );

            }
          )

      ])

    );

  }
);


// ============================================================
// FETCH
// ============================================================

self.addEventListener(
  "fetch",
  event => {

    if (
      event.request.method
      !== "GET"
    ) {

      return;

    }


    const url =
      new URL(
        event.request.url
      );


    // --------------------------------------------------------
    // CHAPTER JSON
    // --------------------------------------------------------

    const isChapter =
      /\/data\/part[12]\/\d{4}\.json$/
        .test(
          url.pathname
        );


    if (
      isChapter
    ) {

      event.respondWith(

        caches
          .open(
            CHAPTER_CACHE
          )

          .then(
            async cache => {

              const cached =
                await cache.match(
                  event.request
                );


              if (
                cached
              ) {

                return cached;

              }


              const response =
                await fetch(
                  event.request
                );


              if (
                response.ok
              ) {

                cache.put(
                  event.request,
                  response.clone()
                );

              }


              return response;

            }
          )

      );


      return;

    }


    // --------------------------------------------------------
    // APP SHELL
    // --------------------------------------------------------

    event.respondWith(

      caches
        .match(
          event.request
        )

        .then(
          cached => {

            return (
              cached
              ||
              fetch(
                event.request
              )
            );

          }
        )

    );

  }
);
