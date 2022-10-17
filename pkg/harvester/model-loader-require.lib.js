// Import all shell models. We could try to be smart here and only pull in the one's that harvester uses... but there's a lot across a
// number of stores
export default function modelLoaderRequire(type) {
  return require(`@shell/models/${ type }`);
}
