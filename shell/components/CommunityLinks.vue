<script>
import SimpleBox from '@shell/components/SimpleBox';
import AppModal from '@shell/components/AppModal.vue';
import Closeable from '@shell/mixins/closeable';
import { MANAGEMENT } from '@shell/config/types';
import { SETTING } from '@shell/config/settings';
import { mapGetters } from 'vuex';
import { isRancherPrime } from '@shell/config/version';
import { fetchLinks } from '@shell/config/home-links';
import { processLink } from '@shell/plugins/clean-html';

// i18n-ignore footer.wechat.title, footer.wechat.modalText, footer.wechat.modalText2
export default {
  name: 'CommunityLinks',

  components: { SimpleBox, AppModal },

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
    this.links = await fetchLinks(this.$store, this.hasSupport, this.isSupportPage, (str) => this.t(str));
  },

  data() {
    return { links: {}, showWeChatModal: false };
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
        all.push(...this.links.defaults.filter((link) => link.enabled));
      }

      // Process the links
      return all.map((item) => ({
        ...item,
        value: processLink(item.value)
      }));
    }
  },
  methods: {
    show() {
      this.showWeChatModal = true;
    },
    close() {
      this.showWeChatModal = false;
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
        v-for="(link, i) in options"
        :key="i"
        class="support-link"
      >
        <router-link
          v-if="link.value.startsWith('/') "
          :to="link.value"
          role="link"
          :aria-label="link.label"
        >
          {{ link.label }}
        </router-link>
        <a
          v-else
          :href="link.value"
          rel="noopener noreferrer nofollow"
          target="_blank"
          role="link"
          :aria-label="link.label"
        > {{ link.label }} </a>
      </div>
      <slot />
      <div
        v-if="selectedLocaleLabel === t('locale.zh-hans')"
        class="support-link"
      >
        <a
          class="link"
          tabindex="0"
          :aria-label="t('footer.wechat.title')"
          role="link"
          @click="show"
          @keyup.enter="show"
        >
          {{ t('footer.wechat.title') }}
        </a>
      </div>
    </SimpleBox>
    <app-modal
      v-if="showWeChatModal"
      name="wechat-modal"
      height="auto"
      :width="640"
      @close="close"
    >
      <div class="wechat-modal">
        <h1>{{ t('footer.wechat.modalText') }}</h1>
        <h1>{{ t('footer.wechat.modalText2') }}</h1>
        <div class="qr-img" />
        <div>
          <button
            class="btn role-primary"
            tabindex="0"
            :aria-label="t('generic.close')"
            role="button"
            @click="close"
            @keyup.enter="close"
            @keyup.space="close"
          >
            {{ t('generic.close') }}
          </button>
        </div>
      </div>
    </app-modal>
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
