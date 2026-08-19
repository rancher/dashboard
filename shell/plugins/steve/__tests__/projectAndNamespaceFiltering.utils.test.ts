import projectAndNamespaceFiltering from '@shell/plugins/steve/projectAndNamespaceFiltering.utils';

const param = 'projectsornamespaces';

function makeRootGetters(overrides: {
  inStore?: string;
  showWorkspaceSwitcher?: boolean;
  forceNsFilterV2Enabled?: boolean;
}) {
  const {
    inStore = 'cluster',
    showWorkspaceSwitcher = false,
    forceNsFilterV2Enabled = true,
  } = overrides;

  return {
    currentProduct: {
      inStore,
      showWorkspaceSwitcher,
    },
    // getPerformanceSetting calls rootGetters['management/byId'](type, id) to get the resource
    'management/byId': () => ({ value: JSON.stringify({ forceNsFilterV2: { enabled: forceNsFilterV2Enabled } }) }),
  };
}

describe('projectAndNamespaceFiltering.utils', () => {
  describe('isApplicable', () => {
    it.each([
      {
        desc:     'returns true when namespaced is an array',
        opt:      { namespaced: ['ns://default'] },
        expected: true,
      },
      {
        desc:     'returns true when namespaced is an empty array',
        opt:      { namespaced: [] },
        expected: true,
      },
      {
        desc:     'returns false when namespaced is a string',
        opt:      { namespaced: 'default' as any },
        expected: false,
      },
      {
        desc:     'returns false when namespaced is undefined',
        opt:      {},
        expected: false,
      },
      {
        desc:     'returns false when namespaced is null',
        opt:      { namespaced: null as any },
        expected: false,
      },
    ])('$desc', ({ opt, expected }) => {
      expect(projectAndNamespaceFiltering.isApplicable(opt as any)).toStrictEqual(expected);
    });
  });

  describe('isEnabled', () => {
    it('returns true when all conditions are met', () => {
      const rootGetters = makeRootGetters({
        inStore: 'cluster', showWorkspaceSwitcher: false, forceNsFilterV2Enabled: true
      });

      expect(projectAndNamespaceFiltering.isEnabled(rootGetters)).toStrictEqual(true);
    });

    it('returns false when inStore is not cluster', () => {
      const rootGetters = makeRootGetters({ inStore: 'management' });

      expect(projectAndNamespaceFiltering.isEnabled(rootGetters)).toStrictEqual(false);
    });

    it('returns false when showWorkspaceSwitcher is true', () => {
      const rootGetters = makeRootGetters({ showWorkspaceSwitcher: true });

      expect(projectAndNamespaceFiltering.isEnabled(rootGetters)).toStrictEqual(false);
    });

    it('returns false when forceNsFilterV2 is disabled', () => {
      const rootGetters = makeRootGetters({ forceNsFilterV2Enabled: false });

      expect(projectAndNamespaceFiltering.isEnabled(rootGetters)).toStrictEqual(false);
    });

    it('returns false when currentProduct is undefined', () => {
      const rootGetters = { currentProduct: undefined, 'management/byId': () => undefined };

      expect(projectAndNamespaceFiltering.isEnabled(rootGetters)).toStrictEqual(false);
    });
  });

  describe('createParam', () => {
    it('returns empty string for undefined input', () => {
      expect(projectAndNamespaceFiltering.createParam(undefined)).toStrictEqual('');
    });

    it('returns empty string for empty array', () => {
      expect(projectAndNamespaceFiltering.createParam([])).toStrictEqual('');
    });

    it('builds include param for namespace filter entries', () => {
      const result = projectAndNamespaceFiltering.createParam(['ns://default', 'ns://kube-system']);

      expect(result).toStrictEqual(`${ param }=default,kube-system`);
    });

    it('builds include param for project filter entries', () => {
      const result = projectAndNamespaceFiltering.createParam(['project://p-abc123']);

      expect(result).toStrictEqual(`${ param }=p-abc123`);
    });

    it('builds exclude param for entries starting with dash', () => {
      const result = projectAndNamespaceFiltering.createParam(['-ns://kube-system']);

      expect(result).toStrictEqual(`${ param }!=ns://kube-system`);
    });

    it('builds exclude param for multiple excluded entries', () => {
      const result = projectAndNamespaceFiltering.createParam(['-ns://kube-system', '-ns://cattle-system']);

      expect(result).toStrictEqual(`${ param }!=ns://kube-system,ns://cattle-system`);
    });

    it('include takes priority over exclude when both are present', () => {
      // when both include and exclude arrays are non-empty, exclude result overwrites include
      const result = projectAndNamespaceFiltering.createParam(['ns://default', '-ns://kube-system']);

      expect(result).toStrictEqual(`${ param }!=ns://kube-system`);
    });

    it('strips ns:// prefix from included namespace entries', () => {
      const result = projectAndNamespaceFiltering.createParam(['ns://my-ns']);

      expect(result).toStrictEqual(`${ param }=my-ns`);
    });

    it('strips project:// prefix from included project entries', () => {
      const result = projectAndNamespaceFiltering.createParam(['project://my-project']);

      expect(result).toStrictEqual(`${ param }=my-project`);
    });

    it('handles plain namespace names without prefix', () => {
      const result = projectAndNamespaceFiltering.createParam(['default', 'kube-system']);

      expect(result).toStrictEqual(`${ param }=default,kube-system`);
    });
  });

  describe('checkAndCreateParam', () => {
    it('returns empty string when opt.namespaced is not an array', () => {
      expect(projectAndNamespaceFiltering.checkAndCreateParam({ type: 'pod' } as any)).toStrictEqual('');
    });

    it('returns empty string when opt.namespaced is empty array', () => {
      expect(projectAndNamespaceFiltering.checkAndCreateParam({ namespaced: [] } as any)).toStrictEqual('');
    });

    it('returns param string when opt.namespaced is a non-empty array', () => {
      const result = projectAndNamespaceFiltering.checkAndCreateParam({ namespaced: ['ns://default'] } as any);

      expect(result).toStrictEqual(`${ param }=default`);
    });
  });
});
