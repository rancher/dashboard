import { CYPRESS_SAFE_RESOURCE_REVISION } from '../blueprint.utils';

export function applyCustomLinksResponse(customLinkName: string, customLinkUrl:string):object {
  return {
    id:    'ui-custom-links',
    type:  'management.cattle.io.setting',
    links: {
      remove: 'blocked',
      self:   'https://localhost:8005/v1/management.cattle.io.settings/ui-custom-links',
      update: 'https://localhost:8005/v1/management.cattle.io.settings/ui-custom-links',
      view:   'https://localhost:8005/v1/management.cattle.io.settings/ui-custom-links'
    },
    apiVersion: 'management.cattle.io/v3',
    customized: false,
    default:    null,
    kind:       'Setting',
    metadata:   {
      creationTimestamp: '2024-01-30T18:02:04Z',
      fields:            [
        'ui-custom-links',
        '{"version":"v1","defaults":["commercialSupport"],"custom":[{"label":"custom-link122445","value":"https://custom-link122445"}]}'
      ],
      generation:    16,
      managedFields: [
        {
          apiVersion: 'management.cattle.io/v3',
          fieldsType: 'FieldsV1',
          fieldsV1:   {
            'f:customized': {},
            'f:default':    {},
            'f:source':     {},
            'f:value':      {}
          },
          manager:   'rancher',
          operation: 'Update',
          time:      '2024-01-31T19:58:38Z'
        }
      ],
      name:            'ui-custom-links',
      relationships:   null,
      resourceVersion: CYPRESS_SAFE_RESOURCE_REVISION,
      state:           {
        error:         false,
        message:       'Resource is current',
        name:          'active',
        transitioning: false
      },
      uid: 'e799e8ef-7fe3-4c59-a671-d2823cf803c9'
    },
    source: null,
    value:  `{"version":"v1","defaults":["docs","forums","slack","issues","getStarted","commercialSupport"],"custom":[{"label":"${ customLinkName }","value":"${ customLinkUrl }"}]}`
  };
}

export function removeCustomLinksResponse():object {
  return {
    id:    'ui-custom-links',
    type:  'management.cattle.io.setting',
    links: {
      remove: 'blocked',
      self:   'https://localhost:8005/v1/management.cattle.io.settings/ui-custom-links',
      update: 'https://localhost:8005/v1/management.cattle.io.settings/ui-custom-links',
      view:   'https://localhost:8005/v1/management.cattle.io.settings/ui-custom-links'
    },
    apiVersion: 'management.cattle.io/v3',
    customized: false,
    default:    null,
    kind:       'Setting',
    metadata:   {
      creationTimestamp: '2024-01-30T18:02:04Z',
      fields:            [
        'ui-custom-links',
        '{"version":"v1","defaults":["commercialSupport"],"custom":[{"label":"custom-link122445","value":"https://custom-link122445"}]}'
      ],
      generation:    16,
      managedFields: [
        {
          apiVersion: 'management.cattle.io/v3',
          fieldsType: 'FieldsV1',
          fieldsV1:   {
            'f:customized': {},
            'f:default':    {},
            'f:source':     {},
            'f:value':      {}
          },
          manager:   'rancher',
          operation: 'Update',
          time:      '2024-01-31T19:58:38Z'
        }
      ],
      name:            'ui-custom-links',
      relationships:   null,
      resourceVersion: CYPRESS_SAFE_RESOURCE_REVISION,
      state:           {
        error:         false,
        message:       'Resource is current',
        name:          'active',
        transitioning: false
      },
      uid: 'e799e8ef-7fe3-4c59-a671-d2823cf803c9'
    },
    source: null,
    value:  '{"version":"v1","defaults":["docs","forums","slack","issues","getStarted","commercialSupport"],"custom":[]}'
  };
}

export const v1LinksSettingDefaultValue = {
  version:  'v1',
  defaults: ['docs', 'forums', 'slack', 'issues', 'getStarted', 'commercialSupport'],
  custom:   []
};
