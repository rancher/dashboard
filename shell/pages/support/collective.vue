<script>
import BackLink from '@shell/components/BackLink';
import BackRoute from '@shell/mixins/back-link';

export default {
  components: { BackLink },
  mixins:     [BackRoute],

  data() {
    return { logo: require('~shell/assets/brand/suse/collective.png') };
  },

  methods: {
    blur(ev) {
      // Ensure we lose focus from the button (click may be on top element or inner element)
      ev?.target?.blur();
      ev?.target?.parentElement?.blur();
    },

    go(ev) {
      window.open('https://susecollective.suse.com', '_blank');
      this.blur(ev);
    },

    join(ev) {
      window.open('https://susecollective.suse.com/join/prime', '_blank');
      this.blur(ev);
    }
  }
};
</script>

<template>
  <div class="collective">
    <BackLink :link="backLink" />

    <div class="banner">
      <div class="message">
        <h1 v-clean-html="t('suse.collective.title', {}, true)" />
      </div>
      <img
        :src="logo"
        class="logo"
      >
    </div>

    <div class="call-to-actions">
      <button
        class="cta-login"
        @click="go"
      >
        <div class="title">
          {{ t('suse.collective.login.title') }}
        </div>
        <div>
          {{ t('suse.collective.login.action') }} <i class="icon icon-external-link" />
        </div>
      </button>
      <button
        class="cta-join"
        @click="join"
      >
        <div class="title">
          {{ t('suse.collective.join.title') }}
        </div>
        <div>
          {{ t('suse.collective.join.action') }} <i class="icon icon-external-link" />
        </div>
      </button>
    </div>
  </div>
</template>

<style lang="scss" scoped>

$suse-teal: #90ebcc;
$suse-teal-text: #000;
$suse-blue: #2552ff;
$suse-cta-text: #000;
$suse-orange: #fd7c40;
$suse-light: #ececec;
$suse-cta-hover-text: #ffffff;

.collective {
  .cta-login {
    background-color: $suse-blue;
    border: 2px solid $suse-blue;
    color: $suse-cta-hover-text;

    &:hover, &:focus, &:active {
      background-color: darken($suse-blue, 15%);
      border-color: darken($suse-blue, 15%);
      color: $suse-cta-hover-text;
    }
  }

  .cta-join {
    background-color: $suse-orange;
    border: 2px solid $suse-orange;
    color: $suse-cta-hover-text;

    &:hover, &:focus, &:active {
      background-color: darken($suse-orange, 15%);
      border-color: darken($suse-orange, 15%);
      color: $suse-cta-hover-text;
    }
  }

  .banner {
    background-color: $suse-teal;
    height: 342px;
    display: flex;

    .message {
      align-self: center;
      flex: 1;
      margin: 0 20px;
      line-height: 1.5;

      h1 {
        color: $suse-teal-text;
        font-size: 26px;
      }
    }

    .logo {
      padding-left: 30px;
    }
  }

  .call-to-actions {
    display: flex;
    margin-top: 20px;

    > button {
      flex: 1;
      margin: 20px;
      display: flex;
      flex-direction: column;
      align-items: flex-start;

      .title {
        font-weight: bold;
      }
    }
  }

  // Ensure page is responsive - hide logo and change cta buttons to be stacked
  @media only screen and (max-width: 770px) {
    .logo {
      display: none;
    }

    .call-to-actions {
      flex-direction: column;

      > button {
        margin: 10px;
      }
    }
  }
}
</style>
