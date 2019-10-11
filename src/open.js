export default ({ events }) => {
  const open = document.querySelector('#open');
  const openInput = document.querySelector('#open-input');

  const onOpen = (ev) => {
    events.emit('display-image', { file: ev.target.files[0] });
  };

  const onClick = () => {
    openInput.click();
  };

  open.addEventListener('click', onClick);
  openInput.addEventListener('change', onOpen);

  return function destroy() {
    open.removeEventListener('click', onClick);
    openInput.removeEventListener('change', onOpen);
  };
};
