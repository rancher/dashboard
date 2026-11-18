import Secret from '@shell/models/secret';
import { MANAGEMENT } from '@shell/config/types';
import { UI_PROJECT_SECRET, UI_PROJECT_SECRET_CLUSTER, UI_PROJECT_SECRET_COPY } from '@shell/config/labels-annotations';
import { STORE } from '@shell/store/store-types';

describe('class Secret (project scoped secret getters)', () => {
  const clusterId = 'c-m-abc123';
  const projectName = 'p-xyz789';

  it('isProjectScoped is true when the PSS labels are present and isRancher is true', () => {
    const secret = new Secret({ metadata: { labels: { [UI_PROJECT_SECRET]: projectName, [UI_PROJECT_SECRET_CLUSTER]: clusterId } } }, { rootGetters: { isRancher: true } });

    expect(secret.isProjectScoped).toBe(true);
    expect(secret.projectScopedProjectName).toBe(projectName);
    expect(secret.projectScopedClusterId).toBe(clusterId);
  });

  it('isProjectScoped is false when isRancher is false', () => {
    const secret = new Secret({ metadata: { labels: { [UI_PROJECT_SECRET]: projectName, [UI_PROJECT_SECRET_CLUSTER]: clusterId } } }, { rootGetters: { isRancher: false } });

    expect(secret.isProjectScoped).toBe(false);
  });

  it('isProjectScoped is false when it is itself a copy created by a PSS', () => {
    const secret = new Secret({
      metadata: {
        labels:      { [UI_PROJECT_SECRET]: projectName, [UI_PROJECT_SECRET_CLUSTER]: clusterId },
        annotations: { [UI_PROJECT_SECRET_COPY]: 'true' }
      }
    }, { rootGetters: { isRancher: true } });

    expect(secret.isProjectScoped).toBe(false);
    expect(secret.isProjectSecretCopy).toBe(true);
    expect(secret.projectSecretCopyProjectName).toBe(projectName);
    expect(secret.projectSecretCopyClusterId).toBe(clusterId);
  });

  it('isProjectScoped is false without the PSS project label', () => {
    const secret = new Secret({ metadata: { labels: {} } }, { rootGetters: { isRancher: true } });

    expect(secret.isProjectScoped).toBe(false);
  });

  it('projectCluster looks up the cluster via the management store when project scoped', () => {
    const cluster = { id: clusterId };
    const byId = jest.fn().mockReturnValue(cluster);
    const secret = new Secret({ metadata: { labels: { [UI_PROJECT_SECRET]: projectName, [UI_PROJECT_SECRET_CLUSTER]: clusterId } } }, { rootGetters: { isRancher: true, [`${ STORE.MANAGEMENT }/byId`]: byId } });

    expect(secret.projectCluster).toBe(cluster);
    expect(byId).toHaveBeenCalledWith(MANAGEMENT.CLUSTER, clusterId);
  });

  it('projectCluster is undefined when the secret is not project scoped', () => {
    const secret = new Secret({ metadata: { labels: {} } }, { rootGetters: { isRancher: true } });

    expect(secret.projectCluster).toBeUndefined();
  });

  it('project resolves via the composite clusterId/projectName id first', () => {
    const project = { id: `${ clusterId }/${ projectName }` };
    const byId = jest.fn().mockImplementation((_type, id) => (id === `${ clusterId }/${ projectName }` ? project : undefined));
    const secret = new Secret({ metadata: { labels: { [UI_PROJECT_SECRET]: projectName, [UI_PROJECT_SECRET_CLUSTER]: clusterId } } }, { rootGetters: { isRancher: true, [`${ STORE.MANAGEMENT }/byId`]: byId } });

    expect(secret.project).toBe(project);
    expect(byId).toHaveBeenCalledWith(MANAGEMENT.PROJECT, `${ clusterId }/${ projectName }`);
  });

  it('project falls back to the plain project name id when the composite id is not found', () => {
    const project = { id: projectName };
    const byId = jest.fn().mockImplementation((_type, id) => (id === projectName ? project : undefined));
    const secret = new Secret({ metadata: { labels: { [UI_PROJECT_SECRET]: projectName, [UI_PROJECT_SECRET_CLUSTER]: clusterId } } }, { rootGetters: { isRancher: true, [`${ STORE.MANAGEMENT }/byId`]: byId } });

    expect(secret.project).toBe(project);
  });

  it('project resolves for a PSS-created copy using the copy labels', () => {
    const project = { id: `${ clusterId }/${ projectName }` };
    const byId = jest.fn().mockReturnValue(project);
    const secret = new Secret({
      metadata: {
        labels:      { [UI_PROJECT_SECRET]: projectName, [UI_PROJECT_SECRET_CLUSTER]: clusterId },
        annotations: { [UI_PROJECT_SECRET_COPY]: 'true' }
      }
    }, { rootGetters: { isRancher: true, [`${ STORE.MANAGEMENT }/byId`]: byId } });

    expect(secret.project).toBe(project);
  });

  it('project is undefined when there is no project name', () => {
    const secret = new Secret({ metadata: { labels: {} } }, { rootGetters: { isRancher: true } });

    expect(secret.project).toBeUndefined();
  });
});
