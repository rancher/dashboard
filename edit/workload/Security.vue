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
    }
  },
  data() {
    const capabilities = ['ALL',
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
    const container = containers[0] || { securityContext: {} };
    const { imagePullPolicy = 'always' } = container;
    const {
      defaultAddCapabilities = [], runAsRoot = true, readOnlyRootFilesystem = false, requiredDropCapabilities = []
    } = container.securityContext || {};

    return {
      container, privileged, allowPrivilegeEscalation, capabilities, defaultAddCapabilities, hostPID, runAsRoot, readOnlyRootFilesystem, hostIPC, imagePullPolicy, requiredDropCapabilities
    };
  },
  computed: {
    // only show capabilities not added to 'add' list
    dropCapabilities() {
      const addCapabilities = this.defaultAddCapabilities || [];

      return this.capabilities.filter((opt) => {
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
          defaultAddCapabilities:   this.defaultAddCapabilities,
          runAsRoot:                this.runAsRoot,
          readOnlyRootFilesystem:   this.readOnlyRootFilesystem,
          requiredDropCapabilities: this.requiredDropCapabilities,
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
        <RadioGroup v-model="imagePullPolicy" :options="['always', 'ifNotPresent', 'never']" :labels="['Always', 'If not present', 'Never']" />
      </div>
      <div class="col span-4">
        <h5>Privileged</h5>
        <RadioGroup v-model="privileged" :options="[false,true]" :labels="['No', 'Yes: container has full access to the host']" />
      </div>
      <div class="col span-4">
        <h5>Privilege Escalation</h5>
        <RadioGroup v-model="allowPrivilegeEscalation" :disabled="privileged" :options="[false,true]" :labels="['No', 'Yes: container can gain more privileges than its parent process']" />
      </div>
    </div>
    <div class="row mb-20">
      <div class="col span-6">
        <h5>
          Use Host's PID Namespace
        </h5>
        <RadioGroup v-model="hostPID" :options="[false, true]" :labels="['No', 'Yes']" />
      </div>
      <div class="col span-6">
        <h5>
          Use Host's IPC Namespace
        </h5>
        <RadioGroup v-model="hostIPC" :options="[false, true]" :labels="['No', 'Yes']" />
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
          @input="e=>runAsRoot = !e"
        />
      </div>
      <div class="col span-6">
        <h5>
          Read-Only Root Filesystem
        </h5>
        <RadioGroup v-model="readOnlyRootFilesystem" :options="[false, true]" :labels="['No', 'Yes: container has a read-only root filesystem']" />
      </div>
    </div>
    <div class="row mb-20">
      <div class="col span-6">
        <h5>Add Capabilities</h5>
        <v-select
          v-model="defaultAddCapabilities"
          multiple
          :options="capabilities"
          @input="update"
        />
      </div>
      <div class="col span-6">
        <h5>Drop Capabilities</h5>
        <v-select
          :value="requiredDropCapabilities"
          multiple
          :options="dropCapabilities"
          @input="e=>{requiredDropCapabilities = e; update()}"
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
