<script>
import { options } from '@/config/footer';
import BannerGraphic from '@/components/BannerGraphic';
import IndentedPanel from '@/components/IndentedPanel';

export default {
  layout: 'home',

  components: {
    BannerGraphic,
    IndentedPanel
  },

  data() {
    return {
      hasSupport: false,
      promos:     [
        'support.promos.one',
        'support.promos.two',
        'support.promos.three',
        'support.promos.four',
      ]
    };
  },

  computed: {
    pl() {
      // @TODO PL support
      return 'rancher';
    },

    options() {
      return options(this.pl);
    },

    title() {
      return this.hasSupport ? 'support.suse.title' : 'support.community.title';
    }
  },

  methods: {
    addSubscription() {
      this.hasSupport = true;
    }
  }
};
</script>
<template>
  <div>
    <BannerGraphic :title="t(title)" />
    <IndentedPanel v-if="!hasSupport">
      <div class="content mt-20">
        <div class="promo">
          <div class="register hide">
            <div>{{ t('support.community.register') }}</div>
            <button class="btn add" @click="addSubscription()">
              {{ t('support.community.addSubscription') }}
            </button>
          </div>
          <div class="boxes">
            <div v-for="key in promos" :key="key" class="box">
              <h2>{{ t(`${key}.title`) }}</h2>
              <div>{{ t(`${key}.text`) }}</div>
            </div>
          </div>
          <div class="external">
            <a href="https://rancher.com/support-maintenance-terms" target="_blank" rel="noopener noreferrer nofollow">{{ t('support.community.learnMore') }} <i class="icon icon-external-link" /></a>
            or
            <a href="https://rancher.com/pricing" target="_blank" rel="noopener noreferrer nofollow">{{ t('support.community.pricing') }} <i class="icon icon-external-link" /></a>
          </div>
        </div>
        <div class="community">
          <h2>{{ t('support.community.linksTitle') }}</h2>
          <div v-for="(value, name) in options" :key="name" class="support-link">
            <a v-t="name" :href="value" target="_blank" rel="noopener noreferrer nofollow" />
          </div>
        </div>
      </div>
    </IndentedPanel>
    <IndentedPanel v-else>
      {{ t('support.suse.title') }}
    </IndentedPanel>
  </div>
</template>
<style lang="scss" scoped>
.content {
  display: grid;
  grid-column-gap: 20px;
  grid-row-gap: 20px;
  grid-template-columns: 70% 30%;
}
.community {
  border-left: 1px solid var(--border);
  padding-left: 20px;
  > h2 {
    font-size: 18px;
    font-weight: 300;
    margin-bottom: 20px;
  }
  .support-link {
    margin: 10px 0;
  }
}
.external {
  margin-top: 20px;
}
.register {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  font-size: 16px;

  .btn.add {
    min-height: 32px;
    line-height: 32px;
    margin-left: 10px;
  }
}
.boxes {
  display: grid;
  grid-column-gap: 20px;
  grid-row-gap: 20px;
  grid-template-columns: 50% 50%;
  margin-right: 20px;

  .box {
    padding: 20px;
    border: 1px solid var(--border);

    > h2 {
      font-size: 20px;
      font-weight: 300;
    }

    > div {
      font-weight: 300;
      line-height: 18px;
      opacity: 0.8;
    }
  }
}
</style>
