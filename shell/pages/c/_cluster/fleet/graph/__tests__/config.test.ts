import { graphConfig } from '@shell/pages/c/_cluster/fleet/graph/config';

describe('fx: graphConfig.parseData', () => {
  function createData(appState: string, bundleState: string) {
    return {
      id:           'fleet-local/my-app',
      type:         'fleet.cattle.io.helmop',
      state:        appState,
      stateDisplay: appState,
      bundles:      [{
        id: 'fleet-local/my-bundle', type: 'fleet.cattle.io.bundle', state: bundleState, stateDisplay: bundleState
      }],
      bundleDeployments: [],
      clustersList:      [],
    };
  }

  it('should colour an app and its bundles from their state', () => {
    const out = graphConfig.parseData(createData('errapplied', 'errapplied'));

    expect(out.stateColor).toBe('error');
    expect(out.children[0].stateColor).toBe('error');
  });

  it('should colour a bundle held back by a dependency without treating it as an error', () => {
    const out = graphConfig.parseData(createData('waitingfordependency', 'waitingfordependency'));

    expect(out.stateColor).toBe('info');
    expect(out.children[0].stateColor).toBe('info');
  });

  // A state the backend adds that the UI does not know yet must degrade, not break the whole chart.
  it.each([
    ['app', 'somethingnewfromfleet', 'ready'],
    ['bundle', 'ready', 'somethingnewfromfleet'],
  ])('should not throw on an unknown %s state', (_label, appState, bundleState) => {
    expect(() => graphConfig.parseData(createData(appState, bundleState))).not.toThrow();
  });
});
