<script>
import Checkbox from '@components/Form/Checkbox/Checkbox.vue';
import { LabeledInput } from '@components/Form/LabeledInput';
import { _VIEW, _EDIT } from '@shell/config/query-params';
import { mapGetters } from 'vuex';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import SeccompProfile from '@shell/components/form/SeccompProfile';

export const FORM_TYPES = {
  CONTAINER: 'container',
  POD:       'pod'
};

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
    formType:            { type: String, default: FORM_TYPES.CONTAINER },
    mode:                { type: String, default: _EDIT },
    seccompProfileTypes: {
      type:    Array,
      default: () => []
    }
  },

  data() {
    if (this.formType === FORM_TYPES.CONTAINER) {
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
        },
        afterPrivilegedTickedMessage: '',
        FORM_TYPES,
      };
    } else {
      return {
        securityContext: {
          ...this.value,
          fsGroup:        this.value.fsGroup,
          runAsNonRoot:   this.value.runAsNonRoot || false,
          runAsUser:      this.value.runAsUser,
          seccompProfile: this.value.seccompProfile,
        },
        afterPrivilegedTickedMessage: '',
        FORM_TYPES,
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
    focus() {
      const firstFocusable = this.$refs.firstFocusable;

      // First, try the preferred declarative approach using the ref.
      if (firstFocusable && typeof firstFocusable.focus === 'function') {
        firstFocusable.focus();
      }
    },

    update() {
      const securityContext = {
        ...this.value,
        ...this.securityContext,
      };

      if (securityContext.privileged) {
        securityContext.allowPrivilegeEscalation = true;
        delete securityContext.seccompProfile;
        this.afterPrivilegedTickedMessage = this.t('workload.container.security.privileged.afterTick.true');
      } else {
        this.afterPrivilegedTickedMessage = this.t('workload.container.security.privileged.afterTick.false');
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
    v-if="formType === FORM_TYPES.POD"
  >
    <div class="row">
      <div
        class="col span-6"
        data-testid="input-security-fsGroup"
      >
        <fieldset>
          <legend
            id="pod-fs-group-label"
            class="h3-legend"
          >
            {{ t('workload.container.security.podFsGroup') }}
          </legend>
          <LabeledInput
            ref="firstFocusable"
            v-model:value.number="securityContext.fsGroup"
            type="number"
            :mode="mode"
            :label="t('workload.container.security.fsGroup')"
            @update:value="update"
          />
        </fieldset>
      </div>
    </div>
  </div>
  <div
    v-if="formType === FORM_TYPES.CONTAINER"
  >
    <div
      class="row"
    >
      <div class="col span-6">
        <fieldset>
          <legend class="h3-legend">
            {{ t('workload.container.security.privileged.title') }}
          </legend>
          <div data-testid="input-security-privileged">
            <Checkbox
              ref="firstFocusable"
              v-model:value="securityContext.privileged"
              :mode="mode"
              label-key="workload.container.security.privileged.true"
              aria-describedby="privilege-help"
              @update:value="update"
            />
            <p
              id="privilege-help"
              class="sr-only"
              aria-hidden="true"
            >
              {{ t('workload.container.security.privileged.help') }}
            </p>
          </div>
        </fieldset>
      </div>
      <p
        id="after-privileged-ticked"
        role="status"
        aria-live="polite"
        class="sr-only"
      >
        {{ afterPrivilegedTickedMessage }}
      </p>

      <div
        v-if="!securityContext.privileged"
        class="col span-6"
      >
        <fieldset>
          <legend class="h3-legend">
            {{ t('workload.container.security.allowPrivilegeEscalation.title') }}
          </legend>
          <div data-testid="input-security-allowPrivilegeEscalation">
            <Checkbox
              v-model:value="securityContext.allowPrivilegeEscalation"
              :mode="mode"
              label-key="workload.container.security.allowPrivilegeEscalation.true"
              @update:value="update"
            />
          </div>
        </fieldset>
      </div>
    </div>
  </div>
  <div v-if="!securityContext.privileged && formType === FORM_TYPES.CONTAINER || formType === FORM_TYPES.POD">
    <div class="spacer" />
    <SeccompProfile
      v-model:value="securityContext.seccompProfile"
      :mode="mode"
      :seccomp-profile-types="seccompProfileTypes"
      :title="t('workload.container.security.seccompProfile.container')"
      @update:value="update"
    />
  </div>
  <div>
    <div class="spacer" />
    <div class="row">
      <div class="col span-6">
        <fieldset>
          <legend class="h3-legend">
            {{ t('workload.container.security.runAsNonRoot.title') }}
          </legend>
          <div data-testid="input-security-runasNonRoot">
            <Checkbox
              v-model:value="securityContext.runAsNonRoot"
              :mode="mode"
              label-key="workload.container.security.runAsNonRoot.true"
              @update:value="update"
            />
          </div>
        </fieldset>
      </div>
      <div
        class="col span-6"
        data-testid="input-security-runAsUser"
      >
        <fieldset>
          <legend
            id="run-as-user-label"
            class="h3-legend"
          >
            {{ t('workload.container.security.runAsUser.title') }}
          </legend>
          <LabeledInput
            v-model:value.number="securityContext.runAsUser"
            :label="t('workload.container.security.runAsUser.label')"
            :mode="mode"
            @update:value="update"
          />
        </fieldset>
      </div>
    </div>
  </div>
  <div v-if="formType === FORM_TYPES.CONTAINER">
    <div class="spacer" />
    <div class="row">
      <div class="col span-6">
        <fieldset>
          <legend class="h3-legend">
            {{ t('workload.container.security.readOnlyRootFilesystem.title') }}
          </legend>
          <div data-testid="input-security-readOnlyRootFilesystem">
            <Checkbox
              v-model:value="securityContext.readOnlyRootFilesystem"
              :mode="mode"
              label-key="workload.container.security.readOnlyRootFilesystem.true"
              @update:value="update"
            />
          </div>
        </fieldset>
      </div>
    </div>
  </div>
  <div v-if="formType === FORM_TYPES.CONTAINER">
    <div class="spacer" />
    <fieldset>
      <legend class="h3-legend">
        {{ t('workload.container.security.capabilities.title') }}
      </legend>
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
    </fieldset>
  </div>
</template>
