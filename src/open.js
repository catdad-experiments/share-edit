export default ({ events }) => {
  const open = document.querySelector('#open');

  const onOpen = (ev) => {
    events.emit('display-image', { file: ev.target.files[0] });
  };

  open.addEventListener('change', onOpen);

  return function destroy() {
    open.removeEventListener('change', onOpen);
  };
};
