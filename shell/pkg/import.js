const _NAME = require.context('BASE/DIR', true, /\.(vue|js|yaml)$/).keys();

_NAME.forEach((f) => {
  let name = f.substr(2);
  const ext = name.lastIndexOf('.');

  name = name.substr(0, ext);

  $plugin.register('DIR', name, () => REQUIRE(CHUNK`BASE/DIR/${ name }EXT`)); // eslint-disable-line no-undef
});
