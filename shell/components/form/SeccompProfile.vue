<script>
import { LabeledInput } from '@components/Form/LabeledInput';
import { mapGetters } from 'vuex';
import LabeledSelect from '@shell/components/form/LabeledSelect';

export default {
  emits: ['update:value'],

  components: {
    LabeledInput,
    LabeledSelect
  },

  props: {
    value: {
      type:    Object,
      default: () => ({})
    },
    mode: {
      type:    String,
      default: 'mode'
    },
    seccompProfileTypes: {
      type:    Array,
      default: () => []
    },
    title: {
      type:    String,
      default: ''
    }
  },

  data() {
    const { type, localhostProfile } = this.value || {};

    return {
      type:                                 type || 'None',
      localhostProfile,
      afterLocalhostProfileSelectedMessage: ''
    };
  },

  computed: { ...mapGetters({ t: 'i18n/t' }) },

  methods: {
    update() {
      if (this.type === 'None') {
        this.$emit('update:value', undefined);

        return;
      }

      const seccompProfile = { type: this.type };

      if (this.type === 'Localhost') {
        seccompProfile.localhostProfile = this.localhostProfile;
        this.afterLocalhostProfileSelectedMessage = this.t('workload.container.security.seccompProfile.afterLocalhostProfile.selected');
      } else {
        this.afterLocalhostProfileSelectedMessage = this.t('workload.container.security.seccompProfile.afterLocalhostProfile.unselected');
      }

      this.$emit('update:value', seccompProfile);
    }
  }
};
</script>

<template>
  <fieldset>
    <legend class="h3-legend">
      {{ title }}
    </legend>
    <div class="row">
      <div
        data-testid="input-security-seccompProfile-type"
        class="col span-6"
      >
        <LabeledSelect
          v-model:value="type"
          :mode="mode"
          :label="t('workload.container.security.seccompProfile.type')"
          :options="seccompProfileTypes"
          data-testid="seccomp-type-select"
          @update:value="update"
        />
      </div>
      <p
        id="after-localhostprofile-selected"
        role="status"
        aria-live="polite"
        class="sr-only"
      >
        {{ afterLocalhostProfileSelectedMessage }}
      </p>
      <div
        data-testid="input-security-seccompProfile-localhostProfile"
        class="col span-6"
      >
        <LabeledInput
          v-if="type === 'Localhost'"
          v-model:value="localhostProfile"
          :mode="mode"
          :label="t('workload.container.security.seccompProfile.localhostProfile.label')"
          :required="true"
          :tooltip="t('workload.container.security.seccompProfile.localhostProfile.tooltip')"
          :placeholder="t('workload.container.security.seccompProfile.localhostProfile.placeholder')"
          data-testid="seccomp-localhost-input"
          @update:value="update"
        />
      </div>
    </div>
  </fieldset>
</template>
