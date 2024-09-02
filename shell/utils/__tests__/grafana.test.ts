import { getClusterPrefix } from '@shell/utils/grafana';

describe('fx: getClusterPrefix', () => {
  it('old monitoring version, downstream cluster', () => {
    const prefix = getClusterPrefix('101.0.0+up19.0.3', 'c-abcd');

    expect(prefix).toStrictEqual('/k8s/clusters/c-abcd');
  });
  it('old monitoring version, local cluster', () => {
    const prefix = getClusterPrefix('101.0.0+up19.0.3', 'local');

    expect(prefix).toStrictEqual('');
  });
  it('new monitoring version, downstream cluster', () => {
    const prefix = getClusterPrefix('102.0.0+up40.1.2', 'c-abcd');

    expect(prefix).toStrictEqual('/k8s/clusters/c-abcd');
  });
  it('new monitoring version, local cluster', () => {
    const prefix = getClusterPrefix('102.0.0+up40.1.2', 'local');

    expect(prefix).toStrictEqual('/k8s/clusters/local');
  });
  it('future monitoring version, downstream cluster', () => {
    const prefix = getClusterPrefix('103.0.0+up41.0.0', 'c-abcd');

    expect(prefix).toStrictEqual('/k8s/clusters/c-abcd');
  });
  it('future monitoring version, local cluster', () => {
    const prefix = getClusterPrefix('103.0.0+up41.0.0', 'local');

    expect(prefix).toStrictEqual('');
  });
  it('empty monitoring version, downstream cluster', () => {
    const prefix = getClusterPrefix('', 'c-abcd');

    expect(prefix).toStrictEqual('/k8s/clusters/c-abcd');
  });
  it('empty monitoring version, local cluster', () => {
    const prefix = getClusterPrefix('', 'local');

    expect(prefix).toStrictEqual('');
  });
});
