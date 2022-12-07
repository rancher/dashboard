<script>
import { LabeledInput } from '@components/Form/LabeledInput';
import Tabbed from '@shell/components/Tabbed';
import Tab from '@shell/components/Tabbed/Tab';
import { RadioGroup } from '@components/Form/Radio';
import LabeledSelect from '@shell/components/form/LabeledSelect';

import CreateEditView from '@shell/mixins/create-edit-view';

import { STORAGE_CLASS } from '@shell/config/types';
import { allHash } from '@shell/utils/promise';
import { set, get, clone } from '@shell/utils/object';

const VALUES_YAML_KEYS = [
  'resources.requests.cpu',
  'resources.requests.memory',
  'resources.limits.cpu',
  'resources.limits.memory',
  'pvcClaim.enabled',
  'pvcClaim.size',
  'pvcClaim.storageClassName',
];

const DEFAULT_VALUES = {
  'resources.requests.cpu':    '0.5',
  'resources.requests.memory': '2Gi',
  'resources.limits.cpu':      '2',
  'resources.limits.memory':   '4Gi',
  'pvcClaim.enabled':          false,
  'pvcClaim.size':             '200Gi',
  'pvcClaim.storageClassName': '',
};

export default {
  name:       'EditHarvesterLogging',
  components: {
    LabeledInput,
    Tabbed,
    Tab,
    RadioGroup,
    LabeledSelect,
  },

  mixins: [CreateEditView],

  props: {
    value: {
      type:     Object,
      required: true,
    },

    mode: {
      type:     String,
      required: true
    },
  },

  async fetch() {
    const inStore = this.$store.getters['currentProduct'].inStore;

    const hash = { storages: this.$store.dispatch(`${ inStore }/findAll`, { type: STORAGE_CLASS }) };

    await allHash(hash);
  },

  data() {
    let valuesObj = {};

    try {
      valuesObj = JSON.parse(this.value?.spec?.valuesContent || '{}');
    } catch (err) {}

    const valuesContent = clone(valuesObj);

    VALUES_YAML_KEYS.map((key) => {
      if (!get(valuesObj, key)) {
        set(valuesContent, key, DEFAULT_VALUES[key]);
      }
    });

    return { valuesContent };
  },

  computed: {
    storageClassOptions() {
      const inStore = this.$store.getters['currentProduct'].inStore;
      const storages = this.$store.getters[`${ inStore }/all`](STORAGE_CLASS);

      const out = storages.filter(s => !s.parameters?.backingImage).map((s) => {
        const label = s.isDefault ? `${ s.name } (${ this.t('generic.default') })` : s.name;

        return {
          label,
          value: s.name,
        };
      }) || [];

      return out;
    },
  },

  methods: {
    update() {
      set(this.value, 'spec.valuesContent', JSON.stringify(this.valuesContent));
    },

    setDefaultClassName() {
      const inStore = this.$store.getters['currentProduct'].inStore;
      const defaultStorage = this.$store.getters[`${ inStore }/all`](STORAGE_CLASS).find( s => s.isDefault);

      this.$set(this.valuesContent.pvcClaim, 'storageClassName', this.valuesContent?.pvcClaim?.storageClassName || defaultStorage?.metadata?.name || 'longhorn');

      this.update();
    },
  },

  watch: {
    'valuesContent.pvcClaim.enabled'(value) {
      if (value) {
        this.setDefaultClassName();
      }
    },
  },
};
</script>

<template>
  <Tabbed :side-tabs="true">
    <Tab
      name="basic"
      :label="t('harvester.addons.vmImport.titles.basic')"
      :weight="99"
    >
      <RadioGroup
        v-model="value.spec.enabled"
        class="mb-20"
        name="model"
        :mode="mode"
        :options="[true,false]"
        :labels="[t('generic.enabled'), t('generic.disabled')]"
      />

      <div v-if="value.spec.enabled">
        <div class="row mt-10">
          <div class="col span-6">
            <LabeledInput
              v-model="valuesContent.resources.limits.cpu"
              :label="t('monitoring.prometheus.config.limits.cpu')"
              :required="true"
              :mode="mode"
              @input="update"
            />
          </div>
          <div class="col span-6">
            <LabeledInput
              v-model="valuesContent.resources.limits.memory"
              :label="t('monitoring.prometheus.config.limits.memory')"
              :required="true"
              :mode="mode"
              @input="update"
            />
          </div>
        </div>
        <div class="row mt-10">
          <div class="col span-6">
            <LabeledInput
              v-model="valuesContent.resources.requests.cpu"
              :label="t('monitoring.prometheus.config.requests.cpu')"
              :required="true"
              :mode="mode"
              @input="update"
            />
          </div>
          <div class="col span-6">
            <LabeledInput
              v-model="valuesContent.resources.requests.memory"
              :label="t('monitoring.prometheus.config.requests.memory')"
              :required="true"
              :mode="mode"
              @input="update"
            />
          </div>
        </div>

        <br />
        <h2>{{ t('harvester.addons.vmImport.titles.pvc') }}</h2>
        <div v-if="value.spec.enabled">
          <RadioGroup
            v-model="valuesContent.pvcClaim.enabled"
            class="mb-20"
            name="model"
            :mode="mode"
            :options="[true,false]"
            :labels="[t('generic.enabled'), t('generic.disabled')]"
            @input="update"
          />

          <div v-if="valuesContent.pvcClaim.enabled">
            <div class="row mt-10">
              <div class="col span-6">
                <LabeledInput
                  v-model="valuesContent.pvcClaim.size"
                  :label="t('harvester.volume.size')"
                  :required="true"
                  :mode="mode"
                  @input="update"
                />
              </div>
              <div class="col span-6">
                <LabeledSelect
                  v-model="valuesContent.pvcClaim.storageClassName"
                  :options="storageClassOptions"
                  :label="t('harvester.storage.storageClass.label')"
                  :mode="mode"
                  class="mb-20"
                  @input="update"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Tab>
  </Tabbed>
</template>

<style lang="scss" scoped>
  ::v-deep .radio-group {
    display: flex;
    .radio-container {
      margin-right: 30px;
    }
  }
</style>
