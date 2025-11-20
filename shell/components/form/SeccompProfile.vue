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
    initialType: {
      type:    String,
      default: 'None'
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
    const { type, localhostProfile } = this.value.seccompProfile || {};

    return {
      type: type || this.initialType,
      localhostProfile,
    };
  },

  computed: { ...mapGetters({ t: 'i18n/t' }) },

  methods: {
    update() {
      const securityContext = {
        ...this.value,
        seccompProfile: {
          type:             this.type,
          localhostProfile: this.localhostProfile,
        }
      };

      if (this.type !== 'None') {
        securityContext.seccompProfile = { ...securityContext?.seccompProfile, type: this.type };
        if (this.type === 'Localhost') {
          securityContext.seccompProfile.localhostProfile = this.localhostProfile;
        } else {
          delete securityContext.seccompProfile.localhostProfile;
        }
      } else {
        delete securityContext?.seccompProfile?.type;
        delete securityContext?.seccompProfile?.localhostProfile;
      }

      if (Object.keys(securityContext?.seccompProfile || {}).length === 0) {
        delete securityContext.seccompProfile;
      }

      this.$emit('update:value', securityContext);
    }
  }
};
</script>

<template>
  <div>
    <h3>{{ title }}</h3>
    <div class="row">
      <div class="col span-6">
        <LabeledSelect
          v-model:value="type"
          :mode="mode"
          :label="t('workload.container.security.seccompProfile.type')"
          :options="seccompProfileTypes"
          data-testid="seccomp-type-select"
          @update:value="update"
        />
      </div>
      <div class="col span-6">
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
  </div>
</template>
