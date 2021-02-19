<script>
import CruResource from '@/components/CruResource';
import LabeledInput from '@/components/form/LabeledInput';
import LabeledSelect from '@/components/form/LabeledSelect';
import CreateEditView from '@/mixins/create-edit-view';
import TextAreaAutoGrow from '@/components/form/TextAreaAutoGrow';

import { ALLOWED_SETTINGS } from '@/config/settings';
import RadioButton from '@/components/form/RadioButton';
import RadioGroup from '@/components/form/RadioGroup';

export default {
  components: {
    CruResource,
    LabeledInput,
    LabeledSelect,
    RadioButton,
    RadioGroup,
    TextAreaAutoGrow
  },

  mixins: [CreateEditView],

  data() {
    const t = this.$store.getters['i18n/t'];
    const setting = ALLOWED_SETTINGS[this.value.id];

    let enumOptions = [];

    if (setting.kind === 'enum' ) {
      enumOptions = setting.options.map(id => ({
        label: `advancedSettings.enum.${ this.value.id }.${ id }`,
        value: id,
      }));
    }

    const canReset = this.value.default !== null;
    const isDefault = canReset && !this.value.value;

    this.value.value = this.value.value || this.value.default;

    return {
      setting,
      description: t(`advancedSettings.descriptions.${ this.value.id }`),
      editHelp:    t(`advancedSettings.editHelp.${ this.value.id }`),
      enumOptions,
      customize:   !isDefault,
      canReset,
      errors:      [],
    };
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

      // If we are resetting to the default value, then reset the value
      if (!this.customize) {
        this.value.value = '';
      }
      this.save(done);
    }
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
    <h4>{{ description }}</h4>

    <h5 v-if="editHelp" class="edit-help" v-html="editHelp" />

    <h5 v-t="'advancedSettings.edit.changeSetting'" class="mt-20" />

    <RadioButton
      v-model="customize"
      name="useDefaultValue"
      :label="t('advancedSettings.edit.useDefault')"
      :val="false"
      class="settings-radio mb-10"
      :disabled="!canReset"
    />

    <RadioButton
      v-model="customize"
      name="useDefaultValue"
      :label="t('advancedSettings.edit.useCustom')"
      :val="true"
      class="settings-radio mb-10"
    />

    <div class="custom-value">
      <div v-if="setting.kind === 'enum'">
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
          :disabled="!customize"
          name="settings_value"
          :labels="[t('advancedSettings.edit.trueOption'), t('advancedSettings.edit.falseOption')]"
          :options="['true', 'false']"
        />
      </div>
      <div v-else-if="setting.kind === 'multiline' || setting.kind === 'json'">
        <TextAreaAutoGrow
          v-model="value.value"
          :disabled="!customize"
          :min-height="254"
        />
      </div>
      <div v-else>
        <LabeledInput
          v-model="value.value"
          :disabled="!customize"
          :label="t('advancedSettings.edit.value')"
        />
      </div>
    </div>
  </CruResource>
</template>

<style lang="scss" scoped>
  .settings-radio {
    display: flex;
  }
  .custom-value {
    margin-left: 20px;
  }
  ::v-deep .edit-help code {
    padding: 1px 5px;
  }
</style>
