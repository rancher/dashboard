<script>
import CreateEditView from '@shell/edit/logging.banzaicloud.io.output';

export default {
  extends: CreateEditView,
  created() {
    if (this.isCreate) {
      this.value.metadata.namespace = 'cattle-logging-system';
    }
  }
};
</script>
