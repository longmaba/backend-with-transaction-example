const pad = (n, width, z) => {
  z = z || '0';
  n = n + '';
  return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
};

module.exports = () => () => {
  let random = Math.floor(Math.random() * 9999);
  return pad(random, 4);
};
