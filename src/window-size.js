export default ({ events }) => {
  // vh style hack for smartphone address bar issues
  // https://css-tricks.com/the-trick-to-viewport-units-on-mobile/
  let height = 0;

  const setVh = () => {
    const temp = window.innerHeight;

    if (height !== temp) {
      height = temp;
      document.documentElement.style.setProperty('--vh', `${height * 0.01}px`);
    }
  };

  const onResize = () => {
    setVh();
    events.emit('window-resize');
  };

  setVh();

  window.addEventListener('resize', onResize);

  return () => {
    window.removeEventListener('resize', onResize);
  };
};
