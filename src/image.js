/* eslint-disable no-console */

(function (register) {
  const NAME = 'image';

  register(NAME, function () {
    const context = this;
    const { events } = context;

    const canvas = document.querySelector('#canvas');
    const container = canvas.parentElement;
    const ctx = canvas.getContext('2d');

    const onResize = () => {
      const bb = container.getBoundingClientRect();
      console.log(bb);

      canvas.style.height = `${bb.height}px`;
      canvas.style.width = `${bb.width}px`;
      canvas.width = bb.width;
      canvas.height = bb.height;
    };

    onResize();

    const onFile = ({ file }) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);

        ctx.drawImage(img, 0, 0);
      };
      img.src = url;
    };

    events.on('display-image', onFile);
    window.addEventListener('resize', onResize);

    return function destroy() {
      events.off('display-image', onFile);
      window.removeEventListener('resize', onResize);
    };
  });
})(window.registerModule);
