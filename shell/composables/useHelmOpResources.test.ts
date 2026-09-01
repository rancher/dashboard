import { ref } from 'vue';
import { useHelmOpResources } from '@shell/composables/useHelmOpResources';

describe('useHelmOpResources', () => {
  let emit: jest.Mock;

  beforeEach(() => {
    emit = jest.fn();
  });

  describe('updateCorrectDrift', () => {
    it('should emit update:correct-drift with the given value', () => {
      const { updateCorrectDrift } = useHelmOpResources(emit, ref([]));

      updateCorrectDrift(true);

      expect(emit).toHaveBeenCalledWith('update:correct-drift', true);
    });
  });

  describe('updateSecrets', () => {
    it('should emit update:downstream-resources with kind Secret', () => {
      const { updateSecrets } = useHelmOpResources(emit, ref([]));

      updateSecrets(['secret-a', 'secret-b']);

      expect(emit).toHaveBeenCalledWith('update:downstream-resources', { kind: 'Secret', list: ['secret-a', 'secret-b'] });
    });

    it('should append locked secrets that are not already in the list', () => {
      const { updateSecrets } = useHelmOpResources(emit, ref(['locked-secret']));

      updateSecrets(['secret-a']);

      expect(emit).toHaveBeenCalledWith('update:downstream-resources', { kind: 'Secret', list: ['secret-a', 'locked-secret'] });
    });

    it('should not duplicate locked secrets already in the list', () => {
      const { updateSecrets } = useHelmOpResources(emit, ref(['secret-a']));

      updateSecrets(['secret-a', 'secret-b']);

      expect(emit).toHaveBeenCalledWith('update:downstream-resources', { kind: 'Secret', list: ['secret-a', 'secret-b'] });
    });
  });

  describe('updateDownstreamResources', () => {
    it('should emit update:downstream-resources with the given kind and list', () => {
      const { updateDownstreamResources } = useHelmOpResources(emit, ref([]));

      updateDownstreamResources('ConfigMap', ['cm-1']);

      expect(emit).toHaveBeenCalledWith('update:downstream-resources', { kind: 'ConfigMap', list: ['cm-1'] });
    });
  });
});
