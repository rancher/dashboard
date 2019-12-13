<script>
import Permissions from './Permissions';

export default {
  components: { Permissions },

  props: {
    spec: {
      type:     Object,
      required: true,
    },
    mode: {
      type:     String,
      required: true,
    },
  },

  data() {
    if ( !this.spec.permissions ) {
      this.spec.permissions = [];
    }

    if ( !this.spec.globalPermissions ) {
      this.spec.globalPermissions = [];
    }

    return {};
  }
};
</script>
<template>
  <div>
    <div class="row">
      <div class="col span-12">
        <Permissions v-model="spec.permissions" :mode="mode" />
      </div>
    </div>

    <hr />

    <div class="row">
      <div class="col span-12">
        <Permissions v-model="spec.globalPermissions" label="Global Permissions" :mode="mode" />
      </div>
    </div>
  </div>
</template>
