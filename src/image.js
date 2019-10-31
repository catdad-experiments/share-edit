/* globals EXIF */

// https://magnushoff.com/articles/jpeg-orientation/
const orientations = {
  '1': 0,
  '3': 180,
  '6': 90,
  '8': 270
};

const getBlob = (canvas, { mime = 'image/png', quality = 1 } = {}) => {
  return new Promise((resolve, reject) => {
    try {
      canvas.toBlob(blob => resolve(blob), mime, quality);
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

const readExif = (img) => {
  return Promise.resolve().then(() => {
    return new Promise(r => EXIF.getData(img, () => r()));
  }).then(() => {
    return EXIF.getAllTags(img);
  });
};

export default async ({ events, mover, load }) => {
  const [ cropTool, drawTool ] = await Promise.all([
    load('./image-crop.js'),
    load('./image-draw.js')
  ]);

  const renderer = document.querySelector('.renderer');
  const hiddenImg = document.querySelector('.hidden-image');
  const canvas = document.querySelector('#canvas');
  const ctx = canvas.getContext('2d');
  let exportQuality;
  let activeTool;
  let width;
  let height;

  const onUpdate = (() => {
    let url;

    return async () => {
      if (url) {
        URL.revokeObjectURL(url);
        url = null;
      }

      try {
        url = URL.createObjectURL(await getBlob(canvas, exportQuality));
        await loadUrl(hiddenImg, url);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('Handled Error:', e);
      }
    };
  })();

  const onImageData = ({ data }) => {
    canvas.width = width = data.width;
    canvas.height = height = data.height;

    ctx.putImageData(data, 0, 0);
    onUpdate();
  };

  const onRotate = () => {
    const radians = 270*Math.PI/180;
    const tmp = document.createElement('canvas');
    const w = tmp.width = width;
    const h = tmp.height = height;

    const data = ctx.getImageData(0, 0, width, height);
    tmp.getContext('2d').putImageData(data, 0, 0);

    canvas.width = width = h;
    canvas.height = height = w;

    ctx.translate(width/2,height/2);
    ctx.rotate(radians);
    ctx.drawImage(tmp, -1 * w / 2, -1 * h / 2);
    ctx.setTransform(1,0,0,1,0,0);

    if (activeTool) {
      activeTool.rotate();
    }

    onUpdate();
  };

  const onFile = async ({ file, quality }) => {
    exportQuality = quality;
    onCancel();

    const img = new Image();
    const url = URL.createObjectURL(file);

    try {
      await loadUrl(img, url);
      const { Orientation: orientation } = await readExif(img);
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
    } finally {
      URL.revokeObjectURL(url);
    }
  };

  const onQuality = (quality) => {
    exportQuality = quality;
    onUpdate();
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

  const onDraw = ({ color, size }) => {
    onCancel();

    activeTool = drawTool({
      mover,
      canvas,
      ctx,
      renderer,
      update: ({ data }) => onImageData({ data })
    });
    activeTool.color = color;
    activeTool.size = size;
  };

  const onColor = ({ color }) => {
    if (activeTool) {
      activeTool.color = color;
    }
  };

  const onSize = ({ size }) => {
    if (activeTool) {
      activeTool.size = size;
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

  const onUndo = () => {
    if (activeTool) {
      activeTool.undo();
    }
  };

  events.on('file-load', onFile);
  events.on('controls-quality', onQuality);
  events.on('controls-crop', onCrop);
  events.on('controls-rotate', onRotate);
  events.on('controls-draw', onDraw);
  events.on('controls-color', onColor);
  events.on('controls-size', onSize);
  events.on('controls-done', onDone);
  events.on('controls-cancel', onCancel);
  events.on('controls-undo', onUndo);

  return function destroy() {
    events.off('file-load', onFile);
    events.off('controls-quality', onQuality);
    events.off('controls-crop', onCrop);
    events.off('controls-rotate', onRotate);
    events.off('controls-draw', onDraw);
    events.off('controls-color', onColor);
    events.off('controls-size', onSize);
    events.off('controls-done', onDone);
    events.off('controls-cancel', onCancel);
    events.off('controls-undo', onUndo);
  };
};
