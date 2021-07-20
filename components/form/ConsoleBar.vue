<script>
import ButtonDropdown from '@/components/ButtonDropdown';

export default {
  name: 'ConsoleBar',

  components: { ButtonDropdown },

  props: {
    resource: {
      type:     Object,
      required: true,
      default:  () => {
        return {};
      }
    },
  },

  data() {
    return { };
  },

  computed: {
    isDown() {
      return this.isEmpty(this.resource);
    },

    isRunning() {
      return this.resource.actualState === 'Running';
    },

    options() {
      return [{
        label:  'Open in Web VNC',
        value:  'vnc',
      }, {
        label:  'Open in Serial Console',
        value:  'serial',
      }];
    }
  },

  methods: {
    handleDropdown(c) {
      this.show(c.value);
    },

    show(type) {
      let uid = this.resource.metadata?.ownerReferences?.[0]?.uid;

      if (uid === undefined) {
        uid = this.resource.metadata.uid;
      }

      const host = window.location.host;
      const pathname = window.location.pathname.replace('/kubevirt.io.virtualmachine', '');

      const url = `https://${ host }${ pathname }/console/${ uid }/${ type }`;

      window.open(url, '_blank', 'toolbars=0,width=900,height=700,left=0,top=0');
    },

    isEmpty(o) {
      return o !== undefined && Object.keys(o).length === 0;
    }
  }
};
</script>

<template>
  <div class="overview-web-console">
    <ButtonDropdown
      :disabled="!isRunning"
      :no-drop="!isRunning"
      button-label="Console"
      :dropdown-options="options"
      size="sm"
      @click-action="handleDropdown"
    />
  </div>
</template>

<style lang="scss">
.overview-web-console {
  .btn {
    line-height: 24px;
    min-height: 24px;
  }
}
</style>
