import { DSL } from '@/store/type-map';
import { RIO } from '@/config/types';
import {
  STATE,
  NAME as NAME_COL, NAMESPACE_NAME,
  AGE, WEIGHT, SCALE,
  ENDPOINTS,
  MATCHES, DESTINATION,
  TARGET, TARGET_KIND,
} from '@/config/table-headers';

export const NAME = 'rio';
export const CHART_NAME = 'rio';

export function init(store) {
  const {
    product,
    basicType,
    mapGroup,
    headers,
    // virtualType,
  } = DSL(store, NAME);

  product({
    ifHaveGroup: 'rio.cattle.io',
    icon:        'rio',
  });

  basicType([
    RIO.SERVICE,
    RIO.ROUTER,
    RIO.PUBLIC_DOMAIN,
    RIO.EXTERNAL_SERVICE,
    RIO.STACK
  ]);

  mapGroup(/^(.*\.)?(rio|gitwatcher)\.cattle\.io$/, 'Rio');

  headers(RIO.EXTERNAL_SERVICE, [STATE, NAMESPACE_NAME, TARGET_KIND, TARGET, AGE]);
  headers(RIO.PUBLIC_DOMAIN, [
    STATE,
    NAME_COL,
    TARGET_KIND,
    TARGET,
    {
      name:   'secret-name',
      label:  'Secret',
      value:  'status.assignedSecretName',
      sort:   ['secretName', 'targetApp', 'targetVersion'],
    },
    AGE,
  ]);

  headers(RIO.SERVICE, [
    STATE,
    NAME,
    ENDPOINTS,
    WEIGHT,
    SCALE,
    {
      name:  'connections',
      label: 'Conn.',
      value: 'connections',
      sort:  ['connections'],
      align: 'right',
      width: 60,
    },
    {
      name:  'p95',
      label: '95%',
      value: 'p95Display',
      sort:  ['p95'],
      align: 'right',
      width: 75,
    },
    {
      name:  'network',
      label: 'Network',
      value: 'networkDisplay',
      sort:  ['networkBytes'],
      align: 'right',
      width: 75,
    },
    AGE,
  ]);

  headers(RIO.STACK, [
    STATE,
    NAMESPACE_NAME,
    {
      name:  'repo',
      label: 'Repo',
      value: 'repoDisplay',
      sort:  'repoDisplay',
    },
    {
      name:  'branch',
      label: 'Branch',
      value: 'branchDisplay',
      sort:  'branchDisplay',
    },
    AGE,
  ]);

  headers(RIO.ROUTER, [
    STATE,
    NAMESPACE_NAME,
    MATCHES,
    DESTINATION,
    AGE
  ]);
}
