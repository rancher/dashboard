<script>
import Stack from './index';

export default {
  extends: Stack,
  props:   {
    direction: {
      type:    String,
      default: 'vertical'
    }
  }
};
</script>
