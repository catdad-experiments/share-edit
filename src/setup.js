/* eslint-disable no-console */

export default () => {
  const butInstall = document.querySelector('#install');

  butInstall.addEventListener('click', () => {
    console.log('👍', 'install clicked');

    const promptEvent = window.deferredPrompt;
    if (!promptEvent) {
      // The deferred prompt isn't available.
      console.log('no install prompt');
      return;
    }

    // Show the install prompt.
    promptEvent.prompt();
    // Log the result
    promptEvent.userChoice.then((result) => {
      console.log('👍', 'userChoice', result);
      // Reset the deferred prompt variable, since
      // prompt() can only be called once.
      window.deferredPrompt = null;
      // Hide the install button.
      butInstall.setAttribute('disabled', true);
    });
  });

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

  return function destroy() {};
};
