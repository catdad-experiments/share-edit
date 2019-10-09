/* eslint-disable no-console */

var events = (function () {
  var collection = [];

  return {
    emit: function () {
      collection.push(arguments);
    },
    flush: function (emitter) {
      collection.forEach(function (args) {
        emitter.emit.apply(emitter, args);
      });
    }
  };
}());

window.addEventListener('beforeinstallprompt', function (event) {
  // Stash the event so it can be triggered later.
  window.deferredPrompt = event;
  // Remove the 'hidden' class from the install button container
  console.log('👀', 'ALLOW INSTALL BUTTON TO BE CLICKED');
});

window.addEventListener('appinstalled', function () {
  console.log('👍', 'app installed');
});

if ('serviceWorker' in navigator) {
  console.log('👍', 'navigator.serviceWorker is supported');

  navigator.serviceWorker.register('/service-worker.js', { scope: './' }).then(() => {
    console.log('👍', 'worker registered');
  }).catch(err => {
    console.warn('👎', 'worker errored', err);
  });

  navigator.serviceWorker.addEventListener('message', ev => {
    // TODO no esnext in this file?
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
  var header = document.querySelector('header');
  var headerContainer = header.querySelector('.header-container');
  var prompt = document.querySelector('#prompt');

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

    message.forEach(function (text) {
      var paragraph = document.createElement('p');
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
    ['dynamic import', () => {
      try {
        new Function('import("")');
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
    load('./open.js'),
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

    events.flush(context.events);
    events = context.events;
  }).catch(function catchErr(err) {
    events.emit('error', err);
    onError(err);
  });
};
