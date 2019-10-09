/* eslint-disable no-console */

(function (register) {
  const NAME = 'image';

  register(NAME, function () {
    const context = this;
    const { events } = context;

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

    events.on('display-image', onFile);

    return function destroy() {
      events.off('display-image', onFile);
    };
  });
})(window.registerModule);
