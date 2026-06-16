<script lang="ts">
import Tab from '@shell/components/Tabbed/Tab.vue';
import Basic, { Props as BasicProps } from '@shell/components/Resource/Detail/ResourceTabs/SecretDataTab/Basic.vue';
import Ssh, { Props as SshProps } from '@shell/components/Resource/Detail/ResourceTabs/SecretDataTab/Ssh.vue';
import ServiceAccountToken, { Props as ServiceAccountTokenProps } from '@shell/components/Resource/Detail/ResourceTabs/SecretDataTab/ServiceAccountToken.vue';
import Certificate, { Props as CertificateProps } from '@shell/components/Resource/Detail/ResourceTabs/SecretDataTab/Certificate.vue';
import BasicAuth, { Props as BasicAuthProps } from '@shell/components/Resource/Detail/ResourceTabs/SecretDataTab/BasicAuth.vue';
import Registry, { Props as RegistryProps } from '@shell/components/Resource/Detail/ResourceTabs/SecretDataTab/Registry.vue';

export interface SecretData {
  basic?: BasicProps;
  basicAuth?: BasicAuthProps;
  ssh?: SshProps;
  serviceAccount?: ServiceAccountTokenProps;
  certificate?: CertificateProps;
  registry?: RegistryProps;
}

export interface Props {
  tabLabel: string;
  secretData: SecretData;

  weight?: number;
}
</script>

<script lang="ts" setup>
const props = defineProps<Props>();
</script>

<template>
  <Tab
    class="secret-data-tab"
    name="data"
    :label="props.tabLabel"
    :weight="props.weight"
  >
    <Registry
      v-if="props.secretData.registry"
      v-bind="props.secretData.registry"
    />
    <BasicAuth
      v-if="props.secretData.basicAuth"
      v-bind="props.secretData.basicAuth"
    />
    <Certificate
      v-else-if="props.secretData.certificate"
      v-bind="props.secretData.certificate"
    />
    <ServiceAccountToken
      v-if="props.secretData.serviceAccount"
      v-bind="props.secretData.serviceAccount"
    />
    <Ssh
      v-if="props.secretData.ssh"
      v-bind="props.secretData.ssh"
    />
    <Basic
      v-if="props.secretData.basic"
      v-bind="props.secretData.basic"
    />
  </Tab>
</template>

<style lang="scss" scoped>
.secret-data-tab {
  :deep() .entry:not(:first-of-type) {
    margin-top: 16px;
  }
}
</style>
