/* globals EXIF */

// https://magnushoff.com/articles/jpeg-orientation/
const orientations = {
  '1': 0,
  '3': 180,
  '6': 90,
  '8': 270
};

const cropTool = ({ canvas, ctx, renderer, update, mover }) => {
  const { width, height } = canvas;
  const bb = renderer.getBoundingClientRect();
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
  const offset = '-5px';

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

    mover(handle, { move });

    div.appendChild(handle);
  });

  (() => {
    let init;

    mover(div, {
      start: ev => {
        if (init || !ev.clientX || !ev.clientY) {
          return;
        }

        init = { x: ev.clientX, y: ev.clientY };
      },
      move: ev => {
        const { clientX: newX, clientY: newY } = ev;
        const rect = {
          top: Number(div.style.top.slice(0, -2)),
          left: Number(div.style.left.slice(0, -2)),
          bottom: Number(div.style.bottom.slice(0, -2)),
          right: Number(div.style.right.slice(0, -2)),
        };

        const diffX = newX - init.x;
        const diffY = newY - init.y;

        if (diffY > 0 && rect.bottom > 0) {
          const diff = rect.bottom - diffY > 0 ? diffY : 1;
          div.style.top = `${rect.top + diff}px`;
          div.style.bottom = `${rect.bottom - diff}px`;
        } else if (diffY < 0 && rect.top > 0) {
          const diff = rect.top + diffY > 0 ? diffY : -1;
          div.style.top = `${rect.top + diff}px`;
          div.style.bottom = `${rect.bottom - diff}px`;
        }

        if (diffX > 0 && rect.right > 0) {
          const diff = rect.right - diffX > 0 ? diffX : 1;
          div.style.left = `${rect.left + diff}px`;
          div.style.right = `${rect.right - diff}px`;
        } else if (diffX < 0 && rect.left > 0) {
          const diff = rect.left + diffX > 0 ? diffX : -1;
          div.style.left = `${rect.left + diff}px`;
          div.style.right = `${rect.right - diff}px`;
        }

        init = { x: newX, y: newY };
      },
      end: () => {
        init = null;
      }
    });
  })();

  const done = () => {
    const cropBox = div.getBoundingClientRect();
    const imgBox = renderer.getBoundingClientRect();

    const data = ctx.getImageData(
      (cropBox.x - imgBox.x) / imgBox.width * width,
      (cropBox.y - imgBox.y) / imgBox.height * height,
      cropBox.width / imgBox.width * width,
      cropBox.height / imgBox.height * height
    );

    cancel();

    update({ data });
  };

  const cancel = () => {
    div.remove();
  };

  renderer.appendChild(div);

  return { done, cancel };
};

const drawTool = ({ canvas, ctx, renderer, update, mover }) => {
  const bb = renderer.getBoundingClientRect();
  const ratio = canvas.width / bb.width;
  let color = '#000000';

  const stack = [
    ctx.getImageData(0, 0, canvas.width, canvas.height)
  ];

  const div = document.createElement('div');
  Object.assign(div.style, {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  });

  const points = [];
  const point = ev => {
    points.push({
      x: (ev.clientX - bb.left) * ratio,
      y: (ev.clientY - bb.top) * ratio
    });

    if (points.length > 2) {
      points.shift();
    }
  };

  mover(div, {
    start(ev) {
      ctx.beginPath();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.miterLimit = 1;
      ctx.lineWidth = Math.floor(canvas.width / 50);
      ctx.strokeStyle = color;

      point(ev);
      ctx.moveTo(points[0].x, points[0].y);
    },
    move(ev) {
      point(ev);

      const first = points[0];
      const last = points[points.length - 1];

      ctx.quadraticCurveTo(
        last.x,
        last.y,
        (first.x + last.x) / 2,
        (first.y + last.y) / 2
      );
      ctx.stroke();
    },
    end() {
      while (points.length) {
        points.pop();
      }

      ctx.closePath();
      stack.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
    }
  });

  renderer.appendChild(div);

  const done = () => {
    div.remove();
    update({ data: stack.pop() });
  };
  const cancel = () => {
    div.remove();
    update({ data: stack[0] });
  };

  return Object.defineProperties({ done, cancel }, {
    color: {
      configurable: false,
      enumerable: true,
      get: () => color,
      set: val => { color = val; }
    }
  });
};

