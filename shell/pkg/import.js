const _NAME = require.context('BASE/NAME', true, /\.(vue|js|yaml)$/).keys();

_NAME.forEach((f) => {
  let name = f.substr(2);
  const ext = name.lastIndexOf('.');

  name = name.substr(0, ext);

  $plugin.register('NAME', name, () => REQUIRE(CHUNK`BASE/NAME/${ name }EXT`)); // eslint-disable-line no-undef
});
