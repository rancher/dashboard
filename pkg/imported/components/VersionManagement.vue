<script>
import { defineComponent } from 'vue';
import { RadioGroup } from '@rc/Form/Radio';
import { mapGetters } from 'vuex';
import { _EDIT, _CREATE } from '@shell/config/query-params';
import Banner from '@rc/Banner/Banner.vue';
import { VERSION_MANAGEMENT_DEFAULT } from '@pkg/imported/util/shared.ts';

export default defineComponent({
  emits: ['version-management-changed'],

  components: { RadioGroup, Banner },

  props: {
    value: {
      type:     String,
      required: true
    },
    mode: {
      type:     String,
      required: true,
    },
    globalSetting: {
      type:     Boolean,
      required: true,
    },
    oldValue: {
      type:     String,
      required: true
    },
    isLocal: {
      type:    Boolean,
      default: false
    }
  },

  computed: {
    ...mapGetters({ t: 'i18n/t' }),
    isEdit() {
      return this.mode === _EDIT;
    },
    isCreate() {
      return this.mode === _CREATE;
    },
    versionManagementOptions() {
      const defaultLabel = this.globalSetting ? this.t('imported.basics.versionManagement.globalEnabled') : this.t('imported.basics.versionManagement.globalDisabled');

      return [
        { value: VERSION_MANAGEMENT_DEFAULT, label: defaultLabel },
        { value: 'true', label: this.t('imported.basics.versionManagement.enabled') },
        { value: 'false', label: this.t('imported.basics.versionManagement.disabled') },
      ];
    },
    versionManagementInfo() {
      if (!this.isEdit) {
        if ( this.value === VERSION_MANAGEMENT_DEFAULT ) {
          return this.t('imported.basics.versionManagement.banner.create.default');
        } else {
          return this.t('imported.basics.versionManagement.banner.create.nonDefault');
        }
      } else {
        if (this.value === this.oldValue) {
          return '';
        }
        if ( this.isLocal) {
          if ( this.oldValue === VERSION_MANAGEMENT_DEFAULT) {
            return this.t('imported.basics.versionManagement.banner.edit.defaultToNonDefault', {}, true);
          } else if (this.value === VERSION_MANAGEMENT_DEFAULT) {
            return this.t('imported.basics.versionManagement.banner.edit.nonDefaultToDefault', {}, true);
          }

          return '';
        } else {
          if (this.oldValue === VERSION_MANAGEMENT_DEFAULT) {
            return this.value === `${ this.globalSetting }` ? this.t('imported.basics.versionManagement.banner.edit.defaultToNonDefault', {}, true) : `${ this.t('imported.basics.versionManagement.banner.edit.different') } ${ this.t('imported.basics.versionManagement.banner.edit.defaultToNonDefault', {}, true ) }`;
          } else {
            if (this.value === VERSION_MANAGEMENT_DEFAULT) {
              return this.oldValue === `${ this.globalSetting }` ? this.t('imported.basics.versionManagement.banner.edit.nonDefaultToDefault', {}, true) : `${ this.t('imported.basics.versionManagement.banner.edit.different') } ${ this.t('imported.basics.versionManagement.banner.edit.nonDefaultToDefault', {}, true ) }`;
            } else {
              return this.t('imported.basics.versionManagement.banner.edit.different');
            }
          }
        }
      }
    },

    globalConfigurationText() {
      return this.globalSetting ? this.t('imported.basics.versionManagement.summary.globallyEnabled', {}, true) : this.t('imported.basics.versionManagement.summary.globallyDisabled', {}, true);
    },
    clusterConfigurationText() {
      if ( this.value === 'true') {
        return this.t('imported.basics.versionManagement.summary.willEnable', {}, true);
      }
      if (this.value === 'false') {
        return this.t('imported.basics.versionManagement.summary.willDisable', {}, true);
      }

      return !this.globalSetting ? this.t('imported.basics.versionManagement.summary.canEnable', {}, true) : '';
    },
    showVersionManagementBanner() {
      const valueChanged = this.isEdit && this.value !== this.oldValue;
      const localChangedInvolvingDefault = valueChanged && this.isLocal && (this.oldValue === VERSION_MANAGEMENT_DEFAULT || this.value === VERSION_MANAGEMENT_DEFAULT);

      return this.isCreate || localChangedInvolvingDefault || (!this.isLocal && valueChanged);
    }
  }
});
</script>
<template>
  <h3 class="mb-10">
    <t k="imported.basics.versionManagement.title" />
  </h3>
  <Banner
    v-if="showVersionManagementBanner"
    color="info"
    data-testid="version-management-banner"
  >
    {{ versionManagementInfo }}
  </Banner>
  <RadioGroup
    :value="value"
    :mode="mode"
    :options="versionManagementOptions"
    name="versionManagement"
    data-testid="imported-version-management-radio"
    @update:value="$emit('version-management-changed', $event)"
  />
  <div class="col mt-10">
    <label
      v-clean-html="globalConfigurationText"
      class="summary"
    /><br>
    <label
      v-clean-html="clusterConfigurationText"
      class="summary mb-10"
    />
  </div>
</template>

<style lang='scss'>
    .summary{
        margin: 0pt
    }
</style>
