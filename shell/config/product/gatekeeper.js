import { DSL } from '@shell/store/type-map';
import { GATEKEEPER, OBJECT_META } from '@shell/config/types';
import { AGE, NAME as NAME_COL, STATE } from '@shell/config/table-headers';
import { findAllConstraints } from '@shell/utils/gatekeeper/util';

export const NAME = 'gatekeeper';
export const CHART_NAME = 'rancher-gatekeeper';

export function init(store) {
  const {
    product,
    basicType,
    groupBy,
    headers,
    mapGroup,
    mapType,
    spoofedType,
    virtualType
  } = DSL(store, NAME);

  product({
    ifHaveGroup: /^(.*\.)?gatekeeper\.sh$/,
    icon:        'gatekeeper',
  });

  mapGroup(/^(.*\.)?gatekeeper\.sh$/, 'OPA Gatekeeper');
  mapType(/^templates\.gatekeeper\.sh\.constrainttemplate$/, 'Template');
  mapType(GATEKEEPER.SPOOFED.CONSTRAINT, 'Constraint');

  basicType([
    'gatekeeper-overview',
    'gatekeeper-constraint',
    'gatekeeper-template',
    GATEKEEPER.SPOOFED.CONSTRAINT,
    GATEKEEPER.CONSTRAINT_TEMPLATE
  ]);

  spoofedType({
    label:             'Constraints',
    type:              GATEKEEPER.SPOOFED.CONSTRAINT,
    collectionMethods: ['POST'],
    schemas:           [
      {
        id:                GATEKEEPER.SPOOFED.CONSTRAINT,
        type:              'schema',
        collectionMethods: ['POST'],
        resourceFields:    {
          metadata: { type: OBJECT_META },
          spec:     { type: 'json' },
          kind:     { type: 'string' }
        }
      }
    ],
    getInstances: async() => {
      const rawConstraints = await findAllConstraints(store);

      return rawConstraints
        .flat()
        .map((constraint) => {
          return {
            id:       constraint.id,
            kind:     constraint.kind,
            type:     GATEKEEPER.SPOOFED.CONSTRAINT,
            spec:     constraint.spec,
            metadata: constraint.metadata,
            status:   constraint.status,
            links:    {
              self: constraint.links.self,
              view: constraint.links.view
            },
            constraint
          };
        });
    }
  });

  virtualType({
    label:      'Overview',
    namespaced: false,
    name:       'gatekeeper-overview',
    route:      { name: 'c-cluster-gatekeeper' },
    exact:      true,
    weight:     3,
    overview:   true,
  });

  headers(GATEKEEPER.CONSTRAINT_TEMPLATE, [
    STATE,
    NAME_COL,
    {
      name:  'Kind',
      label: 'Kind',
      value: 'kind',
      sort:  'kind'
    },
    AGE,
  ]);

  headers(GATEKEEPER.SPOOFED.CONSTRAINT, [
    STATE,
    NAME_COL,
    {
      name:  'Description',
      label: 'Description',
      value: `description`,
      sort:  `description`
    },
    {
      name:  'Violations',
      label: 'Violations',
      value: 'status.totalViolations',
      sort:  'status.totalViolations',
      width: 120
    },
    AGE,
  ]);

  groupBy(GATEKEEPER.SPOOFED.CONSTRAINT, 'kind');
}
