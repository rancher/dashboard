<script>
import { RadioGroup } from '@components/Form/Radio';
import { LabeledInput } from '@components/Form/LabeledInput';
import { _VIEW } from '@shell/config/query-params';
import { mapGetters } from 'vuex';
import LabeledSelect from '@shell/components/form/LabeledSelect';

export default {
  components: {
    RadioGroup,
    LabeledInput,
    LabeledSelect
  },

  props: {
    value: {
      type:    Object,
      default: () => {
        return {};
      }
    },
    mode: { type: String, default: 'edit' }
  },

  data() {
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
      'SYSLOGSYS_ADMIN',
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

    const {
      capabilities = {},
      runAsRoot = true,
      readOnlyRootFilesystem = false,
      privileged = false,
      allowPrivilegeEscalation = true,
      runAsUser
    } = this.value;
    const {
      add = [],
      drop = []
    } = capabilities;

    return {
      privileged,
      allowPrivilegeEscalation,
      allCapabilities,
      runAsRoot,
      readOnlyRootFilesystem,
      add,
      drop,
      runAsUser
    };
  },

  computed: {
    isView() {
      return this.mode === _VIEW;
    },

    ...mapGetters({ t: 'i18n/t' })
  },

  watch: {
    privileged(neu) {
      if (neu) {
        this.allowPrivilegeEscalation = true;
      }
    }
  },

  methods: {
    update() {
      const securityContext = {
        runAsRoot:                this.runAsRoot,
        readOnlyRootFilesystem:   this.readOnlyRootFilesystem,
        capabilities:             { add: this.add, drop: this.drop },
        privileged:               this.privileged,
        allowPrivilegeEscalation: this.allowPrivilegeEscalation,
        runAsUser:                this.runAsUser,
      };

      this.$emit('input', securityContext);
    }
  }
};
</script>

<template>
  <div>
    <div>
      <div class="row">
        <div
          data-testid="input-security-privileged"
          class="col span-6"
        >
          <RadioGroup
            v-model="privileged"
            name="privileged"
            :label="t('workload.container.security.privileged.label')"
            :options="[false,true]"
            :labels="[t('workload.container.security.privileged.false'), t('workload.container.security.privileged.true')]"
            :mode="mode"
            @input="update"
          />
        </div>
        <div
          v-if="!privileged"
          data-testid="input-security-allowPrivilegeEscalation"
          class="col span-6"
        >
          <RadioGroup
            v-model="allowPrivilegeEscalation"
            name="allowPrivilegeEscalation"
            :label="t('workload.container.security.allowPrivilegeEscalation.label')"
            :disabled="privileged"
            :options="[false,true]"
            :labels="[t('workload.container.security.allowPrivilegeEscalation.false'), t('workload.container.security.allowPrivilegeEscalation.true')]"
            :mode="mode"
            @input="update"
          />
        </div>
      </div>
    </div>
    <div class="spacer" />

    <div>
      <div class="row">
        <div
          data-testid="input-security-runasNonRoot"
          class="col span-6"
        >
          <RadioGroup
            name="runasNonRoot"
            :label="t('workload.container.security.runAsNonRoot.label')"
            :value="!runAsRoot"
            :options="[false, true]"
            :labels="[t('workload.container.security.runAsNonRoot.false'), t('workload.container.security.runAsNonRoot.true')]"
            :mode="mode"
            @input="e=>{runAsRoot = !e; update()}"
          />
        </div>
        <div
          data-testid="input-security-readOnlyRootFilesystem"
          class="col span-6"
        >
          <RadioGroup
            v-model="readOnlyRootFilesystem"
            name="readOnlyRootFilesystem"
            :label="t('workload.container.security.readOnlyRootFilesystem.label')"
            :options="[false, true]"
            :labels="[t('workload.container.security.readOnlyRootFilesystem.false'), t('workload.container.security.readOnlyRootFilesystem.true')]"
            :mode="mode"
            @input="update"
          />
        </div>
      </div>
    </div>
    <div class="spacer" />

    <div
      data-testid="input-security-runAsUser"
      class="row mb-10"
    >
      <div class="col span-6">
        <LabeledInput
          v-model.number="runAsUser"
          :label="t('workload.container.security.runAsUser')"
          :mode="mode"
          @input="update"
        />
      </div>
    </div>

    <div class="row">
      <div
        data-testid="input-security-add"
        class="col span-6"
      >
        <LabeledSelect
          v-model="add"
          :taggable="true"
          :close-on-select="false"
          :mode="mode"
          :multiple="true"
          :label="t('workload.container.security.addCapabilities')"
          :options="allCapabilities"
          :disabled="mode==='view'"
          @input="update"
        />
      </div>
      <div
        data-testid="input-security-drop"
        class="col span-6"
      >
        <LabeledSelect
          v-model="drop"
          :close-on-select="false"
          :taggable="true"
          :multiple="true"
          :mode="mode"
          :label="t('workload.container.security.dropCapabilities')"
          :options="allCapabilities"
          :disabled="mode==='view'"
          @input="update"
        />
      </div>
    </div>
  </div>
</template>
