const cropTool = ({ canvas, ctx, renderer, update, mover }) => {
  let { width, height } = canvas;
  let bb = renderer.getBoundingClientRect();
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

  const undo = () => {};

  const rotate = () => {
    ({ width, height } = canvas);
    bb = renderer.getBoundingClientRect();
  };

  renderer.appendChild(div);

  return { done, cancel, undo, rotate };
};

export default cropTool;
