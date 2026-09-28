import { type Ref, toValue } from 'vue';

type Emit = {
  (e: 'update:correct-drift', value: boolean): void;
  (e: 'update:downstream-resources', value: { kind: string; list: string[] }): void;
};

export function useHelmOpResources(emit: Emit, lockedSecrets: Ref<string[]> | (() => string[])) {
  const updateCorrectDrift = (value: boolean) => {
    emit('update:correct-drift', value);
  };

  const updateSecrets = (list: string[]) => {
    const newList = [...list];

    for (const locked of toValue(lockedSecrets)) {
      if (!newList.includes(locked)) {
        newList.push(locked);
      }
    }

    emit('update:downstream-resources', { kind: 'Secret', list: newList });
  };

  const updateDownstreamResources = (kind: string, list: string[]) => {
    emit('update:downstream-resources', { kind, list });
  };

  return {
    updateCorrectDrift, updateSecrets, updateDownstreamResources
  };
}
