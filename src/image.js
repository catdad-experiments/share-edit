/* eslint-disable no-console */

(function (register) {
  const NAME = 'image';

  register(NAME, function () {
    const context = this;
    const { events } = context;

    events.on('display-image', ({ file }) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
      };
      img.src = url;
      document.body.append(img);
    });

    return function destroy() {};
  });
})(window.registerModule);
