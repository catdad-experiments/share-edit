const elem = (type = 'div', className = '') => {
  const el = document.createElement(type);

  if (className) {
    el.className = className;
  }

  return el;
};

export default (...items) => {
  return new Promise((resolve) => {
    const container = elem('div', 'menu');
    const menu = elem('ul', 'limit');

    container.appendChild(menu);

    items.forEach(item => {
      const el = elem('li');
      el.appendChild(document.createTextNode(item.text));

      el.onclick = () => {
        resolve(item);
        container.remove();
      };

      menu.appendChild(el);
    });

    document.body.appendChild(container);
  });
};
