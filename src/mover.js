const mover = (elem, { start, move, end } = {}) => {
  let listening = false;

  const onStart = (ev) => {
    ev.preventDefault();
    ev.stopPropagation();

    if (!listening) {
      listening = true;
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onEnd);
    }

    if (start) {
      start(ev);
    }
  };

  const onMove = (ev) => {
    ev.preventDefault();
    ev.stopPropagation();

    if (move) {
      move(ev);
    }
  };

  const onEnd = (ev) => {
    ev.preventDefault();
    ev.stopPropagation();

    listening = false;

    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', onEnd);

    if (end) {
      end(ev);
    }
  };

  elem.addEventListener('touchstart', onStart);
  elem.addEventListener('pointerdown', onStart);
};

export default mover;
