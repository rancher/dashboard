import PromptRemove from '@shell/components/PromptRemove.vue';

describe('support forcibly delete namespaces', () => {
  it('should has terminating state', () => {
    const localThis = { toRemove: [{ state: 'terminating' }] };

    const result = PromptRemove.computed.hasTerminatingState.call(localThis);

    expect(result).toBeTruthy();
  });

  it('should be remove Finalizers 1', async() => {
    const close = jest.fn();
    const localThis = {
      removeFinalizers: true,
      toRemove:         [{
        state: 'terminating',
        removeFinalizers() {
          return { save: () => {} };
        }
      }],
      close,
    };

    await PromptRemove.methods.remove.call(localThis, () => {});

    expect(localThis.toRemove).toHaveLength(0);
    expect(close).toHaveBeenCalledTimes(1);
  });

  it('should be remove Finalizers 2', async() => {
    const close = jest.fn();
    const parallelRemove = jest.fn();
    const localThis = {
      removeFinalizers: true,
      toRemove:         [{
        state: 'terminating',
        removeFinalizers() {
          return { save: () => {} };
        }
      }, {
        state: 'active',
        removeFinalizers() {
          return { save: () => {} };
        }
      }],
      close,
      parallelRemove,
    };

    await PromptRemove.methods.remove.call(localThis, () => {});

    expect(localThis.toRemove).toHaveLength(1);
    expect(parallelRemove).toHaveBeenCalledTimes(1);
  });

  it('checked removeFinalizer has warning', () => {
    const localThis = {
      removeFinalizers: true,
      t:                jest.fn(t => t)
    };

    PromptRemove.methods.finalizersToRemove.call(localThis);

    expect(localThis.warning).toBe('promptForceRemove.namespaceWarning');
  });
});
