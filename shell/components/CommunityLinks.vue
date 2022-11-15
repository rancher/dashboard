<script>
import SimpleBox from '@shell/components/SimpleBox';
import Closeable from '@shell/mixins/closeable';
import { MANAGEMENT } from '@shell/config/types';
import { SETTING } from '@shell/config/settings';
import { mapGetters } from 'vuex';
import { isRancherPrime } from '@shell/config/version';
import { fetchLinks } from '@shell/config/home-links';

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
    isSupportPage: {
      type:    Boolean,
      default: false,
    },
  },

  mixins: [Closeable],

  async fetch() {
    this.links = await fetchLinks(this.$store, this.hasSupport, this.isSupportPage, str => this.t(str));
  },

  data() {
    return { links: {} };
  },

  computed: {
    ...mapGetters('i18n', [
      'selectedLocaleLabel'
    ]),

    hasOptions() {
      return !!Object.keys(this.options).length || !!Object.keys(this.$slots).length;
    },

    hasSupport() {
      return isRancherPrime() || this.$store.getters['management/byId'](MANAGEMENT.SETTING, SETTING.SUPPORTED )?.value === 'true';
    },

    options() {
      // Use linkOptions if provided - used by Harvester
      if (this.linkOptions && Object.keys(this.linkOptions).length) {
        const options = [];

        Object.keys(this.linkOptions).forEach((key) => {
          options.push({
            key,
            label: this.t(key),
            value: this.linkOptions[key]
          });
        });

        return options;
      }

      // Combine the links
      const all = [];

      if (this.links.custom) {
        all.push(...this.links.custom);
      }

      if (this.links.defaults) {
        all.push(...this.links.defaults.filter(link => link.enabled));
      }

      return all;
    }
  },
  methods: {
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
    <SimpleBox
      :pref="pref"
      :pref-key="prefKey"
    >
      <template #title>
        <h2>
          {{ t('customLinks.displayTitle') }}
        </h2>
      </template>
      <div
        v-for="link in options"
        :key="link.label"
        class="support-link"
      >
        <n-link
          v-if="link.value.startsWith('/') "
          :to="link.value"
        >
          {{ link.label }}
        </n-link>
        <a
          v-else
          :href="link.value"
          rel="noopener noreferrer nofollow"
          target="_blank"
        > {{ link.label }} </a>
      </div>
      <slot />
      <div
        v-if="selectedLocaleLabel === t('locale.zh-hans')"
        class="support-link"
      >
        <a
          class="link"
          @click="show"
        >
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
        <div class="qr-img" />
        <div>
          <button
            class="btn role-primary"
            @click="close"
          >
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
