<script>
import CruResource from '@shell/components/CruResource';
import { LabeledInput } from '@components/Form/LabeledInput';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import CreateEditView from '@shell/mixins/create-edit-view';
import { TextAreaAutoGrow } from '@components/Form/TextArea';
import formRulesGenerator from '@shell/utils/validators/formRules/index';

import { ALLOWED_SETTINGS, SETTING } from '@shell/config/settings';
import { RadioGroup } from '@components/Form/Radio';
import FormValidation from '@shell/mixins/form-validation';
import { setBrand } from '@shell/config/private-label';
import { keyBy, mapValues } from 'lodash';

export default {
  components: {
    CruResource,
    LabeledInput,
    LabeledSelect,
    RadioGroup,
    TextAreaAutoGrow
  },

  mixins: [CreateEditView, FormValidation],

  data() {
    const t = this.$store.getters['i18n/t'];

    return {
      setting:        ALLOWED_SETTINGS[this.value.id],
      description:    t(`advancedSettings.descriptions.${ this.value.id }`),
      editHelp:       t(`advancedSettings.editHelp.${ this.value.id }`),
      enumOptions:    [],
      canReset:       false,
      errors:         [],
      fvFormRuleSets: [],
    };
  },

  created() {
    this.value.value = this.value.value || this.value.default;
    this.enumOptions = this.setting?.kind === 'enum' ? this.setting.options.map(id => ({
      label: `advancedSettings.enum.${ this.value.id }.${ id }`,
      value: id,
    })) : [];
    this.canReset = this.setting?.canReset || !!this.value.default;
    this.fvFormRuleSets = this.setting?.ruleSet ? [{
      path:  'value',
      rules: this.setting.ruleSet.map(({ name }) => name)
    }] : [];
  },

  computed: {
    fvExtraRules() {
      const t = this.$store.getters['i18n/t'];

      // We map the setting rulesets to use values to define validation from factory
      return this.setting?.ruleSet ? mapValues(
        keyBy(this.setting.ruleSet, 'name'),
        ({ key, name, arg }) => {
          return formRulesGenerator(t, key ? { key } : {})[name](arg);
        }) : {};
    }
  },

  methods: {
    convertToString(event) {
      this.value.value = `${ event.target.value }`;
    },

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

      if (this.value?.id === SETTING.BRAND) {
        setBrand(this.value.value);
      }

      this.save(done);
    },

    useDefault(ev) {
      // Lose the focus on the button after click
      if (ev && ev.srcElement) {
        ev.srcElement.blur();
      }
      this.value.value = this.value.default;
    }
  }
};
</script>

<template>
  <CruResource
    class="route"
    :done-route="'c-cluster-product-resource'"
    :errors="fvUnreportedValidationErrors"
    :mode="mode"
    :resource="value"
    :subtypes="[]"
    :can-yaml="false"
    :validation-passed="fvFormIsValid"
    @error="e=>errors = e"
    @finish="saveSettings"
    @cancel="done"
  >
    <h4>{{ description }}</h4>

    <h5
      v-if="editHelp"
      class="edit-help"
      v-html="editHelp"
    />

    <div class="edit-change mt-20">
      <h5 v-t="'advancedSettings.edit.changeSetting'" />
      <button
        :disabled="!canReset"
        type="button"
        class="btn role-primary"
        @click="useDefault"
      >
        {{ t('advancedSettings.edit.useDefault') }}
      </button>
    </div>

    <div class="mt-20">
      <div v-if="setting.kind === 'enum'">
        <LabeledSelect
          v-model="value.value"
          data-testid="input-setting-enum"
          :label="t('advancedSettings.edit.value')"
          :rules="fvGetAndReportPathRules('value')"
          :localized-label="true"
          :mode="mode"
          :required="true"
          :options="enumOptions"
        />
      </div>
      <div v-else-if="setting.kind === 'boolean'">
        <RadioGroup
          v-model="value.value"
          data-testid="input-setting-boolean"
          name="settings_value"
          :rules="fvGetAndReportPathRules('value')"
          :labels="[t('advancedSettings.edit.trueOption'), t('advancedSettings.edit.falseOption')]"
          :options="['true', 'false']"
        />
      </div>
      <div v-else-if="setting.kind === 'multiline' || setting.kind === 'json'">
        <TextAreaAutoGrow
          v-model="value.value"
          data-testid="input-setting-json"
          :required="true"
          :rules="fvGetAndReportPathRules('value')"
          :min-height="254"
        />
      </div>
      <div v-else-if="setting.kind === 'integer'">
        <LabeledInput
          v-model="value.value"
          data-testid="input-setting-integer"
          :label="t('advancedSettings.edit.value')"
          :mode="mode"
          type="number"
          :rules="fvGetAndReportPathRules('value')"
          :required="true"
        />
      </div>
      <div v-else>
        <LabeledInput
          v-model="value.value"
          data-testid="input-setting-generic"
          :localized-label="true"
          :required="true"
          :mode="mode"
          :rules="fvGetAndReportPathRules('value')"
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
