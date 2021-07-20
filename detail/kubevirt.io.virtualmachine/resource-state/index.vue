<script>
const VM = 'VirtualMachine';
const VMI = 'VirtualMachineInstance';
const POD = 'Pod';
const NAMESPACE = 'Namespace';
const NODE = 'Node';
const WARNING = 'Warning';
const ERROR = 'Error';
const Mapping = {
  [VM]:        'VM',
  [VMI]:       'VMI',
  [POD]:       'P',
  [NAMESPACE]: 'NS',
  [NODE]:      'N',
  [WARNING]:   WARNING,
  [ERROR]:     ERROR
};

export default {
  props: {
    value: {
      type:     String,
      default: ''
    },
  },

  data() {
    return { mapping: Mapping };
  },

  computed: {
    isPod() {
      return this.value === POD;
    },
    isVMI() {
      return this.value === VMI;
    },
    isVM() {
      return this.value === VM;
    },
    isNS() {
      return this.value === NAMESPACE;
    },
    isNode() {
      return this.value === NODE;
    },
    isWarning() {
      return this.value === WARNING;
    },
    isError() {
      return this.value === ERROR;
    }
  },
};
</script>

<template>
  <span :class="{'badge-state': true, 'bg-success': isPod, 'bg-vmi': isVMI, 'bg-tip': isVM, 'bg-ns': isNS, 'bg-node': isNode, 'bg-warning': isWarning, 'bg-error': isError}">
    <template>{{ mapping[value] }}</template>
  </span>
</template>

<style lang="scss" scoped>
.badge-state {
    padding: 5px 10px;
    border: 1px solid transparent;
    border-radius: 20px;
    max-width: 250px !important;

    &.bg-info {
      border-color: var(--primary);
    }

    &.bg-error, &.bg-danger {
      border-color: var(--error);
    }

    &.bg-warning {
      border-color: var(--warning);
    }

    &.bg-tip {
      border-color: wheat;
    }

    &.bg-vmi {
      color: #fff;
      border-color: #003366;
      background: #003366;
    }

    &.bg-ns {
      color: #fff;
      border-color: #003300;
      background: #003300;
    }

    &.bg-node {
      color: #fff;
      border-color: #8476d1;
      background: #8476d1;
    }

    // Successful states are de-emphasized by using [text-]color instead of background-color
    &.bg-success {
      color: #fff;
      border-color: var(--success);
      background: var(--success);
    }
  }
</style>
