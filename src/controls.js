const find = selector => document.querySelector(selector);
const findAll = selector => [...document.querySelectorAll(selector)];

export default ({ events }) => {
  let deferredPrompt;

  const palettes = new Map([
    ['general', find('.general-tools')],
    ['crop', find('.crop-tools')],
    ['draw', find('.draw-tools')]
  ]);

  const showPalette = name => void palettes.forEach((value, key) => {
    if (key === name) {
      value.classList.remove('hide');
    } else {
      value.classList.add('hide');
    }
  });

  const controls = find('.controls');
  const install = find('#install');
  const open = find('#open');
  const openInput = find('#open-input');
  const crop = find('#crop');
  const draw = find('#draw');
  const share = find('#share');
  const doneButtons = findAll('.controls [data-cmd=done]');
  const cancelButtons = findAll('.controls [data-cmd=cancel]');

  const help = find('#help');

  const onHelp = () => {
    if (controls.classList.contains('help')) {
      controls.classList.remove('help');
    } else {
      controls.classList.add('help');
    }
  };

  const onOpen = (ev) => {
    if (!ev.target.files[0]) {
      return;
    }

    events.emit('display-image', { file: ev.target.files[0] });
  };

  const onClick = () => void openInput.click();
  const onDone = () => {
    showPalette('general');
    events.emit('controls-done');
  };
  const onCancel = () => {
    showPalette('general');
    events.emit('controls-cancel');
  };
  const onCrop = () => {
    showPalette('crop');
    events.emit('controls-crop');
  };
  const onDraw = () => {
    showPalette('draw');
    events.emit('controls-draw');
  };
  const onShare = () => {
    events.emit('info', 'right-click or long-press to share');
  };
  const onCanInstall = ({ prompt }) => {
    if (deferredPrompt === 0) {
      return;
    }

    deferredPrompt = prompt;
    install.classList.remove('hide');
  };
  const onInstall = () => {
    if (!deferredPrompt) {
      return;
    }

    deferredPrompt.prompt();
    deferredPrompt.userChoice.then(result => {
      deferredPrompt = 0;
      install.classList.add('hide');
      // eslint-disable-next-line no-console
      console.log('install prompt result', result, install.className, install);
    }).catch(e => {
      events.emit('warn', e);
    });
  };

  help.addEventListener('click', onHelp);
  install.addEventListener('click', onInstall);
  open.addEventListener('click', onClick);
  openInput.addEventListener('change', onOpen);
  crop.addEventListener('click', onCrop);
  draw.addEventListener('click', onDraw);
  share.addEventListener('click', onShare);
  doneButtons.forEach(done => done.addEventListener('click', onDone));
  cancelButtons.forEach(done => done.addEventListener('click', onCancel));

  events.on('can-install', onCanInstall);

  return () => {
    help.removeEventListener('click', onHelp);
    install.removeEventListener('click', onInstall);
    open.removeEventListener('click', onClick);
    openInput.removeEventListener('change', onOpen);
    crop.removeEventListener('click', onCrop);
    draw.removeEventListener('click', onDraw);
    share.removeEventListener('click', onShare);
    doneButtons.forEach(done => done.removeEventListener('click', onDone));
    cancelButtons.forEach(done => done.removeEventListener('click', onCancel));

    events.off('can-install', onCanInstall);
  };
};
