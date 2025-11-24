<script>
import Checkbox from '@components/Form/Checkbox/Checkbox.vue';
import { LabeledInput } from '@components/Form/LabeledInput';
import { _VIEW } from '@shell/config/query-params';
import { mapGetters } from 'vuex';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import SeccompProfile from '@shell/components/form/SeccompProfile';

const allCapabilities = ['ALL',
  'AUDIT_CONTROL',
  'AUDIT_WRITE',
  'BLOCK_SUSPEND',
  'CHOWN',
  'DAC_OVERRIDE',
  'DAC_READ_SEARCH',
  'FOWNER',
  'FSETID',
  'IPC_LOCK',
  'IPC_OWNER',
  'KILL',
  'LEASE',
  'LINUX_IMMUTABLE',
  'MAC_ADMIN',
  'MAC_OVERRIDE',
  'MKNOD',
  'NET_ADMIN',
  'NET_BIND_SERVICE',
  'NET_BROADCAST',
  'NET_RAW',
  'SETFCAP',
  'SETGID',
  'SETPCAP',
  'SETUID',
  'SYSLOG',
  'SYS_ADMIN',
  'SYS_BOOT',
  'SYS_CHROOT',
  'SYS_MODULE',
  'SYS_NICE',
  'SYS_PACCT',
  'SYS_PTRACE',
  'SYS_RAWIO',
  'SYS_RESOURCE',
  'SYS_TIME',
  'SYS_TTY_CONFIG',
  'WAKE_ALARM'];

export default {
  emits: ['update:value'],

  components: {
    Checkbox,
    LabeledInput,
    LabeledSelect,
    SeccompProfile
  },

  props: {
    value: {
      type:    Object,
      default: () => {
        return {};
      }
    },
    formType:            { type: String, default: 'container' },
    mode:                { type: String, default: 'edit' },
    seccompProfileTypes: {
      type:    Array,
      default: () => []
    }
  },

  data() {
    if (this.formType === 'container') {
      return {
        allCapabilities,
        securityContext: {
          ...this.value,
          privileged:               this.value.privileged || false,
          allowPrivilegeEscalation: this.value.allowPrivilegeEscalation || false,
          runAsNonRoot:             this.value.runAsNonRoot || false,
          readOnlyRootFilesystem:   this.value.readOnlyRootFilesystem || false,
          capabilities:             this.value.capabilities || { add: [], drop: [] },
          runAsUser:                this.value.runAsUser,
          seccompProfile:           this.value.seccompProfile,
          fsGroup:                  this.value.fsGroup,
        }
      };
    } else {
      return {
        securityContext: {
          ...this.value,
          fsGroup:        this.value.fsGroup,
          runAsNonRoot:   this.value.runAsNonRoot || false,
          runAsUser:      this.value.runAsUser,
          seccompProfile: this.value.seccompProfile,
        }
      };
    }
  },

  computed: {
    isView() {
      return this.mode === _VIEW;
    },

    ...mapGetters({ t: 'i18n/t' })
  },

  methods: {
    update() {
      const securityContext = {
        ...this.value,
        ...this.securityContext,
      };

      if (securityContext.privileged) {
        securityContext.allowPrivilegeEscalation = true;
        delete securityContext.seccompProfile;
      }

      if (securityContext.fsGroup === '') {
        delete securityContext.fsGroup;
      }

      if (securityContext.runAsUser === '') {
        delete securityContext.runAsUser;
      }

      this.$emit('update:value', securityContext);
    }

  }
};
</script>

