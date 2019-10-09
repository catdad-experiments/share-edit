/* eslint-disable no-console */

(function (register) {
  const NAME = 'open';

  register(NAME, function () {
    const context = this;
    const { events } = context;

    const open = document.querySelector('#open');

    const onOpen = (ev) => {
      events.emit('display-image', { file: ev.target.files[0] });
    };

    open.addEventListener('change', onOpen);

    return function destroy() {
      open.removeEventListener('change', onOpen);
    };
  });
})(window.registerModule);
