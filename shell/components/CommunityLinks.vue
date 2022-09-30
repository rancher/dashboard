<script>
import { options } from '@shell/config/footer';
import SimpleBox from '@shell/components/SimpleBox';
import Closeable from '@shell/mixins/closeable';
import { MANAGEMENT } from '@shell/config/types';
import { SETTING } from '@shell/config/settings';
import { mapGetters } from 'vuex';

export default {
  name: 'CommunityLinks',

  components: { SimpleBox },

  props: {
    linkOptions: {
      type:    Object,
      default: () => {
        return {};
      },
    },
  },

  mixins: [Closeable],

  async fetch() {
    // If user already have custom links and uiIssueSetting Doc URL set
    // This should already be in the uiCustomLinks
    try {
      this.uiCustomLinks = await this.$store.dispatch('management/find', { type: MANAGEMENT.SETTING, id: SETTING.UI_CUSTOM_LINKS });
    } catch (err) {

    }

    // Fallback:
    // NB: this.uiIssueSetting is deprecated now.
    if (!this.uiCustomLinks) {
      try {
        this.uiIssuesSetting = await this.$store.dispatch('management/find', { type: MANAGEMENT.SETTING, id: SETTING.ISSUES });
      } catch (err) {

      }
    }
  },

  data() {
    return { uiCustomLinks: null, uiIssuesSetting: null };
  },

  computed: {

    ...mapGetters('i18n', [
      'selectedLocaleLabel'
    ]),

    hasOptions() {
      return !!Object.keys(this.options).length || !!Object.keys(this.$slots).length;
    },

    options() {
      // Link options are provided
      if (Object.keys(this.linkOptions).length > 0) {
        return this.linkOptions;
      }

      // Custom links set from settings
      if (!!this.uiCustomLinks?.value) {
        try {
          const customLinks = JSON.parse(this.uiCustomLinks.value);

          if (Array.isArray(customLinks)) {
            return customLinks.reduce((prev, curr) => {
              prev[curr.key] = curr.value;

              return prev;
            }, {});
          }
        } catch (e) {
          console.error('Could not parse custom links setting', e); // eslint-disable-line no-console
        }
      }

      // Fallback
      return options(false, this.uiIssuesSetting?.value);
    },
  },
  methods: {
    getLabel(label) {
      return this.$store.getters['i18n/withFallback'](`customLinks.defaults.${ label }`, null, label);
    },

    show() {
      this.$modal.show('wechat-modal');
    },
    close() {
      this.$modal.hide('wechat-modal');
    }
  },
};
</script>

<template>
  <div v-if="hasOptions">
    <SimpleBox :pref="pref" :pref-key="prefKey">
      <template #title>
        <h2>
          {{ t('customLinks.displayTitle') }}
        </h2>
      </template>
      <div v-for="(value, name) in options" :key="name" class="support-link">
        <n-link v-if="value.startsWith('/') " :to="value">
          {{ getLabel(name) }}
        </n-link>
        <a v-else :href="value" rel="noopener noreferrer nofollow" target="_blank"> {{ getLabel(name) }} </a>
      </div>
      <slot />
      <div v-if="selectedLocaleLabel === t('locale.zh-hans')" class="support-link">
        <a class="link" @click="show">
          {{ t('footer.wechat.title') }}
        </a>
      </div>
    </SimpleBox>
    <modal
      name="wechat-modal"
      height="auto"
      :width="640"
    >
      <div class="wechat-modal">
        <h1>{{ t('footer.wechat.modalText') }}</h1>
        <div class="qr-img">
        </div>
        <div>
          <button class="btn role-primary" @click="close">
            {{ t('generic.close') }}
          </button>
        </div>
      </div>
    </modal>
  </div>
</template>

<style lang='scss' scoped>
  h2 {
    display: flex;
    align-items: center;

    i {
      font-size: 12px;
      margin-left: 5px;
    }
  }
  .support-link:not(:last-child) {
    margin-bottom: 15px;
  }

  .wechat-modal {
    margin: 60px;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .link {
    cursor: pointer;
  }

  .btn {
    margin: 20px auto 0;
  }

  .qr-img {
    background-image: url('../assets/images/wechat-qr-code.jpg');
    background-repeat: no-repeat;
    background-size: cover;
    background-position: center center;
    height: 128px;
    width: 128px;
    margin: 15px auto 10px;
  }
</style>
