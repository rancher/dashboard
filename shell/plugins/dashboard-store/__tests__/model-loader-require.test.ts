import modelLoaderRequire, { setModelLoader } from '@shell/plugins/dashboard-store/model-loader-require';
import { installModels } from '@shell/initialize/install-models';
import * as pod from '@shell/models/pod';
import * as clusterNode from '@shell/models/cluster/node';
import * as managementSchema from '@shell/models/management/schema';
import * as fleetPolicy from '@shell/models/fleet.cattle.io.policy';

describe('fx: modelLoaderRequire', () => {
  afterEach(() => {
    installModels();
  });

  it.each([
    ['pod', pod],
    ['cluster/node', clusterNode],
    ['management/schema', managementSchema],
    ['fleet.cattle.io.policy', fleetPolicy],
  ])('should return the dashboard model for "%s"', (type, model) => {
    expect(modelLoaderRequire(type)).toBe(model);
  });

  it.each([
    'does.not.exist',
    '__tests__/pod.test',
  ])('should return nothing for "%s"', (type) => {
    expect(modelLoaderRequire(type)).toBeUndefined();
  });

  it('should use the lookup it is given', () => {
    const model = { default: class {} };
    const lookup = jest.fn(() => model);

    setModelLoader(lookup);

    expect(modelLoaderRequire('pod')).toBe(model);
    expect(lookup).toHaveBeenCalledWith('pod');
  });
});
