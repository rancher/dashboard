<template>
  <Loading v-if="$fetchState.pending" />
  <div v-else>
    <slot
      v-if="version === 'v1'"
      :api-request="harborAPIRequest"
      :server-url="harborServerSetting.value"
      :version="harborVersionSetting.value"
    />
    <slot
      v-else-if="version === 'v2'"
      name="v2"
      :api-request="harborAPIRequest"
      :server-url="harborServerSetting.value"
      :version="harborVersionSetting.value"
    />
    <div v-else>
      Harbor Server Is Not Configured Or Current Harbor Version Is Not Supported.
    </div>
  </div>
</template>
<script>
import Loading from '@shell/components/Loading';
import apiRequest from '../mixins/apiRequest.js';

export default {
  mixins:   [apiRequest],
  computed: {
    version() {
      return this.harborVersionSetting?.value ?? 'v1';
    },
  },
  components: { Loading }
};
</script>
