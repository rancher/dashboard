const _NAME = require.context('BASE/NAME', true, /\.(vue|js|yaml)$/).keys();

_NAME.forEach((f) => {
  let name = f.substr(2);
  const ext = name.lastIndexOf('.');

  name = name.substr(0, ext);
  $extension.register('NAME', name, `() => REQUIRE(CHUNKBASE/NAME/${ name })`); // eslint-disable-line no-undef
});
