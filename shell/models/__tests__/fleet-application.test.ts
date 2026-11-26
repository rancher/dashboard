import FleetApplication from '@shell/models/fleet-application.js';

describe('class FleetApplication', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('applicationType', () => {
    it('should return the kind property', () => {
      const instance = new FleetApplication({ kind: 'GitRepo' });

      expect(instance.applicationType).toStrictEqual('GitRepo');
    });
  });

  describe('targetClusters', () => {
    function createFleetApplication(targets: any[] | undefined, clusters: any[], workspaceId = 'fleet-default', groups: any[] = []) {
      const workspace = {
        id:            workspaceId,
        clusters,
        clusterGroups: groups,
      };

      jest.spyOn(FleetApplication.prototype, '$getters', 'get').mockReturnValue({
        byId: () => workspace,
        all:  () => [],
      });

      return new FleetApplication({
        metadata: { namespace: workspaceId },
        spec:     { targets },
      });
    }

    it.each([
      [
        'metadata.name',
        [{ clusterName: 'c-m-abc123' }],
        [{
          id: 'fleet-default/c-m-abc123', metadata: { name: 'c-m-abc123' }, nameDisplay: 'my-cluster'
        }],
        [{
          id: 'fleet-default/c-m-abc123', metadata: { name: 'c-m-abc123' }, nameDisplay: 'my-cluster'
        }],
      ],
      [
        'nameDisplay when metadata.name does not match',
        [{ clusterName: 'my-display-name' }],
        [{
          id: 'fleet-default/c-m-abc123', metadata: { name: 'c-m-abc123' }, nameDisplay: 'my-display-name'
        }],
        [{
          id: 'fleet-default/c-m-abc123', metadata: { name: 'c-m-abc123' }, nameDisplay: 'my-display-name'
        }],
      ],
    ])('should find cluster by %s', (_label, targets, clusters, expected) => {
      const app = createFleetApplication(targets, clusters);

      expect(app.targetClusters).toStrictEqual(expected);
    });

    it('should prefer metadata.name match over nameDisplay match', () => {
      const clusters = [
        {
          id:          'fleet-default/exact-match',
          metadata:    { name: 'exact-match' },
          nameDisplay: 'display-a',
        },
        {
          id:          'fleet-default/c-m-other',
          metadata:    { name: 'c-m-other' },
          nameDisplay: 'exact-match',
        }
      ];

      const app = createFleetApplication([{ clusterName: 'exact-match' }], clusters);

      expect(app.targetClusters).toStrictEqual([clusters[0]]);
    });

    it('should return empty array when no cluster matches by name or nameDisplay', () => {
      const clusters = [
        {
          id:          'fleet-default/c-m-abc123',
          metadata:    { name: 'c-m-abc123' },
          nameDisplay: 'my-cluster',
        }
      ];

      const app = createFleetApplication([{ clusterName: 'non-existent' }], clusters);

      expect(app.targetClusters).toStrictEqual([]);
    });

    it('should handle multiple targets with mixed name and nameDisplay matches', () => {
      const clusters = [
        {
          id:          'fleet-default/c-m-abc123',
          metadata:    { name: 'c-m-abc123' },
          nameDisplay: 'cluster-alpha',
        },
        {
          id:          'fleet-default/c-m-def456',
          metadata:    { name: 'c-m-def456' },
          nameDisplay: 'cluster-beta',
        }
      ];

      const targets = [
        { clusterName: 'c-m-abc123' },
        { clusterName: 'cluster-beta' },
      ];

      const app = createFleetApplication(targets, clusters);

      expect(app.targetClusters).toStrictEqual([clusters[0], clusters[1]]);
    });

    it('should return empty array when targets is empty', () => {
      const app = createFleetApplication([], []);

      expect(app.targetClusters).toStrictEqual([]);
    });

    it('should return empty array when targets is undefined', () => {
      const app = createFleetApplication(undefined, []);

      expect(app.targetClusters).toStrictEqual([]);
    });

    it('should return empty array when workspace has no clusters', () => {
      const app = createFleetApplication([{ clusterName: 'any-name' }], []);

      expect(app.targetClusters).toStrictEqual([]);
    });

    it('should handle cluster with undefined nameDisplay gracefully', () => {
      const clusters = [
        {
          id:          'fleet-default/c-m-abc123',
          metadata:    { name: 'c-m-abc123' },
          nameDisplay: undefined,
        }
      ];

      const app = createFleetApplication([{ clusterName: 'c-m-abc123' }], clusters);

      expect(app.targetClusters).toStrictEqual([clusters[0]]);
    });

    it('should return local cluster targets when workspace is fleet-local', () => {
      const localTargetClusters = [
        {
          id:          'fleet-local/local',
          metadata:    { name: 'local' },
          nameDisplay: 'local',
        }
      ];

      const groups = [
        {
          id:             'fleet-local/default',
          targetClusters: localTargetClusters,
        }
      ];

      const app = createFleetApplication([], [], 'fleet-local', groups);

      expect(app.targetClusters).toStrictEqual(localTargetClusters);
    });

    it('should return empty array when workspace is fleet-local and default group is missing', () => {
      const app = createFleetApplication([], [], 'fleet-local', []);

      expect(app.targetClusters).toStrictEqual([]);
    });
  });

  describe('state', () => {
    // Fleet sets `status.display.error` for every state that is not Ready, and Steve passes it through
    // as `metadata.state.error`, so it cannot decide the colour on its own.
    function createFleetApplication(stateName: string) {
      return new FleetApplication({
        kind:     'HelmOp',
        metadata: { namespace: 'fleet-local', state: { name: stateName, error: true } },
        spec:     {},
      });
    }

    it.each([
      ['waitingfordependency', 'Waiting for Dependency', 'text-info'],
      ['waitapplied', 'Wait Applied', 'text-info'],
      ['modified', 'Modified', 'text-warning'],
    ])('should colour %s from the state, not from the error flag', (stateName, display, color) => {
      const app = createFleetApplication(stateName);

      expect(app.stateDisplay).toBe(display);
      expect(app.stateColor).toBe(color);
    });

    it('should still colour a state the UI classifies as an error as an error', () => {
      const app = createFleetApplication('errapplied');

      expect(app.stateColor).toBe('text-error');
    });

    it('should still describe a state whose error flag was dropped', () => {
      const app = new FleetApplication({
        kind:     'HelmOp',
        metadata: {
          namespace: 'fleet-local',
          state:     {
            name: 'waitingfordependency', error: true, message: 'waiting for dependent bundle(s)'
          }
        },
        spec: {},
      });

      expect(app.stateDescription).toBe('Waiting for dependent bundle(s)');
    });
  });

  describe('validateNameAndWorkspace', () => {
    const placeholderSpec = { repo: 'https://example.com/placeholder' };
    const policyDenial = 'gitrepos.fleet.cattle.io "my-repo" is forbidden: ValidatingAdmissionPolicy \'repo-boundary\' with binding \'repo-boundary\' denied request: GitRepos must use a repository under https://github.com/rancher/';

    function apiError(status: number, message: string) {
      return { _status: status, message };
    }

    function createApp(dispatch = jest.fn()) {
      const t = jest.fn((key: string) => key);
      const app = new FleetApplication({
        type:     'fleet.cattle.io.gitrepo',
        metadata: { name: 'my-repo', namespace: 'fleet-default' },
        spec:     {},
      }, { dispatch, rootGetters: { 'i18n/t': t } });

      return {
        app, dispatch, t
      };
    }

    it('should send a dry-run with the name, the workspace and the placeholder spec', async() => {
      const { app, dispatch } = createApp();
      const dryRunCreate = jest.spyOn(app, 'dryRunCreate').mockResolvedValue({});

      await expect(app.validateNameAndWorkspace(placeholderSpec)).resolves.toBeUndefined();

      expect(dryRunCreate).toHaveBeenCalledWith({
        type:     'fleet.cattle.io.gitrepo',
        metadata: { name: 'my-repo', namespace: 'fleet-default' },
        spec:     placeholderSpec,
      });
      expect(dispatch).not.toHaveBeenCalled();
    });

    it.each([
      ['the name is invalid', apiError(422, 'GitRepo.fleet.cattle.io "AAA" is invalid: metadata.name: Invalid value: "AAA": a lowercase RFC 1123 subdomain must consist of lower case alphanumeric characters')],
      ['the name is too long', apiError(422, 'GitRepo.fleet.cattle.io "aaa" is invalid: metadata.name: Invalid value: "aaa": must be no more than 253 characters')],
      ['the workspace does not exist', apiError(404, 'namespaces "gone" not found')],
      ['the user cannot create in the workspace', apiError(403, 'gitrepos.fleet.cattle.io is forbidden: User "u-abc" cannot create resource "gitrepos" in API group "fleet.cattle.io" in the namespace "fleet-default"')],
      ['the workspace is being deleted', apiError(403, 'gitrepos.fleet.cattle.io "my-repo" is forbidden: unable to create new content in namespace fleet-default because it is being terminated')],
    ])('should stop when %s', async(_label, error) => {
      const { app, dispatch } = createApp();

      jest.spyOn(app, 'dryRunCreate').mockRejectedValue(error);

      await expect(app.validateNameAndWorkspace(placeholderSpec)).rejects.toStrictEqual(error);
      expect(dispatch).not.toHaveBeenCalled();
    });

    it.each([
      ['a ValidatingAdmissionPolicy denies the spec', apiError(422, policyDenial)],
      ['a ValidatingAdmissionPolicy with reason Forbidden denies the spec', apiError(403, policyDenial)],
      ['an admission webhook denies the spec', apiError(400, 'admission webhook "validate.kyverno.svc-fail" denied the request: the repository is not allowed')],
      ['an admission webhook forbids the spec', apiError(403, 'admission webhook "validation.gatekeeper.sh" denied the request: [repo-allowed] the repository is not allowed')],
      ['the spec fails the schema', apiError(422, 'GitRepo.fleet.cattle.io "my-repo" is invalid: spec.repo: Required value')],
      ['the server fails', apiError(500, 'Internal error occurred')],
      ['the request fails without a response', new Error('Network Error')],
    ])('should go on when %s and the name is free', async(_label, error) => {
      const { app, dispatch } = createApp(jest.fn().mockRejectedValue(apiError(404, 'gitrepos.fleet.cattle.io "my-repo" not found')));

      jest.spyOn(app, 'dryRunCreate').mockRejectedValue(error);

      await expect(app.validateNameAndWorkspace(placeholderSpec)).resolves.toBeUndefined();
      expect(dispatch).toHaveBeenCalledWith('find', {
        type: 'fleet.cattle.io.gitrepo',
        id:   'fleet-default/my-repo',
        opt:  { force: true, transient: true },
      });
    });

    it('should say the name is used when the API says it already exists', async() => {
      const { app, dispatch, t } = createApp();

      jest.spyOn(app, 'dryRunCreate').mockRejectedValue(apiError(409, 'gitrepos.fleet.cattle.io "my-repo" already exists'));

      await expect(app.validateNameAndWorkspace(placeholderSpec)).rejects.toStrictEqual('fleet.application.nameTaken');
      expect(t).toHaveBeenCalledWith('fleet.application.nameTaken', { name: 'my-repo', workspace: 'fleet-default' });
      expect(dispatch).not.toHaveBeenCalled();
    });

    it('should stop when an admission policy denies the spec and the name is taken', async() => {
      const { app, t } = createApp(jest.fn().mockResolvedValue({ id: 'fleet-default/my-repo' }));

      jest.spyOn(app, 'dryRunCreate').mockRejectedValue(apiError(422, policyDenial));

      await expect(app.validateNameAndWorkspace(placeholderSpec)).rejects.toStrictEqual('fleet.application.nameTaken');
      expect(t).toHaveBeenCalledWith('fleet.application.nameTaken', { name: 'my-repo', workspace: 'fleet-default' });
    });

    it('should go on when an admission policy denies the spec and the name cannot be looked up', async() => {
      const { app } = createApp(jest.fn().mockRejectedValue(apiError(403, 'gitrepos.fleet.cattle.io "my-repo" is forbidden: User "u-abc" cannot get resource "gitrepos"')));

      jest.spyOn(app, 'dryRunCreate').mockRejectedValue(apiError(422, policyDenial));

      await expect(app.validateNameAndWorkspace(placeholderSpec)).resolves.toBeUndefined();
    });
  });
});
