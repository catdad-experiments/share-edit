const drawTool = ({ canvas, ctx, renderer, update, mover }) => {
  let bb = renderer.getBoundingClientRect();
  let ratio = canvas.width / bb.width;
  // note: these defaults don't actually matter, because they
  // are always set by the controls
  let color = '#000000';
  let size = 0.02;

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
      ctx.lineWidth = Math.floor(canvas.width * size);
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

  const loadData = (data) => {
    ctx.putImageData(data, 0, 0);
  };

  const done = () => {
    div.remove();
    update({ data: stack.pop() });
  };
  const cancel = () => {
    div.remove();
    update({ data: stack[0] });
  };
  const undo = () => {
    if (stack.length > 1) {
      stack.pop();
      loadData(stack.slice(-1)[0]);
    }
  };
  const rotate = () => {
    bb = renderer.getBoundingClientRect();
    ratio = canvas.width / bb.width;
  };

  return Object.defineProperties({ done, cancel, undo, rotate }, {
    color: {
      configurable: false,
      enumerable: true,
      get: () => color,
      set: val => { color = val; }
    },
    size: {
      configurable: false,
      enumerable: true,
      get: () => size,
      set: val => { size = val; }
    }
  });
};

export default drawTool;
