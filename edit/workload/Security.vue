<script>
import RadioGroup from '@/components/form/RadioGroup';

export default {
  components: { RadioGroup },
  props:      {
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

    const privileged = !!this.value.privileged;
    const allowPrivilegeEscalation = !!this.value.allowPrivilegeEscalation;
    const { hostIPC = false, hostPID = false, containers = [] } = this.value;
    const container = containers[0] || { };
    const { imagePullPolicy = 'always', securityContext = {} } = container;
    const { capabilities = {}, runAsRoot = true, readOnlyRootFilesystem = false } = securityContext;
    const { add = [], drop = [] } = capabilities;

    return {
      container, privileged, allowPrivilegeEscalation, allCapabilities, hostPID, runAsRoot, readOnlyRootFilesystem, hostIPC, imagePullPolicy, add, drop
    };
  },
  computed: {
    // only show capabilities not added to 'add' list
    dropCapabilities() {
      const addCapabilities = this.defaultAddCapabilities || [];

      return this.allCapabilities.filter((opt) => {
        return !addCapabilities.includes(opt);
      });
    }
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
      const container = {
        ...this.container,
        imagePullPolicy:          this.imagePullPolicy,
        securityContext: {
          runAsRoot:                this.runAsRoot,
          readOnlyRootFilesystem:   this.readOnlyRootFilesystem,
          capabilities:           { add: this.add, drop: this.drop }
        }
      };
      const spec = {
        ...this.value,
        hostIPC:    this.hostIPC,
        hostPID:    this.hostPID,
        containers: [container, ...this.value.containers.slice(1)]
      };

      this.$emit('input', spec );
    }
  }
};
</script>

<template>
  <form @input="update">
    <div class="row mb-20">
      <div class="col span-4">
        <h5>Image Pull Policy</h5>
        <RadioGroup v-model="imagePullPolicy" :options="['always', 'ifNotPresent', 'never']" :labels="['Always', 'If not present', 'Never']" :mode="mode" />
      </div>
      <div class="col span-4">
        <h5>Privileged</h5>
        <RadioGroup v-model="privileged" :options="[false,true]" :labels="['No', 'Yes: container has full access to the host']" :mode="mode" />
      </div>
      <div class="col span-4">
        <h5>Privilege Escalation</h5>
        <RadioGroup v-model="allowPrivilegeEscalation" :disabled="privileged" :options="[false,true]" :labels="['No', 'Yes: container can gain more privileges than its parent process']" :mode="mode" />
      </div>
    </div>
    <div class="row mb-20">
      <div class="col span-6">
        <h5>
          Use Host's PID Namespace
        </h5>
        <RadioGroup v-model="hostPID" :options="[false, true]" :labels="['No', 'Yes']" :mode="mode" />
      </div>
      <div class="col span-6">
        <h5>
          Use Host's IPC Namespace
        </h5>
        <RadioGroup v-model="hostIPC" :options="[false, true]" :labels="['No', 'Yes']" :mode="mode" />
      </div>
    </div>
    <div class="row mb-20">
      <div class="col span-6">
        <h5>
          Run as Non-Root
        </h5>
        <RadioGroup
          :value="!runAsRoot"
          :options="[false, true]"
          :labels="['No', 'Yes: container must run as a non-root user']"
          :mode="mode"
          @input="e=>runAsRoot = !e"
        />
      </div>
      <div class="col span-6">
        <h5>
          Read-Only Root Filesystem
        </h5>
        <RadioGroup v-model="readOnlyRootFilesystem" :options="[false, true]" :labels="['No', 'Yes: container has a read-only root filesystem']" :mode="mode" />
      </div>
    </div>
    <div class="row mb-20">
      <div class="col span-6">
        <label>Add Capabilities</label>
        <v-select
          v-model="add"
          multiple
          :options="allCapabilities"
          :disabled="mode==='view'"
          @input="update"
        />
      </div>
      <div class="col span-6">
        <label>Drop Capabilities</label>
        <v-select
          v-model="drop"
          multiple
          :options="dropCapabilities"
          :disabled="mode==='view'"
          @input="update"
        />
      </div>
    </div>
  </form>
</template>

<style lang='scss'>
  .row.mb-20:not(:last-child){
    border-bottom: 1px solid var(--border)
  }
</style>
