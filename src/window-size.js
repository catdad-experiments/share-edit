export default () => {
  // vh style hack for smartphone address bar issues
  // https://css-tricks.com/the-trick-to-viewport-units-on-mobile/
  let height = 0;

  const onResize = () => {
    const temp = window.innerHeight;

    if (height !== temp) {
      height = temp;
      document.documentElement.style.setProperty('--vh', `${height * 0.01}px`);
    }
  };

  onResize();

  window.addEventListener('resize', onResize);

  return () => {
    window.removeEventListener('resize', onResize);
  };
};
