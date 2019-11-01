const find = selector => document.querySelector(selector);
const findAll = selector => [...document.querySelectorAll(selector)];

const between = (min, max, value) => Math.max(Math.min(value, max), min);

const brushSize = (elem, mover, size) => {
  const renderer = find('.renderer');
  const renderBB = renderer.getBoundingClientRect();
  const minSize = 0.01;
  const maxSize = 0.2;
  const hint = document.createElement('div');
  hint.classList.add('brush-hint');

  let ratio = (size - minSize) / (maxSize - minSize);
  let bb;

  const display = () => {
    elem.style.setProperty('--offset', `${Math.floor(ratio * 100)}%`);
    hint.style.setProperty('--size', `${Math.floor(renderBB.width * size)}px`);
  };

  const calculate = ev => {
    ratio = between(0, 1, (ev.clientX - bb.left) / bb.width);
    size = (minSize * (1-ratio)) + (maxSize * ratio);
  };

  renderer.appendChild(hint);
  display();

  return new Promise(resolve => {
    mover(elem, {
      start(ev) {
        if (!ev.clientX) {
          return;
        }

        bb = elem.getBoundingClientRect();
        calculate(ev);
        display();
      },
      move(ev) {
        calculate(ev);
        display();
      },
      end() {
        hint.remove();
        resolve(size);
      }
    });
  });
};

export default ({ events, menu, mover, storage }) => {
  let DEFAULT_BRUSH_SIZE = storage.get('brush-size') || 0.02;
  let DEFAULT_BRUSH_COLOR = storage.get('brush-color') || '#000000';
  let DEFAULT_EXPORT_QUALITY = storage.get('export-quality') || { mime: 'image/png', quality: 1 };
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
  const quality = find('#quality');
  const doneButtons = findAll('.controls [data-cmd=done]');
  const cancelButtons = findAll('.controls [data-cmd=cancel]');
  const colorButtons = findAll('.controls [data-cmd=color]');
  const colorChangers = findAll('.controls [data-color]');
  const sizeButtons = findAll('.controls [data-cmd=size]');
  const undoButtons = findAll('.controls [data-cmd=undo]');
  const rotateButtons = findAll('.controls [data-cmd=rotate]');

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

    events.emit('file-load', {
      file: ev.target.files[0],
      quality: DEFAULT_EXPORT_QUALITY
    });
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
  const onUndo = () => {
    events.emit('controls-undo');
  };
  const onRotate = () => {
    events.emit('controls-rotate');
  };
  const onCrop = () => {
    showPalette('crop');
    events.emit('controls-crop');
  };
  const onDraw = () => {
    showPalette('draw');
    events.emit('controls-draw', {
      color: DEFAULT_BRUSH_COLOR,
      size: DEFAULT_BRUSH_SIZE
    });
  };
  const onColor = () => {
    showPalette('color');
  };
  const onColorChange = (ev) => {
    showPalette('draw');
    DEFAULT_BRUSH_COLOR = ev.target.getAttribute('data-color');
    storage.set('brush-color', DEFAULT_BRUSH_COLOR);
    events.emit('controls-color', { color: DEFAULT_BRUSH_COLOR });
  };
  const onSize = () => {
    showPalette('size');
    brushSize(
      palettes.get('size').querySelector('.slider'),
      mover,
      DEFAULT_BRUSH_SIZE
    ).then(size => {
      showPalette('draw');
      DEFAULT_BRUSH_SIZE = size;
      storage.set('brush-size', DEFAULT_BRUSH_SIZE);
      events.emit('controls-size', { size });
    });
  };
  const onQuality = () => {
    const choices = [
      { mime: 'image/png', quality: 1, text: 'PNG at 100%' },
      { mime: 'image/jpeg', quality: 1, text: 'JPG at 100%' },
      { mime: 'image/jpeg', quality: 0.92, text: 'JPG at 92%' },
      { mime: 'image/jpeg', quality: 0.8, text: 'JPG at 80%' },
    ].map(choice => {
      if (choice.mime === DEFAULT_EXPORT_QUALITY.mime && choice.quality === DEFAULT_EXPORT_QUALITY.quality) {
        return Object.assign({ icon: 'check' }, choice);
      }

      return choice;
    });

    menu(...choices).then(({ mime, quality }) => {
      DEFAULT_EXPORT_QUALITY = { mime, quality };
      storage.set('export-quality', DEFAULT_EXPORT_QUALITY);
      events.emit('controls-quality', DEFAULT_EXPORT_QUALITY);
    }).catch(err => {
      events.emit('warn', err);
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

  const onFileShare = ({ file }) => void events.emit('file-load', {
    file,
    quality: DEFAULT_EXPORT_QUALITY
  });

  help.addEventListener('click', onHelp);
  install.addEventListener('click', onInstall);
  open.addEventListener('click', onClick);
  openInput.addEventListener('change', onOpen);
  crop.addEventListener('click', onCrop);
  draw.addEventListener('click', onDraw);
  quality.addEventListener('click', onQuality);
  share.addEventListener('click', onShare);
  rotateButtons.forEach(elem => elem.addEventListener('click', onRotate));
  colorButtons.forEach(elem => elem.addEventListener('click', onColor));
  colorChangers.forEach(elem => elem.addEventListener('click', onColorChange));
  sizeButtons.forEach(elem => elem.addEventListener('click', onSize));
  doneButtons.forEach(elem => elem.addEventListener('click', onDone));
  cancelButtons.forEach(elem => elem.addEventListener('click', onCancel));
  undoButtons.forEach(elem => elem.addEventListener('click', onUndo));

  events.on('can-install', onCanInstall);
  events.on('file-share', onFileShare);

  return () => {
    help.removeEventListener('click', onHelp);
    install.removeEventListener('click', onInstall);
    open.removeEventListener('click', onClick);
    openInput.removeEventListener('change', onOpen);
    crop.removeEventListener('click', onCrop);
    draw.removeEventListener('click', onDraw);
    quality.removeEventListener('click', onQuality);
    share.removeEventListener('click', onShare);
    rotateButtons.forEach(elem => elem.removeEventListener('click', onRotate));
    colorButtons.forEach(elem => elem.removeEventListener('click', onColor));
    colorChangers.forEach(elem => elem.removeEventListener('click', onColorChange));
    sizeButtons.forEach(elem => elem.removeEventListener('click', onSize));
    doneButtons.forEach(elem => elem.removeEventListener('click', onDone));
    cancelButtons.forEach(elem => elem.removeEventListener('click', onCancel));
    undoButtons.forEach(elem => elem.removeEventListener('click', onUndo));

    events.off('can-install', onCanInstall);
    events.off('file-share', onFileShare);
  };
};
