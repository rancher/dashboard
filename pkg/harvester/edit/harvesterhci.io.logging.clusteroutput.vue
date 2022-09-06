<script>
import CreateEditView from './harvesterhci.io.logging.output';

export default {
  extends: CreateEditView,
  created() {
    if (this.isCreate) {
      this.value.metadata.namespace = 'cattle-logging-system';
    }
  }
};
</script>
