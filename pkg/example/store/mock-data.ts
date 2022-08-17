import {
  ExampleCluster, ExampleResource, ExampleResource2, EXAMPLE_PRODUCT_NAME, EXAMPLE_TYPES
} from '../types';
import { STATES_ENUM } from '@shell/plugins/dashboard-store/resource-class';

const createMockRandomAge = () => {
  const date = new Date().getTime() - (Math.floor(Math.random() * 10) * 1000 * 60 * 60 * 60);

  return new Date(date).toDateString();
};

let mockResourceId = 0;

const createMockExampleResource = ():ExampleResource[] => [{
  id:          (++mockResourceId).toString(),
  name:        'Resource 1',
  type:        EXAMPLE_TYPES.RESOURCE,
  state:       STATES_ENUM.ACTIVE,
  age:         createMockRandomAge(),
  description: 'Description for resource 1'

}, {
  id:          (++mockResourceId).toString(),
  name:        'Resource 2',
  type:        EXAMPLE_TYPES.RESOURCE,
  state:       STATES_ENUM.IN_PROGRESS,
  age:         createMockRandomAge(),
  description: 'Description for resource 2'
}];

const createMockExampleResource2 = ():ExampleResource2[] => [{
  id:          (++mockResourceId).toString(),
  name:        'Resource 1',
  type:        EXAMPLE_TYPES.RESOURCE_2,

}, {
  id:          (++mockResourceId).toString(),
  name:        'Resource 2',
  type:        EXAMPLE_TYPES.RESOURCE_2,
}];

const makeMockGetRequest = (opt: any) => {
  const index = opt.url.replace(`/api/v1/${ EXAMPLE_TYPES.RESOURCE }/`, '');
  const all = opt.url.endsWith(EXAMPLE_TYPES.RESOURCE) ? createMockExampleResource() : createMockExampleResource2();

  const res: { status: number, data: any} = {
    status: 200,
    data:   index?.length === 1 ? all.find(r => r.id === index) : all
  };

  return res;
};

export const exampleStoreMockRequest = (ctx: any, opt: any) => {
  const { dispatch, getters } = ctx;

  switch (opt.method) {
  case 'post':
    // Hack to allow create/update of example resource
    return {
      data: {
        ...opt.data,
        id:  (++mockResourceId).toString(),
        age: createMockRandomAge(),
      }
    };
  case 'delete':
    // Normally sockets updates will remove this entry from the store, but in this mocked world we need to do it manually
    dispatch('remove', getters['byId'](EXAMPLE_TYPES.RESOURCE, opt.url));

    return { data: null };
  default: {
    const res = makeMockGetRequest(opt);

    if (Array.isArray(res.data)) {
      // `findAll` expects `{data.data}`
      res.data = { data: res.data };
    } else {
      // `find` action turns this into `{data: data}`
    }

    return res;
  }
  }
};

export const exampleMgmtStoreMockRequest = ():{ data: ExampleCluster[]} => ({
  data: [{
    id:          '1',
    name:        'Cluster 1',
    type:        EXAMPLE_TYPES.CLUSTER,
    description: 'This is the description for cluster 1',
    metadata:    {
      state:         {
        name:          STATES_ENUM.ACTIVE,
        transitioning: false,
        error:         false,
        message:       ''
      }
    }
  }, {
    id:          '2',
    name:        'Cluster 2',
    type:        EXAMPLE_TYPES.CLUSTER,
    description: 'This is the description for cluster 2',
    metadata:    {
      state:       {
        name:          STATES_ENUM.ERROR,
        transitioning: false,
        error:         true,
        message:       `This is a description for this resource's state`
      }
    }
  }]
});

export const exampleStoreSchemas = () => [{
  product:           EXAMPLE_PRODUCT_NAME,
  id:                 EXAMPLE_TYPES.RESOURCE,
  type:              'schema',
  links:             { collection: `/api/v1/${ EXAMPLE_TYPES.RESOURCE }` },
  collectionMethods: ['get', 'post'],
  resourceFields:    { },
  attributes:        { }
}, {
  product:           EXAMPLE_PRODUCT_NAME,
  id:                 EXAMPLE_TYPES.RESOURCE_2,
  type:              'schema',
  links:             { collection: `/api/v1/${ EXAMPLE_TYPES.RESOURCE_2 }` },
  collectionMethods: ['get', 'post'],
  resourceFields:    { },
  attributes:        { }
}];
