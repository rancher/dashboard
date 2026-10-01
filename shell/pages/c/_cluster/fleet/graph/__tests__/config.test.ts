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
    ['app', 'somethingnewfromfleet', 'ready', 'warning', 'success'],
    ['bundle', 'ready', 'somethingnewfromfleet', 'success', 'warning'],
  ])('should degrade an unknown %s state to the unknown colour', (_label, appState, bundleState, appColor, bundleColor) => {
    const out = graphConfig.parseData(createData(appState, bundleState));

    expect(out.stateColor).toBe(appColor);
    expect(out.children[0].stateColor).toBe(bundleColor);
  });
});

describe('fx: graphConfig.infoDetails', () => {
  function createNode(stateColor: string) {
    return {
      id:         'fleet-local/my-app',
      type:       'fleet.cattle.io.helmop',
      stateColor,
      stateLabel: 'Waiting for Dependency',
      errorMsg:   'Waiting for dependent bundle(s) to reach an accepted state',
    };
  }

  function messageRow(stateColor: string) {
    const moreInfo = graphConfig.infoDetails(createNode(stateColor));

    return moreInfo[moreInfo.length - 1];
  }

  it('should report the state message of a failed node as an error', () => {
    const row = messageRow('error');

    expect(row.type).toBe('single-error');
    expect(row.labelKey).toBe('fleet.fdc.error');
  });

  it('should report the state message of a node that has not failed as a message', () => {
    const row = messageRow('info');

    expect(row.type).toBe('single-message');
    expect(row.labelKey).toBe('fleet.fdc.message');
  });
});
