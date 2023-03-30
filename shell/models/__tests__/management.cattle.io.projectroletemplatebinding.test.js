import ClusterCrtb from '../management.cattle.io.projectroletemplatebinding';

describe('model: management.cattle.io.projectroletemplatebinding', () => {
  it('should send remove crtb request', () => {
    const dispatch = jest.fn();
    const id = 'id:test';
    const body = {
      url:    `/v3/projectRoleTemplateBindings/${ id?.replace('/', ':') }`,
      method: 'delete',
    };
    const crtb = new ClusterCrtb({ id }, { dispatch });

    crtb.remove();

    expect(dispatch.mock.calls[0][0]).toStrictEqual('rancher/request');
    expect(dispatch.mock.calls[0][1]).toStrictEqual(body);
    expect(dispatch.mock.calls[0][2]).toStrictEqual({ root: true });
  });
});
