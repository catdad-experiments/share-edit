/* eslint-disable no-console */
/* globals self, Response */

const WORKER = '👷';

const console = (() => {
  const send = (...args) => {
    self.clients.matchAll().then(clients => {
      if (!clients.length) {
        setTimeout(() => {
          send(...args);
        }, 100);
      }

      clients.forEach(client => {
        client.postMessage({
          action: 'log',
          args: args
        });
      });
    });
  };

  return {
    log: send,
    error: send
  };
})();

console.log(WORKER, 'loaded');

const messageMap = new Map();

const nextMessage = str => new Promise(resolve => {
  const resolvers = messageMap.get(str) || [];
  resolvers.push(() => resolve());
  messageMap.set(str, resolvers);
});

const serveShareTarget = event => {
  // Redirect so the user can refresh the page without resending data.
  event.respondWith(Response.redirect(event.request.url));

  event.waitUntil(async function () {
    // nextMessage('share-ready');

    const data = await event.request.formData();
    const client = await self.clients.get(event.resultingClientId);
    const file = data.get('file');
    client.postMessage({ file, action: 'load-image' });
  }());
};

self.addEventListener('message', event => {
  const resolvers = messageMap.get(event.data);
  if (!resolvers) return;
  messageMap.delete(event.data);

  for (let func in resolvers) {
    func();
  }
});

self.addEventListener('install', () => {
  console.log(WORKER, 'install');
  self.skipWaiting();
});

self.addEventListener('activate', () => {
  console.log(WORKER, 'activate');
  return self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  console.log(WORKER, 'fetch', event.request.url);
  const url = new URL(event.request.url);

  const isSameOrigin = url.origin === location.origin;

  const isShareTarget = event.request.method === 'POST' && url.searchParams.has('share-target');

  if (isSameOrigin && isShareTarget) {
    console.log(WORKER, 'handling share target request');
    return void serveShareTarget(event);
  }
});