const getBlob = (canvas) => {
  return new Promise((resolve, reject) => {
    try {
      canvas.toBlob(blob => resolve(blob), 'image/png');
    } catch (e) {
      reject(e);
    }
  });
};

const loadUrl = (img, url) => {
  return new Promise((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = e => reject(e);
    img.src = url;
  });
};

const loadBlob = async (img, blob, afterLoad) => {
  const url = URL.createObjectURL(blob);
  let result;

  try {
    result = await loadUrl(img, url);

    if (afterLoad) {
      result = await afterLoad();
    }
  } catch (e) {
    throw e;
  } finally {
    URL.revokeObjectURL(url);
  }

  return result;
};

const readExif = (img) => {
  return Promise.resolve().then(() => {
    return new Promise(r => EXIF.getData(img, () => r()));
  }).then(() => {
    return EXIF.getAllTags(img);
  });
};

export default ({ events, mover }) => {
  const renderer = document.querySelector('.renderer');
  const hiddenImg = document.querySelector('.hidden-image');
  const canvas = document.querySelector('#canvas');
  const ctx = canvas.getContext('2d');
  let activeTool;
  let width;
  let height;

  const onUpdate = async () => {
    try {
      const blob = await getBlob(canvas);
      await loadBlob(hiddenImg, blob);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Handled Error:', e);
    }
  };

  const onImageData = ({ data }) => {
    canvas.width = width = data.width;
    canvas.height = height = data.height;

    ctx.putImageData(data, 0, 0);
    onUpdate();
  };

  const onFile = async ({ file }) => {
    onCancel();

    const img = new Image();

    try {
      const { Orientation: orientation } = await loadBlob(img, file, async () => await readExif(img));
      const { naturalWidth: w, naturalHeight: h } = img;

      canvas.width = width = w;
      canvas.height = height = h;

      if (orientations[orientation]) {
        const degrees = orientations[orientation];

        if (degrees !== 180) {
          canvas.width = width = h;
          canvas.height = height = w;
        }

        ctx.translate(width/2,height/2);

        ctx.rotate(degrees*Math.PI/180);
        ctx.drawImage(img, -1 * w / 2, -1 * h / 2);
      } else {
        ctx.drawImage(img, 0, 0);
      }

      // reset the canvas context
      ctx.setTransform(1,0,0,1,0,0);

      onUpdate();
    } catch (e) {
      events.emit('error', e);
    }
  };

  const onCrop = () => {
    onCancel();

    activeTool = cropTool({
      mover,
      canvas,
      ctx,
      renderer,
      update: ({ data }) => onImageData({ data })
    });
  };

  const onDraw = ({ color }) => {
    onCancel();

    activeTool = drawTool({
      mover,
      canvas,
      ctx,
      renderer,
      update: ({ data }) => onImageData({ data })
    });
    activeTool.color = color;
  };

  const onColor = ({ color }) => {
    if (activeTool) {
      activeTool.color = color;
    }
  };

  const onCancel = () => {
    if (activeTool) {
      activeTool.cancel();
      activeTool = null;
    }
  };

  const onDone = () => {
    if (activeTool) {
      activeTool.done();
      activeTool = null;
    }
  };

  events.on('display-image', onFile);
  events.on('controls-crop', onCrop);
  events.on('controls-draw', onDraw);
  events.on('controls-color', onColor);
  events.on('controls-done', onDone);
  events.on('controls-cancel', onCancel);

  return function destroy() {
    events.off('display-image', onFile);
    events.off('controls-crop', onCrop);
    events.off('controls-draw', onDraw);
    events.off('controls-color', onColor);
    events.off('controls-done', onDone);
    events.off('controls-cancel', onCancel);
  };
};
