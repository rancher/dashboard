<script>
import { options } from '@shell/config/footer';
import SimpleBox from '@shell/components/SimpleBox';
import Closeable from '@shell/mixins/closeable';
import { MANAGEMENT } from '@shell/config/types';
import { SETTING } from '@shell/config/settings';
import { mapGetters } from 'vuex';

export default {
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
    this.uiIssuesSetting = await this.$store.dispatch('management/find', { type: MANAGEMENT.SETTING, id: SETTING.ISSUES });
    this.communitySetting = await this.$store.dispatch('management/find', { type: MANAGEMENT.SETTING, id: SETTING.COMMUNITY_LINKS });
  },

  data() {
    return { uiIssuesSetting: null, communitySetting: null };
  },

  computed: {

    ...mapGetters('i18n', [
      'selectedLocaleLabel'
    ]),

    options() {
      if (Object.keys(this.linkOptions).length > 0) {
        return this.linkOptions;
      }

      if (this.communitySetting?.value === 'false') {
        return options(this.uiIssuesSetting?.value, true);
      }

      return options( this.uiIssuesSetting?.value);
    },
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
  <div>
    <SimpleBox :title="t('landing.community.title')" :pref="pref" :pref-key="prefKey">
      <div v-for="(value, name) in options" :key="name" class="support-link">
        <a v-t="name" :href="value" target="_blank" rel="noopener noreferrer nofollow" />
      </div>

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
  .support-link:not(:first-child) {
    margin-top: 15px;
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
    background-image: url('~shell/assets/images/wechat-qr-code.jpg');
    background-repeat: no-repeat;
    background-size: cover;
    background-position: center center;
    height: 128px;
    width: 128px;
    margin: 15px auto 10px;
  }
</style>
