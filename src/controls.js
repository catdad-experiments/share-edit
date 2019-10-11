const find = selector => document.querySelector(selector);

export default () => {
  const controls = find('.controls');
  const help = find('#help');

  const onHelp = () => {
    if (controls.classList.contains('help')) {
      controls.classList.remove('help');
    } else {
      controls.classList.add('help');
    }
  };

  help.addEventListener('click', onHelp);

  return () => {
    help.removeEventListener('click', onHelp);
  };
};
