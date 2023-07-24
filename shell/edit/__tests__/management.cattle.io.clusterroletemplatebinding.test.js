import CRTB from '@shell/edit/management.cattle.io.clusterroletemplatebinding.vue';

describe('edit: management.cattle.io.clusterroletemplatebinding', () => {
  it('should save new crtb', async() => {
    const btnCb = jest.fn();
    const bindings = [{
      roleTemplateId: 'test1',
      save:           jest.fn(),
      remove:         jest.fn(),
    }, {
      roleTemplateId: 'test2',
      save:           jest.fn(),
      remove:         jest.fn(),
    }];
    const value = {
      roleTemplateName: 'test1',
      save:             jest.fn(),
      remove:           jest.fn(),
    };
    const localThis = {
      isEdit:  true,
      value,
      bindings,
      $router: { replace: jest.fn() }
    };

    await CRTB.methods.saveOverride.call(localThis, btnCb);

    expect(bindings[1].save).toHaveBeenCalledWith();
    expect(bindings[0].save).not.toHaveBeenCalledWith();
    expect(bindings[0].remove).not.toHaveBeenCalledWith();
    expect(value.save).not.toHaveBeenCalledWith();
    expect(value.remove).not.toHaveBeenCalledWith();
    expect(btnCb).toHaveBeenCalledWith(true);
  });

  it('should remove old crtb', async() => {
    const btnCb = jest.fn();
    const bindings = [{
      roleTemplateId: 'test1',
      save:           jest.fn(),
      remove:         jest.fn(),
    }, {
      roleTemplateId: 'test2',
      save:           jest.fn(),
      remove:         jest.fn(),
    }];
    const value = {
      roleTemplateName: 'test3',
      save:             jest.fn(),
      remove:           jest.fn(),
    };
    const localThis = {
      isEdit:  true,
      value,
      bindings,
      $router: { replace: jest.fn() }
    };

    await CRTB.methods.saveOverride.call(localThis, btnCb);

    expect(bindings[0].save).toHaveBeenCalledWith();
    expect(bindings[1].save).toHaveBeenCalledWith();
    expect(value.remove).toHaveBeenCalledWith();

    expect(btnCb).toHaveBeenCalledWith(true);
  });

  it('should has error message if save or remove error', async() => {
    const error = new Error('error');
    const btnCb = jest.fn();
    const bindings = [{
      roleTemplateId: 'test1',
      save:           jest.fn(() => Promise.reject(error)),
      remove:         jest.fn(),
    }, {
      roleTemplateId: 'test2',
      save:           jest.fn(),
      remove:         jest.fn(),
    }];
    const value = {
      roleTemplateName: 'test3',
      save:             jest.fn(),
      remove:           jest.fn(),
    };
    const localThis = {
      errors:  [],
      isEdit:  true,
      value,
      bindings,
      $router: { replace: jest.fn() }
    };

    await CRTB.methods.saveOverride.call(localThis, btnCb);

    expect(localThis.errors).toContainEqual(error);

    expect(btnCb).toHaveBeenCalledWith(false);
  });
});
