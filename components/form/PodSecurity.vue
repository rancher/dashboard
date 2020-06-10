<script>
import RadioGroup from '@/components/form/RadioGroup';
import ArrayList from '@/components/form/ArrayList';
import KeyValue from '@/components/form/KeyValue';
import { mapGetters } from 'vuex';
import LabeledInput from '@/components/form/LabeledInput';

export default {
  components: {
    RadioGroup,
    ArrayList,
    KeyValue,
    LabeledInput
  },
  props: {
    value: {
      type:    Object,
      default: () => {
        return {};
      }
    },
    mode: {
      type:    String,
      default: 'view'
    }
  },

  data() {
    const {
      shareProcessNamespace, securityContext = {}, hostPID, hostIPC
    } = this.value;
    const {
      runasNonRoot, runAsUser, runAsGroup, supplementalGroups, fsGroup, sysctls
    } = securityContext;

    return {
      shareProcessNamespace,
      hostPID,
      hostIPC,
      runasNonRoot,
      runAsUser,
      runAsGroup,
      supplementalGroups,
      fsGroup,
      sysctls
    };
  },

  computed: { ...mapGetters({ t: 'i18n/t' }) }
};
</script>

<template>
  <div>
    <div class="row">
      <div class="col span-3">
        <h5><t k="workload.container.security.shareProcessNamespace" /></h5>
        <RadioGroup v-model="shareProcessNamespace" :labels="['No', 'Yes']" :options="[false, true]" :mode="mode" />
      </div>
      <div class="col span-3">
        <h5><t k="workload.container.security.runAsNonRoot" /></h5>
        <RadioGroup v-model="runasNonRoot" :options="[false, true]" :labels="[t('workload.container.security.runAsNonRootOptions.noOption'), t('workload.container.security.runAsNonRootOptions.yesOption')]" :mode="mode" />
      </div>
    </div>

    <div class="row">
      <div class="col span-6">
        <LabeledInput v-model.number="runAsUser" :label="t('workload.container.security.runAsUser')" :mode="mode" />
      </div>
      <div class="col span-6">
        <LabeledInput v-model.number="runAsGroup" :label="t('workload.container.security.runAsGroup')" :mode="mode" />
      </div>
    </div>

    <div class="row">
      <div class="col span-6">
        <h5> <t k="workload.container.security.supplementalGroups" /> </h5>
        <ArrayList v-model="supplementalGroups" :add-label="t('workload.container.security.addGroupIDs')" :mode="mode" />
      </div>
    </div>

    <div class="row">
      <div class="col span-6">
        <LabeledInput v-model.number="fsGroup" :label="t('workload.container.security.fsGroup')" :mode="mode" />
      </div>
    </div>

    <div class="row">
      <div class="col span-3">
        <h5><t k="workload.container.security.hostIPC" /></h5>
        <RadioGroup v-model="hostIPC" :labels="['No', 'Yes']" :options="[false, true]" :mode="mode" />
      </div>
      <div class="col span-3">
        <h5><t k="workload.container.security.hostPID" /></h5>
        <RadioGroup v-model="hostPID" :labels="['No', 'Yes']" :options="[false, true]" :mode="mode" />
      </div>
    </div>

    <div class="row mb-0">
      <div class="col span-12">
        <KeyValue v-model="sysctls" :title="t('workload.container.security.sysctls')" :key-label="t('workload.container.security.sysctlsKey')" :mode="mode" />
      </div>
    </div>
  </div>
</template>>
