import { mount } from '@vue/test-utils';
import Banzai from '@shell/edit/logging.banzaicloud.io.output/index.vue';

const outputSchema = {
  id:    'logging.banzaicloud.io.output',
  type:  'schema',
  links: {
    collection: 'https://localhost:8005/v1/logging.banzaicloud.io.outputs',
    self:       'https://localhost:8005/v1/schemas/logging.banzaicloud.io.output'
  },
  pluralName:      'logging.banzaicloud.io.outputs',
  resourceMethods: [
    'GET',
    'DELETE',
    'PUT',
    'PATCH'
  ],
  _resourceFields:        null,
  requiresResourceFields: true,
  collectionMethods:      [
    'GET',
    'POST'
  ],
  attributes: {
    columns: [
      {
        name:  'Active',
        field: '.status.active',
        type:  'boolean'
      },
      {
        name:  'Problems',
        field: '.status.problemsCount',
        type:  'integer'
      }
    ],
    group:      'logging.banzaicloud.io',
    kind:       'Output',
    namespaced: true,
    resource:   'outputs',
    verbs:      [
      'delete',
      'deletecollection',
      'get',
      'list',
      'patch',
      'create',
      'update',
      'watch'
    ],
    version: 'v1beta1'
  },
  _id:                   'logging.banzaicloud.io.output',
  _group:                'logging.banzaicloud.io',
  store:                 'cluster',
  _schemaDefinitionsIds: {
    self:   'io.banzaicloud.logging.v1beta1.Output',
    others: [
      'io.banzaicloud.logging.v1beta1.Output.spec',
      'io.banzaicloud.logging.v1beta1.Output.spec.awsElasticsearch.buffer'
    ]
  },
  schemaDefinitions: {
    'io.banzaicloud.logging.v1beta1.Output.spec.awsElasticsearch.buffer': {
      resourceFields: {
        chunk_full_threshold:           { type: 'string' },
        chunk_limit_records:            { type: 'int' },
        chunk_limit_size:               { type: 'string' },
        compress:                       { type: 'string' },
        delayed_commit_timeout:         { type: 'string' },
        disable_chunk_backup:           { type: 'boolean' },
        disabled:                       { type: 'boolean' },
        flush_at_shutdown:              { type: 'boolean' },
        flush_interval:                 { type: 'string' },
        flush_mode:                     { type: 'string' },
        flush_thread_burst_interval:    { type: 'string' },
        flush_thread_count:             { type: 'int' },
        flush_thread_interval:          { type: 'string' },
        overflow_action:                { type: 'string' },
        path:                           { type: 'string' },
        queue_limit_length:             { type: 'int' },
        queued_chunks_limit_size:       { type: 'int' },
        retry_exponential_backoff_base: { type: 'string' },
        retry_forever:                  { type: 'boolean' },
        retry_max_interval:             { type: 'string' },
        retry_max_times:                { type: 'int' },
        retry_randomize:                { type: 'boolean' },
        retry_secondary_threshold:      { type: 'string' },
        retry_timeout:                  { type: 'string' },
        retry_type:                     { type: 'string' },
        retry_wait:                     { type: 'string' },
        tags:                           { type: 'string' },
        timekey:                        { type: 'string' },
        timekey_use_utc:                { type: 'boolean' },
        timekey_wait:                   { type: 'string' },
        timekey_zone:                   { type: 'string' },
        total_limit_size:               { type: 'string' },
        type:                           { type: 'string' }
      },
      type:        'io.banzaicloud.logging.v1beta1.Output.spec.awsElasticsearch.buffer',
      description: ''
    }
  },
  fetchResourceFields: async() => jest.fn()
};

