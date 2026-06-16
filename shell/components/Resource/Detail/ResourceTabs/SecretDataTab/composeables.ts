import { computed, ComputedRef } from 'vue';
import { Props } from '@shell/components/Resource/Detail/ResourceTabs/SecretDataTab/index.vue';
import { SECRET_TYPES } from '@shell/config/secret';
import { useStore } from 'vuex';
import { useI18n } from '@shell/composables/useI18n';
import {
  useBasic, useSsh, useTls, useSecretInfo, useDockerRegistry, useServiceAccount, useDockerBasic
} from '@shell/components/Resource/Detail/ResourceTabs/SecretDataTab/auth-types';

export const useSecretDataTabDefaultProps = (resource: any): ComputedRef<Props> => {
  const store = useStore();
  const i18n = useI18n(store);
  const secretInfo = useSecretInfo(resource);

  return computed(() => {
    switch (secretInfo.value.secretType) {
    case SECRET_TYPES.DOCKER_JSON:
      return {
        tabLabel:   i18n.t('secret.data'),
        secretData: {
          registry:  useDockerRegistry(resource).value,
          basicAuth: useDockerBasic(resource).value
        }
      };
    case SECRET_TYPES.TLS:
      return {
        tabLabel:   i18n.t('secret.certificate.certificate'),
        secretData: { certificate: useTls(resource).value }
      };
    case SECRET_TYPES.SERVICE_ACCT:
      return {
        tabLabel:   i18n.t('secret.data'),
        secretData: { serviceAccount: useServiceAccount(resource).value }
      };
    case SECRET_TYPES.SSH:
      return {
        tabLabel:   i18n.t('secret.ssh.keys'),
        secretData: { ssh: useSsh(resource).value }
      };
    case SECRET_TYPES.BASIC:
      return {
        tabLabel:   i18n.t('secret.data'),
        secretData: { basicAuth: useBasic(resource).value }
      };
    default:
      return {
        tabLabel:   i18n.t('secret.data'),
        secretData: { basic: useBasic(resource).value }
      };
    }
  });
};
