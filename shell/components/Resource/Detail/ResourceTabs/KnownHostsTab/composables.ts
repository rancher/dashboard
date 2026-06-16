import { Props } from '@shell/components/Resource/Detail/ResourceTabs/KnownHostsTab/index.vue';
import { computed, Ref, toValue } from 'vue';
import { base64Decode } from '@shell/utils/crypto';
import { SECRET_TYPES } from '@shell/config/secret';

export const useGetKnownHostsTabProps = (resource: any): Ref<Props | undefined> => {
  const resourceValue = toValue(resource);

  return computed(() => {
    const isSsh = resourceValue._type === SECRET_TYPES.SSH;
    const showKnownHosts = isSsh && resourceValue.supportsSshKnownHosts;

    if (!showKnownHosts) {
      return undefined;
    }

    const { data = {} } = resourceValue;

    return { knownHosts: data.known_hosts ? base64Decode(data.known_hosts) : '' };
  });
};
