/**
 * Blueprint for branding settings mock responses
 */

import { CYPRESS_SAFE_RESOURCE_REVISION } from '@/cypress/e2e/blueprints/blueprint.utils';

export interface PrivateLabelSetting {
  apiVersion: string;
  kind: string;
  metadata: {
    name: string;
    namespace: string;
    creationTimestamp: string;
    generation: number;
    resourceVersion: number;
    uid: string;
    managedFields?: Array<{
      apiVersion: string;
      fieldsType: string;
      fieldsV1: Record<string, any>;
      manager: string;
      operation: string;
      time: string;
    }>;
    fields?: string[];
  };
  id: string;
  type: string;
  value: string;
  default: string;
  source: string;
  customized: boolean;
  state: {
    error: boolean;
    message: string;
    name: string;
    transitioning: boolean;
  };
  links?: {
    patch: string;
    remove: string;
    self: string;
    update: string;
    view: string;
  };
  _id?: string;
}

export function privateLabelSettingObject(value: string): PrivateLabelSetting {
  return {
    apiVersion: 'management.cattle.io/v3',
    kind:       'Setting',
    metadata:   {
      name:              'ui-pl',
      namespace:         '',
      creationTimestamp: '2025-08-30T11:21:53Z',
      generation:        1,
      resourceVersion:   CYPRESS_SAFE_RESOURCE_REVISION,
      uid:               'e1340h47-d7ec-4822-d12-e1a6d0ba6843',
      managedFields:     [
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
          time:      '2025-08-30T11:21:53Z'
        }
      ],
      fields: ['ui-pl', value]
    },
    id:         'ui-pl',
    type:       'management.cattle.io.setting',
    value,
    default:    'rancher',
    source:     '',
    customized: false,
    state:      {
      error:         false,
      message:       'Resource is current',
      name:          'active',
      transitioning: false
    },
    links: {
      patch:  'blocked',
      remove: 'blocked',
      self:   'https://test.rancher.space/v1/management.cattle.io.settings/ui-pl',
      update: 'https://test.rancher.space/v1/management.cattle.io.settings/ui-pl',
      view:   'https://test.rancher.space/v1/management.cattle.io.settings/ui-pl'
    },
    _id: 'ui-pl'
  };
}

export function createPrivateLabelSettingsResponse(value: string) {
  return {
    statusCode: 200,
    body:       { data: [privateLabelSettingObject(value)] }
  };
}

// Mock response for PUT settings endpoint
export function createPutSettingsResponse(value: string) {
  return {
    statusCode: 200,
    headers:    {
      'cache-control':             'no-cache, no-store, must-revalidate',
      'content-type':              'application/json',
      'strict-transport-security': 'max-age=31536000; includeSubDomains'
    },
    body: privateLabelSettingObject(value)
  };
}
