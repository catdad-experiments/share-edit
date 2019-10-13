const cropDiv = (bb) => {
  const color = '#039be5';
  const div = document.createElement('div');
  Object.assign(div.style, {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    outline: `1px solid ${color}`
  });

  const size = '9px';
  const offset = '-4px';

  [{
    className: 'handle-h handle-n',
    style: { top: offset, left: '25%', width: '50%', height: size },
    move: (ev) => {
      if (ev.clientY < bb.top) {
        div.style.top = '0px';
      } else {
        div.style.top = `${ev.clientY - bb.top}px`;
      }
    }
  }, {
    className: 'handle-v handle-e',
    style: { right: offset, top: '25%', width: size, height: '50%' },
    move: (ev) => {
      const right = bb.left + bb.width;
      if (ev.clientX > right) {
        div.style.right = '0px';
      } else {
        div.style.right = `${right - ev.clientX}px`;
      }
    }
  }, {
    className: 'handle-h handle-s',
    style: { bottom: offset, left: '25%', width: '50%', height: size },
    move: (ev) => {
      const bottom = bb.top + bb.height;
      if (ev.clientY > bottom) {
        div.style.bottom = '0px';
      } else {
        div.style.bottom = `${bottom - ev.clientY}px`;
      }
    }
  }, {
    className: 'handle-v handle-w',
    style: { left: offset, top: '25%', width: size, height: '50%' },
    move: (ev) => {
      if (ev.clientX < bb.left) {
        div.style.left = '0px';
      } else {
        div.style.left = `${ev.clientX - bb.left}px`;
      }
    }
  }].forEach(({ className, style, move }) => {
    const handle = document.createElement('div');
    Object.assign(handle.style, {
      position: 'absolute',
      'background-color': color,
      'border-radius': offset.replace('-', '')
    }, style);
    handle.className = className;

    let listening = false;

    const onStart = (ev) => {
      ev.preventDefault();
      ev.stopPropagation();

      if (!listening) {
        listening = true;
        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', onEnd);
      }
    };

    const onMove = (ev) => {
      ev.preventDefault();
      ev.stopPropagation();

      move(ev, handle);
    };

    const onEnd = (ev) => {
      ev.preventDefault();
      ev.stopPropagation();

      listening = false;

      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onEnd);
    };

    handle.addEventListener('touchstart', onStart);
    handle.addEventListener('pointerdown', onStart);

    div.appendChild(handle);
  });

  return div;
};

export default ({ events }) => {
  const main = document.querySelector('.renderer');
  const hiddenImg = document.querySelector('.hidden-image');
  const canvas = document.querySelector('#canvas');
  const ctx = canvas.getContext('2d');
  let cropTool;
  let width;
  let height;

  const onDraw = () => {
    setTimeout(() => {
      hiddenImg.src = canvas.toDataURL('image/png');
    }, 0);
  };

  const onImageData = ({ data }) => {
    canvas.width = width = data.width;
    canvas.height = height = data.height;

    ctx.putImageData(data, 0, 0);
    onDraw();
  };

  const onFile = ({ file }) => {
    if (cropTool) {
      cropTool.remove();
      cropTool = null;
    }

    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);

      const { naturalWidth: w, naturalHeight: h } = img;

      canvas.width = width = w;
      canvas.height = height = h;

      ctx.drawImage(img, 0, 0);
      onDraw();
    };
    img.src = url;
  };

  const onCrop = () => {
    cropTool = cropDiv(main.getBoundingClientRect());
    main.appendChild(cropTool);
  };

  const onDone = () => {
    if (cropTool) {
      const cropBox = cropTool.getBoundingClientRect();
      const imgBox = main.getBoundingClientRect();

      const data = ctx.getImageData(
        (cropBox.x - imgBox.x) / imgBox.width * width,
        (cropBox.y - imgBox.y) / imgBox.height * height,
        cropBox.width / imgBox.width * width,
        cropBox.height / imgBox.height * height
      );

      cropTool.remove();
      cropTool = null;

      onImageData({ data });
    }
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
