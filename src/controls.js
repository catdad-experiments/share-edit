const find = selector => document.querySelector(selector);
const findAll = selector => [...document.querySelectorAll(selector)];

export default ({ events }) => {
  const palettes = new Map([
    ['general', find('.general-tools')],
    ['crop', find('.crop-tools')]
  ]);

  const showPalette = name => void palettes.forEach((value, key) => {
    if (key === name) {
      value.classList.remove('hide');
    } else {
      value.classList.add('hide');
    }
  });

  const controls = find('.controls');
  const open = find('#open');
  const openInput = find('#open-input');
  const crop = find('#crop');
  const share = find('#share');
  const doneButtons = findAll('.controls .done');

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
    void showPalette('general');
    events.emit('controls-done');
  };
  const onCrop = () => {
    void showPalette('crop');
    events.emit('controls-crop');
  };
  const onShare = () => {
    events.emit('info', 'right-click or long-press to share');
  };

  help.addEventListener('click', onHelp);
  open.addEventListener('click', onClick);
  openInput.addEventListener('change', onOpen);
  crop.addEventListener('click', onCrop);
  share.addEventListener('click', onShare);
  doneButtons.forEach(done => done.addEventListener('click', onDone));

  return () => {
    help.removeEventListener('click', onHelp);
    open.removeEventListener('click', onClick);
    openInput.removeEventListener('change', onOpen);
    crop.removeEventListener('click', onCrop);
    share.removeEventListener('click', onShare);

    doneButtons.forEach(done => done.removeEventListener('click', onDone));
  };
};
