<script>
import LabelValue from '@shell/components/LabelValue';
import { HCI } from '../../types';
import { ksmtunedMode, ksmtunedRunOption } from '../../edit/harvesterhci.io.host/HarvesterKsmtuned.vue';

export default {
  name:       'HarvesterKsmtuned',
  components: { LabelValue },

  props: {
    mode: {
      type:     String,
      required: true
    },

    node: {
      type:     Object,
      required: true,
    },
  },

  async fetch() {
    const inStore = this.$store.getters['currentProduct'].inStore;

    const hash = await this.$store.dispatch(`${ inStore }/findAll`, { type: HCI.KSTUNED });

    this.ksmtuned = hash.find((node) => {
      return node.id === this.node.id;
    });
  },

  data() {
    return { ksmtuned: {} };
  },

  computed: {
    modeText() {
      const mode = this.ksmtuned.spec.mode;

      return ksmtunedMode.find(M => M.value === mode).label;
    },

    thresCoef() {
      return `${ this.ksmtuned.spec.thresCoef } %`;
    },

    runText() {
      const run = this.ksmtuned.spec.run;

      return ksmtunedRunOption.find(M => M.value === run).label;
    },

    showRunInformation() {
      return this.ksmtuned.spec.run === 'run';
    },

    mergeNodesText() {
      return this.ksmtuned.spec?.mergeAcrossNodes ? this.t('harvester.host.ksmtuned.enable') : this.t('harvester.host.ksmtuned.disable');
    },

    ksmdPhase() {
      return this.ksmtuned?.status?.ksmdPhase;
    },

    ksmdPhaseTextColor() {
      return this.ksmdPhase === 'Running' ? 'text-success' : 'text-warning';
    }
  },
};
</script>

<template>
  <div>
    <template v-if="ksmtuned.status">
      <h2>
        {{ t('harvester.host.ksmtuned.configure') }}
      </h2>
      <div class="row mb-20">
        <div class="col span-4">
          <LabelValue :name="t('harvester.host.ksmtuned.run')" :value="runText" />
        </div>
      </div>

      <div v-if="showRunInformation" class="row mb-20">
        <div class="col span-4">
          <LabelValue :name="t('harvester.host.ksmtuned.thresCoef')" :value="thresCoef" />
        </div>
        <div class="col span-4">
          <LabelValue :name="t('harvester.host.ksmtuned.mode')" :value="modeText" />
        </div>

        <div class="col span-4">
          <LabelValue :name="t('harvester.host.ksmtuned.enableMergeNodes')" :value="mergeNodesText" />
        </div>
      </div>

      <div v-if="showRunInformation">
        <hr class="divider" />

        <h3>{{ t('harvester.host.ksmtuned.parameters.title') }}</h3>
        <div class="row mb-20">
          <div class="col span-4">
            <LabelValue :name="t('harvester.host.ksmtuned.parameters.boost')" :value="ksmtuned.spec.ksmtunedParameters.boost" />
          </div>
          <div class="col span-4">
            <LabelValue :name="t('harvester.host.ksmtuned.parameters.decay')" :value="ksmtuned.spec.ksmtunedParameters.decay" />
          </div>

          <div class="col span-4">
            <LabelValue :name="t('harvester.host.ksmtuned.parameters.sleepMsec')" :value="ksmtuned.spec.ksmtunedParameters.sleepMsec" />
          </div>
        </div>

        <div class="row mb-20">
          <div class="col span-4">
            <LabelValue :name="t('harvester.host.ksmtuned.parameters.minPages')" :value="ksmtuned.spec.ksmtunedParameters.minPages" />
          </div>

          <div class="col span-4">
            <LabelValue :name="t('harvester.host.ksmtuned.parameters.maxPages')" :value="ksmtuned.spec.ksmtunedParameters.maxPages" />
          </div>
        </div>
      </div>

      <div>
        <hr class="divider" />
        <h3><t k="harvester.host.ksmtuned.statistics.title" :raw="true" /></h3>
        <div class="row mb-20">
          <div class="col span-4">
            <LabelValue :name="t('harvester.host.ksmtuned.ksmStatus')">
              <template #value>
                <span :class="ksmdPhaseTextColor">{{ ksmdPhase }}</span>
              </template>
            </LabelValue>
          </div>

          <div class="col span-4">
            <LabelValue :name="t('harvester.host.ksmtuned.statistics.sharing')" :value="ksmtuned.status.sharing" />
          </div>
          <div class="col span-4">
            <LabelValue :name="t('harvester.host.ksmtuned.statistics.shared')" :value="ksmtuned.status.shared" />
          </div>
        </div>

        <div class="row mb-20">
          <div class="col span-4">
            <LabelValue :name="t('harvester.host.ksmtuned.statistics.unshared')" :value="ksmtuned.status.unshared" />
          </div>

          <div class="col span-4">
            <LabelValue :name="t('harvester.host.ksmtuned.statistics.volatile')" :value="ksmtuned.status.volatile" />
          </div>

          <div class="col span-4">
            <LabelValue :name="t('harvester.host.ksmtuned.statistics.fullScans')" :value="ksmtuned.status.fullScans" />
          </div>
        </div>

        <div class="row mb-20">
          <div class="col span-4">
            <LabelValue :name="t('harvester.host.ksmtuned.statistics.stableNodeDups')" :value="ksmtuned.status.stableNodeDups" />
          </div>

          <div class="col span-4">
            <LabelValue :name="t('harvester.host.ksmtuned.statistics.stableNodeChains')" :value="ksmtuned.status.stableNodeChains" />
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
