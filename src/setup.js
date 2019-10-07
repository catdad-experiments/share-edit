/* eslint-disable no-console */

(function (register) {
  const NAME = 'setup';

  register(NAME, function () {
    window.addEventListener('beforeinstallprompt', (event) => {
      console.log('👍', 'beforeinstallprompt', event);
      // Stash the event so it can be triggered later.
      window.deferredPrompt = event;
      // Remove the 'hidden' class from the install button container
      console.log('👀', 'ALLOW INSTALL BUTTON TO BE CLICKED');
    });

    window.addEventListener('appinstalled', (event) => {
      console.log('👍', 'appinstalled', event);
    });

    //butInstall.addEventListener('click', () => {
    //  console.log('👍', 'install clicked');
    //
    //  const promptEvent = window.deferredPrompt;
    //  if (!promptEvent) {
    //    // The deferred prompt isn't available.
    //    return;
    //  }
    //
    //  // Show the install prompt.
    //  promptEvent.prompt();
    //  // Log the result
    //  promptEvent.userChoice.then((result) => {
    //    console.log('👍', 'userChoice', result);
    //    // Reset the deferred prompt variable, since
    //    // prompt() can only be called once.
    //    window.deferredPrompt = null;
    //    // Hide the install button.
    //    butInstall.setAttribute('disabled', true);
    //  });
    //});

    function displayImage(file) {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
      };
      img.src = url;
      document.body.append(img);
    }

    if ('share' in navigator) {
      console.log('👍', 'navigator.share is supported');

      //butShare.addEventListener('click', (e) => {
      //  e.preventDefault();
      //
      //  console.log('👍', 'butShare-clicked', e);
      //
      //  const shareOpts = {
      //    title: 'Jabberwocky',
      //    text: 'Check out this great poem about a Jabberwocky.',
      //    url: 'https://en.wikipedia.org/wiki/Jabberwocky',
      //  };
      //
      //  navigator.share(shareOpts)
      //    .then((e) => {
      //      console.log('👍', 'SHARE SUCCEEDED', e);
      //    })
      //    .catch((err) => {
      //      // TODO do a toast or emit error or whatever?
      //      console.error('👎', 'SHARE FAILED', err);
      //    });
      //});
    }

    // register service worker
    (function () {
      console.log('👍', 'navigator.serviceWorker is supported');

      navigator.serviceWorker.register('/service-worker.js').then(() => {
        console.log('👍', 'worker registered');
      }).catch(err => {
        console.warn('👎', 'worker errored', err);
      });

      navigator.serviceWorker.addEventListener('message', ev => {
        const data = ev.data;

        if (data.action === 'log') {
          return void console.log('worker:', ...data.args);
        }

        if (data.action === 'load-image') {
          console.log('LOAD IMAGE!!');
          displayImage(data.file);
        }

        console.log('worker message', ev.data);
      });

      console.log('post message handler registered');
    })();

    return function destroy() {};
  });
})(window.registerModule);
