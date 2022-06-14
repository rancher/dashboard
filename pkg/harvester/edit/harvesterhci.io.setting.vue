<script>
import CruResource from '@shell/components/CruResource';
import { RadioGroup } from '@components/Form/Radio';
import { LabeledInput } from '@components/Form/LabeledInput';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import { TextAreaAutoGrow } from '@components/Form/TextArea';

import CreateEditView from '@shell/mixins/create-edit-view';

import { HCI_ALLOWED_SETTINGS, HCI_SINGLE_CLUSTER_ALLOWED_SETTING, HCI_SETTING } from '@shell/config/settings';

export default {
  components: {
    CruResource,
    LabeledInput,
    LabeledSelect,
    RadioGroup,
    TextAreaAutoGrow
  },

  mixins: [CreateEditView],

  data() {
    const t = this.$store.getters['i18n/t'];
    const setting = HCI_ALLOWED_SETTINGS[this.value.id] || HCI_SINGLE_CLUSTER_ALLOWED_SETTING[this.value.id];

    let enumOptions = [];

    if (setting.kind === 'enum' ) {
      enumOptions = setting.options.map(id => ({
        label: `advancedSettings.enum.harv-${ this.value.id }.${ id }`,
        value: id,
      }));
    }

    const canReset = setting.canReset || (!!this.value.default || this.value.canReset);

    if (this.value.value === undefined) {
      this.$set(this.value, 'value', null);
    }

    this.value.value = this.value.value || this.value.default || '';

    const isHarvester = this.value?.type?.includes('harvesterhci');

    return {
      setting,
      description:          isHarvester ? t(`advancedSettings.descriptions.harv-${ this.value.id }`) : t(`advancedSettings.descriptions.${ this.value.id }`),
      editHelp:             t(`advancedSettings.editHelp.${ this.value.id }`),
      enumOptions,
      canReset,
      errors:               [],
      hasCustomComponent:   false,
      customComponent:      null
    };
  },

  computed: {
    doneLocationOverride() {
      return this.value.doneOverride;
    },
  },

  created() {
    let customComponent = false;

    const resource = this.$route.params.resource;
    const name = this.value.metadata.name;
    // const path = `${ resource }/${ name }`;
    const path = `setting/${ name }`;

    const hasCustomComponent = this.$store.getters['type-map/hasComponent'](path);

    if ( hasCustomComponent ) {
      customComponent = this.$store.getters['type-map/importEdit'](path);
    }
    this.hasCustomComponent = hasCustomComponent;
    this.customComponent = customComponent;
  },

  methods: {
    saveSettings(done) {
      const t = this.$store.getters['i18n/t'];

      // Validate the JSON if the setting is a json value
      if (this.setting.kind === 'json') {
        try {
          JSON.parse(this.value.value);
          this.errors = [];
        } catch (e) {
          this.errors = [t('advancedSettings.edit.invalidJSON')];

          return done(false);
        }
      }

      this.save(done);
    },

    useDefault(ev) {
      // Lose the focus on the button after click
      if (ev && ev.srcElement) {
        ev.srcElement.blur();
      }

      if (this.value.id === HCI_SETTING.RANCHER_MONITORING) {
        this.$set(this.value.spec.values.prometheus, 'prometheusSpec', Object.assign(this.value.spec.values.prometheus.prometheusSpec, this.value.defaultValue.prometheus, {}));
        this.$set(this.value.spec.values, 'prometheus-node-exporter', Object.assign(this.value.spec.values['prometheus-node-exporter'], this.value.defaultValue['prometheus-node-exporter'], {}));
      } else if (this.value.id === HCI_SETTING.VLAN) {
        this.value.enable = false;
        if (this.value.config) {
          this.value.config.defaultPhysicalNIC = '';
        }
      } else {
        this.value.value = this.value.default || '';
      }
    },
  }
};
</script>

<template>
  <CruResource
    class="route"
    :done-route="'c-cluster-product-resource'"
    :errors="errors"
    :mode="mode"
    :resource="value"
    :subtypes="[]"
    :can-yaml="false"
    @error="e=>errors = e"
    @finish="saveSettings"
    @cancel="done"
  >
    <h4 v-html="description"></h4>

    <h5 v-if="editHelp" class="edit-help" v-html="editHelp" />

    <div class="edit-change mt-20">
      <h5 v-t="'advancedSettings.edit.changeSetting'" />
      <button :disabled="!canReset" type="button" class="btn role-primary" @click="useDefault">
        {{ t('advancedSettings.edit.useDefault') }}
      </button>
    </div>

    <div class="mt-20">
      <div v-if="setting.from === 'import'">
        <component
          :is="customComponent"
          v-if="hasCustomComponent"
          v-model="value"
          :register-before-hook="registerBeforeHook"
          :mode="mode"
        />
      </div>
      <div v-else-if="setting.kind === 'enum'">
        <LabeledSelect
          v-model="value.value"
          :label="t('advancedSettings.edit.value')"
          :localized-label="true"
          :mode="mode"
          :options="enumOptions"
        />
      </div>
      <div v-else-if="setting.kind === 'boolean'">
        <RadioGroup
          v-model="value.value"
          name="settings_value"
          :labels="[t('advancedSettings.edit.trueOption'), t('advancedSettings.edit.falseOption')]"
          :options="['true', 'false']"
        />
      </div>
      <div v-else-if="setting.kind === 'multiline' || setting.kind === 'json'">
        <TextAreaAutoGrow
          v-model="value.value"
          :min-height="254"
        />
      </div>
      <div v-else>
        <LabeledInput
          v-model="value.value"
          :label="t('advancedSettings.edit.value')"
        />
      </div>
    </div>
  </CruResource>
</template>

<style lang="scss" scoped>
  .edit-change {
    align-items: center;
    display: flex;

    > h5 {
      flex: 1;
    }
  }

  ::v-deep .edit-help code {
    padding: 1px 5px;
  }
</style>
