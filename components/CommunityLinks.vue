<script>
import { options } from '@/config/footer';
import SimpleBox from '@/components/SimpleBox';
import Closeable from '@/mixins/closeable';
import { MANAGEMENT } from '@/config/types';
import { SETTING } from '@/config/settings';
import { mapGetters } from 'vuex';

export default {
  components: { SimpleBox },

  mixins: [Closeable],

  async fetch() {
    this.uiIssuesSetting = await this.$store.dispatch('management/find', { type: MANAGEMENT.SETTING, id: SETTING.ISSUES });
    this.communitySetting = await this.$store.dispatch('management/find', { type: MANAGEMENT.SETTING, id: SETTING.COMMUNITY_LINKS });
  },

  data() {
    return {
      uiIssuesSetting: null, hideCommunitySetting: null, myState: this.$state
    };
  },

  computed: {

    ...mapGetters('i18n', [
      'selectedLocaleLabel'
    ]),

    options() {
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
    // close() {
    //   this.$modal.hide('wechat-modal');
    // }
  },
};
</script>

<template>
  <div>
    <p>Selected Locale: {{ selectedLocaleLabel }}</p>
    <SimpleBox :title="t('landing.community.title')" :pref="pref" :pref-key="prefKey">
      <div v-for="(value, name) in options" :key="name" class="support-link">
        <a v-t="name" :href="value" target="_blank" rel="noopener noreferrer nofollow" />
      </div>

      <div v-if="selectedLocaleLabel === '简体中文'" class="support-link">
        <p @click="show">
          WeChat
        </p>
      </div>
    </SimpleBox>
    <modal
      class="wechat-modal"
      name="wechat-modal"
      height="auto"
      :width="440"
    >
      <div style="margin: 60px;">
        <h1>Here is a modal</h1>
        <div class="qr-img">
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

  }

  .qr-img {
    background-image: url('~assets/images/wechat-qr-code.jpg');
    background-repeat: no-repeat;
    background-size: cover;
    background-position: center center;
    height: 128px;
    width: 128px;
  }
</style>
