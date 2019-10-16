/* globals Toastify */

const colors = {
  green: 'linear-gradient(to right, #00b09b, #96c93d)',
  red: 'linear-gradient(to right, #b00000, #c93d7e)',
  yellow: 'linear-gradient(to right, #ffa35f, #ffc371)',
  blue: 'linear-gradient(to right, #5477f5, #73a5ff)'
};

const toast = (color) => {
  return (...args) => {
    Toastify({
      text: args.join(' '),
      gravity: 'top',
      position: 'center',
      backgroundColor: color,
      duration: -1
    }).showToast();
  };
};

const api = {
  log: toast(colors.green),
  error: toast(colors.red),
  warn: toast(colors.yellow),
  info: toast(colors.blue)
};

export default api;
