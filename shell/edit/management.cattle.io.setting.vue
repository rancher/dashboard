<script>
import CruResource from '@shell/components/CruResource';
import LabeledInput from '@shell/components/form/LabeledInput';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import CreateEditView from '@shell/mixins/create-edit-view';
import TextAreaAutoGrow from '@shell/components/form/TextAreaAutoGrow';

import { ALLOWED_SETTINGS, SETTING } from '@shell/config/settings';
import RadioGroup from '@shell/components/form/RadioGroup';
import { setBrand } from '@shell/config/private-label';

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
    const setting = ALLOWED_SETTINGS[this.value.id];

    let enumOptions = [];

    if (setting.kind === 'enum' ) {
      enumOptions = setting.options.map(id => ({
        label: `advancedSettings.enum.${ this.value.id }.${ id }`,
        value: id,
      }));
    }

    const canReset = setting.canReset || !!this.value.default;

    this.value.value = this.value.value || this.value.default;

    return {
      setting,
      description: t(`advancedSettings.descriptions.${ this.value.id }`),
      editHelp:    t(`advancedSettings.editHelp.${ this.value.id }`),
      enumOptions,
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

    <div class="edit-change mt-20">
      <h5 v-t="'advancedSettings.edit.changeSetting'" />
      <button :disabled="!canReset" type="button" class="btn role-primary" @click="useDefault">
        {{ t('advancedSettings.edit.useDefault') }}
      </button>
    </div>

    <div class="mt-20">
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
          name="settings_value"
          :labels="[t('advancedSettings.edit.trueOption'), t('advancedSettings.edit.falseOption')]"
          :options="['true', 'false']"
        />
      </div>
      <div v-else-if="setting.kind === 'multiline' || setting.kind === 'json'">
        <TextAreaAutoGrow
          v-model="value.value"
          v-focus
          :min-height="254"
        />
      </div>
      <div v-else>
        <LabeledInput
          v-model="value.value"
          v-focus
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
