
<script>
import { Banner } from '@components/Banner';
import { HIDE_LOCAL_AUTH_PROVIDER } from '@shell/store/features';
import { RcButton } from '@components/RcButton';

export default {
  components: { Banner, RcButton },

  data() {
    return { disableLocalAuth: this.$store.getters['features/get'](HIDE_LOCAL_AUTH_PROVIDER) };
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
        <br><br>
        <span
          v-if="disableLocalAuth"
          v-clean-html="t('authConfig.bannerEnabledAuthProvider', {}, true)"
        />
      </div>

      <slot name="actions" />

      <rc-button
        size="medium"
        class="banner-action"
        @click="edit"
      >
        {{ t('action.edit') }}
      </rc-button>

      <rc-button
        size="medium"
        class="banner-action"
        @click="showDisableModal"
      >
        {{ t('generic.disable') }}
      </rc-button>
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

  // The Banner's content is a flex row that defaults to align-items: stretch, so
  // the buttons stretch to match the tall text block. Keep them at their natural
  // height instead.
  .banner-action {
    align-self: center;
  }
}

.values {
  border-spacing: 8px 8px;  // Add spacing between columns and rows
  margin-left: -8px; // Move the table back to the left, to compensate for the spacing from above on the left-hand column
}

</style>
