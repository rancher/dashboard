<script>
import { addParams } from '@/utils/url';
import ContainerShell from './ContainerShell';

export default {
  extends: ContainerShell,

  props:      {
    // The definition of the tab itself
    cluster: {
      type:     Object,
      required: true,
    },
  },

  methods: {
    getSocketUrl() {
      let cmd = '/bin/sh';

      const isWindows = this.$store.getters['currentCluster'].providerOs === 'windows';

      if (isWindows) {
        cmd = ['cmd'];
      }

      const url = addParams(`${ this.cluster.links.shell.replace(/^http/, 'ws') }`, {
        stdout:    1,
        stdin:     1,
        stderr:    1,
        tty:       1,
        command:   cmd
      });

      return url;
    }
  }
};
</script>
