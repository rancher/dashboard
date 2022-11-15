
<script>
import { Banner } from '@components/Banner';
import AsyncButton from '@shell/components/AsyncButton';

export default {
  components: {
    AsyncButton,
    Banner
  },

  props: {
    tArgs: {
      type:     Object,
      required: true,
      default:  () => { },
    },
    disable: {
      type:     Function,
      required: true,
      default:  () => { },
    },
    edit: {
      type:     Function,
      required: true,
      default:  () => { },
    }
  },

  computed: {
    values() {
      return Object.entries(this.table);
    }
  },
};
</script>

<template>
  <div>
    <Banner
      color="success clearfix"
      class="banner"
    >
      <div class="text">
        {{ t('authConfig.stateBanner.enabled', tArgs) }}
      </div>
      <slot name="actions" />
      <button
        type="button"
        class="btn-sm role-primary"
        @click="edit"
      >
        {{ t('action.edit') }}
      </button>
      <AsyncButton
        class="ml-10"
        mode="disable"
        size="sm"
        action-color="bg-error"
        @click="disable"
      />
    </Banner>

    <table
      v-if="!!$slots.rows"
      class="values"
    >
      <slot name="rows" />
    </table>
  </div>
</template>

<style lang="scss" scoped>
.banner {
  display: flex;
    align-items: center;
  .text {
    flex: 1;
  }
}

.values {
  tr td:not(:first-of-type) {
    padding-left: 10px;
  }
}

</style>
