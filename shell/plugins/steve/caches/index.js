import SchemaCache from '@shell/plugins/steve/caches/schema';
import ResourceCache from '@shell/plugins/steve/caches/resource-class';
import CountsCache from '@shell/plugins/steve/caches/count';
import DeploymentCache from '@shell/plugins/steve/caches/apps.deployment';
import PodCache from '@shell/plugins/steve/caches/pod';

export default {
  schema:            SchemaCache,
  resourceCache:     ResourceCache,
  count:             CountsCache,
  pod:               PodCache,
  'apps.deployment': DeploymentCache
};
