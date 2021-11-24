const _NAME = require.context('BASE/NAME', true, /\.(vue|js)$/).keys();

_NAME.forEach((f) => {
  let name = f.substr(2);
  const ext = name.lastIndexOf('.');

  name = name.substr(0, ext);
  $extension.registerDynamics({ NAME: { [name]: () => import(/* webpackChunkName: "NAME" */`BASE/NAME/${ name }`) } }); // eslint-disable-line no-undef
});
