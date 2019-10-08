/* eslint-disable no-console */

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

if ('serviceWorker' in navigator) {
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

      (function displayImage(file) {
        const img = new Image();
        const url = URL.createObjectURL(file);
        img.onload = () => {
          URL.revokeObjectURL(url);
        };
        img.src = url;
        document.body.append(img);
      })(data.file);
    }

    console.log('worker message', ev.data);
  });
}

/* Framework stuff is below */

window.addEventListener('load', function () {
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
    'Promise'
  ].filter(function (name) {
    return !name.split('.').reduce(function (obj, path) {
      return (obj || {})[path];
    }, window);
  });

  if (missingFeatures.length) {
    return onMissingFeatures(missingFeatures.join(', '));
  }

  // ------------------------------------------------
  // we've validated modules... we can use fancy
  // things now
  // ------------------------------------------------

  // super simple module loader, because I don't want to
  // deal with build for this demo
  function loadScript(name) {
    return new Promise(function (resolve, reject) {
      var script = document.createElement('script');

      script.onload = function () {
        resolve();
      };

      script.onerror = function () {
        reject(new Error(name + ' failed to load'));
      };

      script.src = name;

      document.head.appendChild(script);
    });
  }

  var context = {
    onError: onError
  };

  var modules = {};

  window.registerModule = function (name, module) {
    // this module loader is stupid, it can only work with
    // functions... and just for fun, we'll say that all
    // the functions return promises
    modules[name] = module.bind(context);
  };

  // load all the modules from the server directly
  Promise.all([
    loadScript('src/event-emitter.js'),
    loadScript('src/setup.js'),
  ]).then(function () {
    // set up a global event emitter
    context.events = modules['event-emitter']();

    var setupDestroy = modules['setup']();

    context.events.on('error', function (err) {
      onError(err);

      setupDestroy();
    });

    context.events.on('warn', function (err) {
      onError(err);

      setTimeout(function () {
        clearPrompt();
      }, 8 * 1000);
    });
  }).catch(function catchErr(err) {
    if (context.events) {
      context.events.emit('error', err);
      return onError(err);
    }

    if (modules['event-emitter']) {
      context.events = modules['event-emitter']();
      return catchErr(err);
    }

    onError(err);
  });
});