<template>
  <div
    v-if="formType === 'pod'"
  >
    <div class="row">
      <h3>{{ t('workload.container.security.podFsGroup') }}</h3>
    </div>
    <div class="row">
      <div
        class="col span-6"
        data-testid="input-security-fsGroup"
      >
        <LabeledInput
          v-model:value.number="securityContext.fsGroup"
          type="number"
          :mode="mode"
          :label="t('workload.container.security.fsGroup')"
          @update:value="update"
        />
      </div>
    </div>
  </div>
  <div
    v-if="formType === 'container'"
  >
    <div
      v-if="formType === 'pod'"
      class="spacer"
    />
    <div class="row">
      <div
        data-testid="input-security-privileged"
        class="col span-6"
      >
        <div class="row">
          <h3>{{ t('workload.container.security.privileged.title') }}</h3>
        </div>
        <div class="row">
          <Checkbox
            v-model:value="securityContext.privileged"
            :mode="mode"
            label-key="workload.container.security.privileged.true"
            @update:value="update"
          />
        </div>
      </div>
      <div
        v-if="!securityContext.privileged"
        data-testid="input-security-allowPrivilegeEscalation"
        class="col span-6"
      >
        <div class="row">
          <h3>{{ t('workload.container.security.allowPrivilegeEscalation.title') }}</h3>
        </div>
        <div class="row">
          <Checkbox
            v-model:value="securityContext.allowPrivilegeEscalation"
            :mode="mode"
            label-key="workload.container.security.allowPrivilegeEscalation.true"
            @update:value="update"
          />
        </div>
      </div>
    </div>
  </div>
  <div v-if="!securityContext.privileged && formType === 'container' || formType === 'pod'">
    <div class="spacer" />
    <SeccompProfile
      v-model:value="securityContext.seccompProfile"
      :mode="mode"
      :initialType="'None'"
      :seccomp-profile-types="seccompProfileTypes"
      :title="t('workload.container.security.seccompProfile.container')"
      @update:value="update"
    />
  </div>
  <div>
    <div class="spacer" />
    <div class="row">
      <div
        data-testid="input-security-runasNonRoot"
        class="col span-6"
      >
        <div class="row">
          <h3>{{ t('workload.container.security.runAsNonRoot.title') }}</h3>
        </div>
        <div class="row">
          <Checkbox
            v-model:value="securityContext.runAsNonRoot"
            :mode="mode"
            label-key="workload.container.security.runAsNonRoot.true"
            @update:value="update"
          />
        </div>
      </div>
      <div
        class="col span-6"
        data-testid="input-security-runAsUser"
      >
        <div class="row">
          <h3>{{ t('workload.container.security.runAsUser.title') }}</h3>
        </div>
        <div class="row">
          <LabeledInput
            v-model:value.number="securityContext.runAsUser"
            :label="t('workload.container.security.runAsUser.label')"
            :mode="mode"
            @update:value="update"
          />
        </div>
      </div>
    </div>
  </div>
  <div v-if="formType === 'container'">
    <div class="spacer" />
    <div
      class="row mb-10"
    >
      <div
        data-testid="input-security-readOnlyRootFilesystem"
        class="col span-6"
      >
        <div class="row">
          <h3>{{ t('workload.container.security.readOnlyRootFilesystem.title') }}</h3>
        </div>
        <div class="row">
          <Checkbox
            v-model:value="securityContext.readOnlyRootFilesystem"
            :mode="mode"
            label-key="workload.container.security.readOnlyRootFilesystem.true"
            @update:value="update"
          />
        </div>
      </div>
    </div>
  </div>
  <div v-if="formType === 'container'">
    <div class="spacer" />
    <div class="row">
      <h3>{{ t('workload.container.security.capabilities.title') }}</h3>
    </div>
    <div class="row">
      <div
        data-testid="input-security-add"
        class="col span-6"
      >
        <LabeledSelect
          v-model:value="securityContext.capabilities.add"
          :taggable="true"
          :close-on-select="false"
          :mode="mode"
          :multiple="true"
          :label="t('workload.container.security.capabilities.add')"
          :options="allCapabilities"
          :disabled="mode==='view'"
          @update:value="update"
        />
      </div>
      <div
        data-testid="input-security-drop"
        class="col span-6"
      >
        <LabeledSelect
          v-model:value="securityContext.capabilities.drop"
          :close-on-select="false"
          :taggable="true"
          :multiple="true"
          :mode="mode"
          :label="t('workload.container.security.capabilities.drop')"
          :options="allCapabilities"
          :disabled="mode==='view'"
          @update:value="update"
        />
      </div>
    </div>
  </div>
</template>
