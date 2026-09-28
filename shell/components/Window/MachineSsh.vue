<script>
import ContainerShell from './ContainerShell';

export default {
  extends: ContainerShell,

  props: {
    // The definition of the tab itself
    machine: {
      type:     Object,
      required: true,
    },
  },

  methods: {
    getSocketUrl() {
      return this.machine.links.shell.replace(/^http/, 'ws');
    }
  }
};
</script>
