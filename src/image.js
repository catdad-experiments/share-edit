const cropDiv = () => {
  const div = document.createElement('div');
  Object.assign(div.style, {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    outline: '1px solid pink'
  });

  [{
    className: 'handle-n',
    style: { top: '-4px', left: '25%', width: '50%', height: '8px' },
    move: (bb) => {

    }
  }, {
    className: 'handle-e',
    style: { right: '-4px', top: '25%', width: '8px', height: '50%' },
    move: () => {}
  }, {
    className: 'handle-s',
    style: { bottom: '-4px', left: '25%', width: '50%', height: '8px' },
    move: () => {}
  }, {
    className: 'handle-w',
    style: { left: '-4px', top: '25%', width: '8px', height: '50%' },
    move: () => {}
  }].forEach(({ className, style, move }) => {
    const handle = document.createElement('div');
    Object.assign(handle.style, {
      'background-color': 'pink',
      position: 'absolute',
    }, style);
    handle.className = className;

    div.appendChild(handle);
  });

  return div;
};

export default ({ events }) => {
  const main = document.querySelector('.renderer');
  const canvas = document.querySelector('#canvas');
  const ctx = canvas.getContext('2d');

  const onFile = ({ file }) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);

      const { naturalWidth: w, naturalHeight: h } = img;

      canvas.width = w;
      canvas.height = h;

      ctx.drawImage(img, 0, 0);
    };
    img.src = url;
  };

  const onCrop = () => {
    const div = cropDiv();
    main.appendChild(div);

    console.log('CROP ✂');
  };

  const onDone = () => {
    console.log('DONE ✔');
  };

  events.on('display-image', onFile);
  events.on('controls-crop', onCrop);
  events.on('controls-done', onDone);

  return function destroy() {
    events.off('display-image', onFile);
    events.off('controls-crop', onCrop);
    events.off('controls-done', onDone);
  };
};
