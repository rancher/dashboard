<script setup lang="ts">
import { toRefs, ref, watch } from 'vue';
import { useStore } from 'vuex';
import LabeledSelect from '@shell/components/form/LabeledSelect.vue';
import { useI18n } from '@shell/composables/useI18n';
import { _CREATE } from '@shell/config/query-params';
import { RcSection } from '@components/RcSection';
defineOptions({ name: 'Networking' });

defineEmits([
  'update:vpcId',
  'update:subnetId',
  'validationChanged'
]);

interface Props {
  value: any;
  mode?: string;
  credentialId: any;
  region?: string;
}

const props = withDefaults(defineProps<Props>(), {
  mode:   _CREATE,
  region: ''
});

const { value, credentialId, region } = toRefs(props);

const store = useStore();
const { t } = useI18n(store);
const ec2Client = ref(null);
const vpcInfo = ref(null);

async function getVpcs() {
  // TODO get regions based on credentials
  if (!!region.value) {
    ec2Client.value = await store.dispatch('aws/ec2', {
      region:            region.value,
      cloudCredentialId: credentialId.value
    });
    if (!ec2Client.value) {
      vpcInfo.value = [];

      return;
    }

    const vpcs = await ec2Client.value.describeVpcs({});

    vpcInfo.value = vpcs?.Vpcs || [];
    // console.log('vpcInfo.value', vpcInfo.value);
  }
}

watch([
  () => region.value,
  () => credentialId.value
], async([newRegion, newCredentialId]) => {
  if (!!newRegion && !!newCredentialId) {
    await getVpcs();
  } else {
    vpcInfo.value = [];
  }
}, { immediate: true });

</script>

<template>
  <RcSection
    :title="t('capa.clusterConfig.network.title')"
    :expandable="true"
    mode="with-header"
    type="secondary"
  >
    <div class="mb-20 span-4">
      <LabeledSelect
        v-model:value="value.vpc.id"
        :label="t('capa.clusterConfig.network.vpc.label')"
        :placeholder="t('capa.clusterConfig.network.vpc.placeholder')"
        :options="(vpcInfo||[]).map(vpc => ({ label: vpc.VpcId, value: vpc.VpcId }))"
      />
    </div>
  </RcSection>
</template>

<style scoped lang="scss">

</style>
