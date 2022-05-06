<script>
import RadioGroup from '@shell/components/form/RadioGroup';
import ArrayList from '@shell/components/form/ArrayList';
import KeyValue from '@shell/components/form/KeyValue';
import { mapGetters } from 'vuex';
import LabeledInput from '@shell/components/form/LabeledInput';

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
      <div class="col span-6">
        <RadioGroup
          v-model="shareProcessNamespace"
          name="shareProcessNamespace"
          :label="t('workload.container.security.shareProcessNamespace')"
          :labels="['No', 'Yes']"
          :options="[false, true]"
          :mode="mode"
        />
      </div>
      <div class="col span-6">
        <RadioGroup
          v-model="runasNonRoot"
          name="runasNonRoot"
          :label="t('workload.container.security.runAsNonRoot')"
          :options="[false, true]"
          :labels="[t('workload.container.security.runAsNonRootOptions.noOption'), t('workload.container.security.runAsNonRootOptions.yesOption')]"
          :mode="mode"
        />
      </div>
    </div>

    <div class="spacer" />

    <div class="row">
      <div class="col span-6">
        <LabeledInput v-model.number="runAsUser" :label="t('workload.container.security.runAsUser')" :mode="mode" />
      </div>
      <div class="col span-6">
        <LabeledInput v-model.number="runAsGroup" :label="t('workload.container.security.runAsGroup')" :mode="mode" />
      </div>
    </div>

    <div class="spacer" />

    <div class="row">
      <div class="col span-6">
        <h5 class="text-label">
          <t k="workload.container.security.supplementalGroups" />
        </h5>
        <ArrayList v-model="supplementalGroups" :add-label="t('workload.container.security.addGroupIDs')" :mode="mode" />
      </div>
    </div>

    <div class="spacer" />

    <div class="row">
      <div class="col span-6">
        <LabeledInput v-model.number="fsGroup" :label="t('workload.container.security.fsGroup')" :mode="mode" />
      </div>
    </div>

    <div class="spacer" />

    <div class="row">
      <div class="col span-6">
        <RadioGroup
          v-model="hostIPC"
          name="hostIPC"
          :label="t('workload.container.security.hostIPC')"
          :labels="['No', 'Yes']"
          :options="[false, true]"
          :mode="mode"
        />
      </div>
      <div class="col span-6">
        <RadioGroup
          v-model="hostPID"
          name="hostPID"
          :label="t('workload.container.security.hostPID')"
          :labels="['No', 'Yes']"
          :options="[false, true]"
          :mode="mode"
        />
      </div>
    </div>

    <div class="spacer" />

    <div class="row">
      <div class="col span-12">
        <KeyValue
          v-model="sysctls"
          :title="t('workload.container.security.sysctls')"
          :key-label="t('workload.container.security.sysctlsKey')"
          :mode="mode"
        >
          <template #title>
            <h3>
              {{ t('workload.container.security.sysctls') }}
            </h3>
          </template>
        </KeyValue>
      </div>
    </div>
  </div>
</template>
