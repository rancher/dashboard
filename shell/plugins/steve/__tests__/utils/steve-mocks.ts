import { resourceClassJunkObject } from '@shell/plugins/dashboard-store/__tests__/utils/store-mocks';

const customType = 'asdasd';

export const steveClassJunkObject = {
  ...resourceClassJunkObject,
  type:     customType,
  __clone:  'whatever',
  metadata: {
    clusterName:                'whatever',
    creationTimestamp:          'whatever',
    deletionGracePeriodSeconds: 'whatever',
    deletionTimestamp:          'whatever',
    fields:                     'whatever',
    finalizers:                 'whatever',
    generateName:               'whatever',
    generation:                 'whatever',
    initializers:               'whatever',
    managedFields:              'whatever',
    ownerReferences:            'whatever',
    relationships:              'whatever',
    selfLink:                   'whatever',
    state:                      'whatever',
    uid:                        'whatever',
    resourceVersion:            'whatever',
  },
  spec:       { versions: { schema: 'whatever' } },
  links:      'whatever',
  status:     'whatever',
  stringData: 'whatever',
};
