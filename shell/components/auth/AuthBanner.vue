
<script>
import { Banner } from '@components/Banner';

export default {
  components: { Banner },

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

  methods: {
    showDisableModal() {
      this.$store.dispatch('management/promptModal', {
        component:      'DisableAuthProviderDialog',
        customClass:    'remove-modal',
        modalWidth:     '400',
        height:         'auto',
        styles:         'max-height: 100vh;',
        componentProps: {
          disableCb: () => {
            this.disable();
          }
        }
      });
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
      <button
        type="button"
        class="ml-10 btn-sm role-primary bg-error"
        @click="showDisableModal"
      >
        {{ t('generic.disable') }}
      </button>
    </Banner>

    <table
      v-if="!!$slots.rows"
      class="values"
    >
      <slot name="rows" />
    </table>

    <slot
      v-if="$slots.footer"
      name="footer"
    />
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