describe('view: logging.banzaicloud.io.output', () => {
  it.each([
    ['http://localhost:3100', []],
    ['not a proper URL', ['logging.loki.urlInvalid']],
  ])('should validate Loki URL on save', (url, expectation) => {
    const wrapper = mount(Banzai, {
      data:  () => ({ selectedProvider: 'loki' }),
      props: {
        value: {
          save: jest.fn(),
          spec: { loki: { url } }
        }
      },
      global: {
        mocks: {
          $fetchState: { pending: false },
          $store:      {
            dispatch: jest.fn(),
            getters:  {
              currentStore:              () => 'current_store',
              'management/schemaFor':    jest.fn(),
              'current_store/all':       jest.fn(),
              'current_store/schemaFor': jest.fn(),
              'cluster/all':             jest.fn(),
              'type-map/isSpoofed':      jest.fn(),
              'i18n/t':                  jest.fn().mockImplementation((key: string) => key),
              namespaces:                () => ({}),
            }
          },
          $route: {
            name:  'whatever',
            query: { AS: '' }
          },
          $router: { replace: jest.fn() },
        },
      }
    });
    const fakeDone = jest.fn();

    (wrapper.vm as any).saveSettings(fakeDone);

    expect((wrapper.vm as any).errors).toStrictEqual(expectation);
  });

  it('should load the default YAML data for output buffer config (from schema) in a CREATE scenario', async() => {
    const wrapper = mount(Banzai, {
      data:  () => ({ selectedProvider: 'awsElasticsearch' }),
      props: {
        value: {
          save: jest.fn(),
          spec: {}
        }
      },
      global: {
        mocks: {
          $fetchState: { pending: false },
          $store:      {
            dispatch(arg: any) {
              if (arg === 'cluster/find') {
                return outputSchema;
              }

              return jest.fn();
            },
            getters: {
              currentStore:              () => 'current_store',
              'management/schemaFor':    jest.fn(),
              'current_store/all':       jest.fn(),
              'current_store/schemaFor': jest.fn(),
              'cluster/all':             () => [outputSchema],
              'cluster/byId':            () => outputSchema,
              'type-map/isSpoofed':      jest.fn(),
              'i18n/t':                  jest.fn().mockImplementation((key: string) => key),
              namespaces:                () => ({}),
            }
          },
          $route: {
            name:  'whatever',
            query: { AS: '' }
          },
          $router: { replace: jest.fn() },
        },
      }
    });

    // call async fetch - needed for test assertion
    await Banzai.fetch.call(wrapper.vm);

    const yaml = `#chunk_limit_records: int
#chunk_limit_size: string
#compress: string
#delayed_commit_timeout: string
#disable_chunk_backup: boolean
#disabled: boolean
#flush_at_shutdown: boolean
#flush_interval: string
#flush_mode: string
#flush_thread_burst_interval: string
#flush_thread_count: int
#flush_thread_interval: string
#overflow_action: string
#path: string
#queue_limit_length: int
#queued_chunks_limit_size: int
#retry_exponential_backoff_base: string
#retry_forever: boolean
#retry_max_interval: string
#retry_max_times: int
#retry_randomize: boolean
#retry_secondary_threshold: string
#retry_timeout: string
#retry_type: string
#retry_wait: string
#tags: string
#timekey: string
#timekey_use_utc: boolean
#timekey_wait: string
#timekey_zone: string
#total_limit_size: string
#type: string`;

    expect(wrapper.vm.initialBufferYaml).toStrictEqual(yaml);
    expect(wrapper.vm.bufferYaml).toStrictEqual(yaml);
  });

  it('should load current output buffer config in an EDIT scenario', async() => {
    const wrapper = mount(Banzai, {
      data:  () => ({ selectedProvider: 'awsElasticsearch' }),
      props: {
        value: {
          save: jest.fn(),
          spec: { awsElasticsearch: { buffer: '#chunk_limit_records: int' } }
        }
      },
      global: {
        mocks: {
          $fetchState: { pending: false },
          $store:      {
            dispatch(arg: any) {
              if (arg === 'cluster/find') {
                return outputSchema;
              }

              return jest.fn();
            },
            getters: {
              currentStore:              () => 'current_store',
              'management/schemaFor':    jest.fn(),
              'current_store/all':       jest.fn(),
              'current_store/schemaFor': jest.fn(),
              'cluster/all':             jest.fn(),
              'cluster/byId':            () => outputSchema,
              'type-map/isSpoofed':      jest.fn(),
              'i18n/t':                  jest.fn().mockImplementation((key: string) => key),
              namespaces:                () => ({}),
            }
          },
          $route: {
            name:  'whatever',
            query: { AS: '' }
          },
          $router: { replace: jest.fn() },
        },
      }
    });

    // call async fetch - needed for test assertion
    await Banzai.fetch.call(wrapper.vm);

    expect(wrapper.vm.initialBufferYaml).toContain('#chunk_limit_records: int');
    expect(wrapper.vm.bufferYaml).toContain('#chunk_limit_records: int');
  });
});
