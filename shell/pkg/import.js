// `.ts` is included so extensions can author models (and other auto-imported types) in TypeScript.
// The library build (generateTypeImport) already picks these up; without `ts` here they silently
// fail to register in dev, falling back to generic models.
const _NAME = require.context('BASE/DIR', true, /\.(vue|js|ts|yaml)$/).keys();

_NAME.forEach((f) => {
  let name = f.substr(2);
  const ext = name.lastIndexOf('.');

  name = name.substr(0, ext);

  $extension.register('DIR', name, () => REQUIRE(CHUNK`BASE/DIR/${ name }EXT`)); // eslint-disable-line no-undef
});
