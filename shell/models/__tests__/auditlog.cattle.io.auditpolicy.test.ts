import AuditPolicy from '@shell/models/auditlog.cattle.io.auditpolicy';

describe('auditPolicy Model', () => {
  let mockDispatch: jest.Mock;
  let mockT: jest.Mock;
  let auditPolicy: any;

  beforeEach(() => {
    mockDispatch = jest.fn();
    mockT = jest.fn();

    const mockResource = {
      id:       'test-policy',
      spec:     { enabled: false },
      metadata: { name: 'test-policy' }
    };

    auditPolicy = new AuditPolicy(mockResource, {
      dispatch:    mockDispatch,
      rootGetters: { 'i18n/t': mockT },
      getters:     { schemaFor: () => ({ linkFor: jest.fn() }) }
    });
  });

  describe('enable method', () => {
    it('should call enableOrDisable with "enable"', () => {
      const spy = jest.spyOn(auditPolicy, 'enableOrDisable').mockImplementation();

      auditPolicy.enable();

      expect(spy).toHaveBeenCalledWith('enable');
    });
  });

  describe('disable method', () => {
    it('should call enableOrDisable with "disable"', () => {
      const spy = jest.spyOn(auditPolicy, 'enableOrDisable').mockImplementation();

      auditPolicy.disable();

      expect(spy).toHaveBeenCalledWith('disable');
    });
  });

  describe('enableOrDisable method', () => {
    let mockClone: any;

    beforeEach(() => {
      mockClone = {
        spec: { enabled: false },
        save: jest.fn()
      };

      mockDispatch.mockImplementation((action: string) => {
        if (action === 'rancher/clone') {
          return Promise.resolve(mockClone);
        }

        return Promise.resolve();
      });
    });

    it('should enable policy when flag is "enable"', async() => {
      mockClone.save.mockResolvedValue({});

      await auditPolicy.enableOrDisable('enable');

      expect(mockClone.spec.enabled).toBe(true);
      expect(mockClone.save).toHaveBeenCalledWith();
    });

    it('should disable policy when flag is "disable"', async() => {
      mockClone.save.mockResolvedValue({});

      await auditPolicy.enableOrDisable('disable');

      expect(mockClone.spec.enabled).toBe(false);
      expect(mockClone.save).toHaveBeenCalledWith();
    });

    it('should handle save errors and show growl notification', async() => {
      const saveError = new Error('Save failed');

      mockClone.save.mockRejectedValue(saveError);
      mockT.mockReturnValue('Error when enabling - test-policy');

      await auditPolicy.enableOrDisable('enable');

      expect(mockDispatch).toHaveBeenCalledWith('growl/fromError', {
        title:   'Error when enabling - test-policy',
        err:     saveError,
        timeout: 5000
      }, { root: true });
    });

    it('should call translation with correct parameters', async() => {
      const saveError = new Error('Save failed');

      mockClone.save.mockRejectedValue(saveError);

      await auditPolicy.enableOrDisable('enable');

      expect(mockT).toHaveBeenCalledWith('auditPolicy.error.enableOrDisable', {
        flag: 'enable',
        id:   'test-policy'
      });
    });

    it('should dispatch rancher/clone with correct parameters', async() => {
      mockClone.save.mockResolvedValue({});

      await auditPolicy.enableOrDisable('enable');

      expect(mockDispatch).toHaveBeenCalledWith('rancher/clone', { resource: auditPolicy }, { root: true });
    });
  });
});
