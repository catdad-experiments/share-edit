/* eslint-disable no-console */

let events = (function () {
  let collection = [];

  return {
    emit: (...args) => {
      collection.push(args);
    },
    flush: function (emitter) {
      collection.forEach((args) => {
        emitter.emit(...args);
      });
    }
  };
}());

window.addEventListener('beforeinstallprompt', (ev) => {
  // Stash the event so it can be triggered later.
  window.deferredPrompt = ev;
  // Remove the 'hidden' class from the install button container
  console.log('👀', 'ALLOW INSTALL BUTTON TO BE CLICKED');
});

window.addEventListener('appinstalled', () => {
  console.log('👍', 'app installed');
});

if ('serviceWorker' in navigator) {
  console.log('👍', 'navigator.serviceWorker is supported');

  navigator.serviceWorker.register('/service-worker.js', { scope: './' }).then(() => {
    console.log('👍', 'worker registered');
  }).catch(err => {
    console.warn('👎', 'worker errored', err);
  });

  navigator.serviceWorker.addEventListener('message', (ev) => {
    const data = ev.data;

    if (data.action === 'log') {
      return void console.log('worker:', ...data.args);
    }

    if (data.action === 'load-image') {
      console.log('LOAD IMAGE!!');
      events.emit('display-image', { file: data.file });
    }

    console.log('worker message', ev.data);
  });
}

export default () => {
  const headerContainer = document.querySelector('.header-container');
  const prompt = document.querySelector('#prompt');

  function clearPrompt() {
    prompt.classList.add('hide');
    headerContainer.classList.remove('error');
  }

  function showPrompt(message, type) {
    if (typeof message === 'string') {
      message = [message];
    }

    // clean the prompt
    prompt.innerHTML = '';

    message.forEach((text) => {
      const paragraph = document.createElement('p');
      paragraph.appendChild(document.createTextNode(text.toString()));

      prompt.appendChild(paragraph);
    });

    prompt.classList.remove('hide');

    if (type === 'error') {
      headerContainer.classList.add('error');
    } else {
      headerContainer.classList.remove('error');
    }
  }

  function onMissingFeatures(missing) {
    showPrompt([
      'It seems your browser is not supported. The following features are missing:',
      missing
    ], 'error');
  }

  function onError(err) {
    // eslint-disable-next-line no-console
    console.error(err);

    showPrompt([
      'An error occured:',
      err.message || err
    ], 'error');
  }

  // detect missing features in the browser
  var missingFeatures = [
    'navigator.serviceWorker',
    // 'navigator.share',
    'Promise',
    'Map',
    ['dynamic import', () => {
      try {
        new Function('import("").catch(() => {})')();
        return true;
      } catch (err) {
        return false;
      }
    }]
  ].filter(function (name) {
    if (Array.isArray(name)) {
      const [, test] = name;

      return !test();
    }

    return !name.split('.').reduce(function (obj, path) {
      return (obj || {})[path];
    }, window);
  }).map(v => Array.isArray(v) ? v[0] : v);

  if (missingFeatures.length) {
    return onMissingFeatures(missingFeatures.join(', '));
  }

  // ------------------------------------------------
  // we've validated modules... we can use fancy
  // things now
  // ------------------------------------------------

  function load(name) {
    // get around eslint@5 not supporting dynamic import
    // this is ugly, but I also don't care
    return (new Function(`return import('${name}')`))().then(m => m.default);
  }

  // load all the modules from the server directly
  Promise.all([
    load('./event-emitter.js'),
    load('./setup.js'),
    load('./image.js'),
    load('./controls.js'),
    load('./window-size.js'),
  ]).then(([
    eventEmitter,
    ...modules
  ]) => {
    // set up a global event emitter
    const context = { events: eventEmitter() };
    const destroys = modules.map(mod => mod(context));

    context.events.on('error', function (err) {
      onError(err);

      destroys.forEach(d => d());
    });

    context.events.on('warn', function (err) {
      onError(err);

      setTimeout(function () {
        clearPrompt();
      }, 8 * 1000);
    });

    context.events.on('info', (msg) => {
      showPrompt([msg], 'info');

      setTimeout(function () {
        clearPrompt();
      }, 4 * 1000);
    });

    events.flush(context.events);
    events = context.events;
  }).catch(function catchErr(err) {
    events.emit('error', err);
    onError(err);
  });
};
