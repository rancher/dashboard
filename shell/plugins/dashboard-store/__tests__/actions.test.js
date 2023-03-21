import actions from '@shell/plugins/dashboard-store/actions';

describe('dashboard-store: actions', () => {
  const growlWarning = jest.fn(t => t);
  const ctx = {
    getters: {
      typeRegistered:  type => type,
      keyFieldForType: type => type,
      byId:            type => type,
    },
    dispatch: growlWarning,
    commit(key, params) {
      const commit = {
        load:         params => params,
        registerType: params => params,
      };

      return commit[key](params);
    },
  };

  describe('load', () => {
    it('only show others warning', () => {
      const data = {
        _headers: { warning: ' 299 - unknown field "type", 299 - would violate PodSecurity warning, 299 - others warning' },
        type:     'pod',
        metadata: { name: 'test' },
        pod:      'test',
      };

      actions.load(ctx, { data, existing: false });

      const messages = ['others warning'];

      expect(growlWarning).toHaveBeenCalledWith('growl/warning', {
        title:   'Pod: test',
        message: decodeURIComponent(messages.join().replace(/\+/g, '%20')),
        timeout: 0
      }, { root: true });
    });

    it('only show others warning2', () => {
      const data = {
        _headers: { warning: '299 - unknown field "type", 299 - would violate PodSecurity warning, 299 - others warning1, 299 - others warning2' },
        type:     'pod',
        metadata: { name: 'test' },
        pod:      'test',
      };

      actions.load(ctx, { data, existing: false });

      const messages = ['others warning1, ', 'others warning2'];

      expect(growlWarning).toHaveBeenCalledWith('growl/warning', {
        title:   'Pod: test',
        message: decodeURIComponent(messages.join('').replace(/\+/g, '%20')),
        timeout: 0
      }, { root: true });
    });
  });
});
