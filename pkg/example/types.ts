// Note - The product name needs to match the ..
// - the name of the package in the plugin's package.json
// - the name of the folder (if in the dashboard's `pkg` folder)
// - the main store (in this case EXAMPLE_STORE)
export const EXAMPLE_PRODUCT_NAME = 'example';
export const EXAMPLE_STORE = EXAMPLE_PRODUCT_NAME;
export const EXAMPLE_MGMT_STORE = 'example-mgmt-store';

export const EXAMPLE_TYPES = {
  RESOURCE:   'example.resource',
  RESOURCE_2: 'example.resource.2',
  CLUSTER:    'example.cluster'
};

export interface RootExampleResource {
  id: string,
  name: string,
  type: string,
}

export interface ExampleResource extends RootExampleResource{
  state: string,
  description: string,
  age: string,
}

export interface ExampleResource2 extends RootExampleResource{
}

export interface ExampleCluster extends RootExampleResource{
  description: string,
  metadata: {
    state: {
      transitioning: boolean,
      error: boolean,
      message: string,
      name: string,
    },
  }
}
