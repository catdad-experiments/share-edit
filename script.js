/* eslint-disable no-console */

const divResult = document.getElementById('result');
const butInstall = document.getElementById('butInstall');
const butShare = document.getElementById('butShare');

window.addEventListener('beforeinstallprompt', (event) => {
  console.log('👍', 'beforeinstallprompt', event);
  // Stash the event so it can be triggered later.
  window.deferredPrompt = event;
  // Remove the 'hidden' class from the install button container
  butInstall.removeAttribute('disabled');
});

window.addEventListener('appinstalled', (event) => {
  console.log('👍', 'appinstalled', event);
});

butInstall.addEventListener('click', () => {
  console.log('👍', 'install clicked');

  const promptEvent = window.deferredPrompt;
  if (!promptEvent) {
    // The deferred prompt isn't available.
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

  butShare.removeAttribute('disabled');

  butShare.addEventListener('click', (e) => {
    console.log('👍', 'butShare-clicked', e);

    e.preventDefault();
    const shareOpts = {
      title: 'Jabberwocky',
      text: 'Check out this great poem about a Jabberwocky.',
      url: 'https://en.wikipedia.org/wiki/Jabberwocky',
    };

    navigator.share(shareOpts)
      .then((e) => {
        const msg = 'navigator.share succeeded.';
        divResult.textContent = msg;
        console.log('👍', msg, e);
      })
      .catch((err) => {
        const msg = 'navigator.share failed';
        divResult.textContent = `${msg}\n${JSON.stringify(err)}`;
        console.error('👎', msg, err);
      });
  });
} else  {
  console.warn('👎', 'navigator.share is not supported');

  const divNotSup = document.getElementById('shareNotSupported');
  divNotSup.classList.toggle('hidden', false);
}

/* Only register a service worker if it's supported */
if ('serviceWorker' in navigator) {
  console.log('👍', 'navigator.serviceWorker is supported');

  navigator.serviceWorker.register('/service-worker.js').then(() => {
    console.log('👍', 'worker registered');
  }).catch(err => {
    console.warn('👎', 'worker errored', err);
  });

  navigator.serviceWorker.onmessage = ev => {
    const data = ev.data;

    if (data.action === 'log') {
      return void console.log('worker:', ...data.args);
    }

    if (data.action === 'load-image') {
      console.log('LOAD IMAGE!!');
    }

    console.log('worker message', ev.data);
  };

  console.log('post message handler registered');
}

console.log('url', window.location.href);
