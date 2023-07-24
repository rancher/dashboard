import ClusterCrtb from '../management.cattle.io.clusterroletemplatebinding';

describe('model: management.cattle.io.clusterroletemplatebinding', () => {
  it('should send remove crtb request', () => {
    const dispatch = jest.fn();
    const id = 'id:test';
    const body = {
      url:    `/v3/clusterRoleTemplateBindings/${ id?.replace('/', ':') }`,
      method: 'delete',
    };
    const crtb = new ClusterCrtb({ id }, { dispatch });

    crtb.remove();

    expect(dispatch.mock.calls[0][0]).toStrictEqual('rancher/request');
    expect(dispatch.mock.calls[0][1]).toStrictEqual(body);
    expect(dispatch.mock.calls[0][2]).toStrictEqual({ root: true });
  });

  it('should return true for prop canCustomEdit', () => {
    const hasCustomEdit = jest.fn(() => true);
    const crtb = new ClusterCrtb({
      type: 'type',
      id:   'id'
    }, { rootGetters: { 'type-map/hasCustomEdit': hasCustomEdit } });

    expect(crtb.canCustomEdit).toBe(true);
    expect(hasCustomEdit).toHaveBeenCalledWith('type', 'id');
  });

  it('should return false for prop canCustomEdit', () => {
    const hasCustomEdit = jest.fn(() => false);
    const crtb = new ClusterCrtb({
      type: 'type',
      id:   'id'
    }, { rootGetters: { 'type-map/hasCustomEdit': hasCustomEdit } });

    expect(crtb.canCustomEdit).toBe(false);
    expect(hasCustomEdit).toHaveBeenCalledWith('type', 'id');
  });
});
