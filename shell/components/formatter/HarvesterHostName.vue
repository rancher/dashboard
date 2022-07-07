<script>
import LinkDetail from '@shell/components/formatter/LinkDetail';
import { HCI } from '@shell/config/labels-annotations';
export default {
  components: { LinkDetail },
  props:      {
    value: {
      type:     [String, Date],
      default: ''
    },
    row: {
      type:     Object,
      required: true
    },
  },
  computed: {
    consoleUrl() {
      const consoleUrl = this.row.metadata?.annotations?.[HCI.HOST_CONSOLE_URL];

      if (!consoleUrl) {
        return '';
      }

      if (!consoleUrl.startsWith('http://') && !consoleUrl.startsWith('https://')) {
        return `http://${ consoleUrl }`;
      }

      return consoleUrl;
    }
  },
  methods: {
    goto() {
      window.open(this.consoleUrl, '_blank');
    }
  },
};
</script>

<template>
  <div class="host-list">
    <span class="overflow">
      <LinkDetail v-model="row.nameDisplay" :row="row" />
    </span>
    <button v-if="consoleUrl" type="button" class="btn btn-sm role-primary console mr-10" @click="goto">
      <span>Console</span>
    </button>
  </div>
</template>

<style lang="scss" scoped>
  .host-list {
    display: flex;
    justify-content: space-between;
    align-items: center;
    .overflow{
      flex: 1;
      overflow:hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
      -o-text-overflow:ellipsis;
    }
    .console {
      width: 122px;
    }
  }
</style>
