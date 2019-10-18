const find = selector => document.querySelector(selector);
const findAll = selector => [...document.querySelectorAll(selector)];

const between = (min, max, value) => Math.max(Math.min(value, max), min);

const brushSize = (elem, mover) => {
  const renderer = find('.renderer');
  const renderBB = renderer.getBoundingClientRect();
  const minSize = 2;
  const maxSize = 20;
  const hint = document.createElement('div');
  hint.classList.add('brush-hint');

  let offset = 0;
  let bb;
  let size;

  const setElements = () => {
    const ratio = offset / 100;
    size = Math.floor((minSize * (1-ratio)) + (maxSize * ratio)) / 100;

    elem.style.setProperty('--offset', `${Math.floor(offset)}%`);
    hint.style.setProperty('--size', `${Math.floor(renderBB.width * size)}px`);
  };

  const calcOffset = ev => {
    offset = between(0, 100, (ev.clientX - bb.left) / bb.width * 100);
    setElements();
  };

  renderer.appendChild(hint);
  setElements();

  return new Promise(resolve => {
    mover(elem, {
      start(ev) {
        if (!ev.clientX) {
          return;
        }

        bb = elem.getBoundingClientRect();
        calcOffset(ev);
      },
      move(ev) {
        calcOffset(ev);
      },
      end() {
        hint.remove();
        resolve(size);
      }
    });
  });
};

export default ({ events, mover }) => {
  let deferredPrompt;

  const palettes = new Map([
    ['general', find('.general-tools')],
    ['crop', find('.crop-tools')],
    ['draw', find('.draw-tools')],
    ['color', find('.color-tools')],
    ['size', find('.size-tools')],
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
  const colorButtons = findAll('.controls [data-cmd=color]');
  const colorChangers = findAll('.controls [data-color]');
  const sizeButtons = findAll('.controls [data-cmd=size]');

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
    events.emit('controls-draw', { color: '#000000' });
  };
  const onColor = () => {
    showPalette('color');
  };
  const onColorChange = (ev) => {
    showPalette('draw');
    events.emit('controls-color', { color: ev.target.getAttribute('data-color') });
  };
  const onSize = () => {
    showPalette('size');
    brushSize(palettes.get('size').querySelector('.slider'), mover).then(size => {
      showPalette('draw');
      events.emit('controls-size', { size });
    });
  };
  const onShare = () => {
    events.emit('info', 'right-click or long-press to share or save');
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
  colorButtons.forEach(elem => elem.addEventListener('click', onColor));
  colorChangers.forEach(elem => elem.addEventListener('click', onColorChange));
  sizeButtons.forEach(elem => elem.addEventListener('click', onSize));
  doneButtons.forEach(elem => elem.addEventListener('click', onDone));
  cancelButtons.forEach(elem => elem.addEventListener('click', onCancel));

  events.on('can-install', onCanInstall);

  return () => {
    help.removeEventListener('click', onHelp);
    install.removeEventListener('click', onInstall);
    open.removeEventListener('click', onClick);
    openInput.removeEventListener('change', onOpen);
    crop.removeEventListener('click', onCrop);
    draw.removeEventListener('click', onDraw);
    share.removeEventListener('click', onShare);
    colorButtons.forEach(elem => elem.removeEventListener('click', onColor));
    colorChangers.forEach(elem => elem.removeEventListener('click', onColorChange));
    sizeButtons.forEach(elem => elem.removeEventListener('click', onSize));
    doneButtons.forEach(elem => elem.removeEventListener('click', onDone));
    cancelButtons.forEach(elem => elem.removeEventListener('click', onCancel));

    events.off('can-install', onCanInstall);
  };
};
