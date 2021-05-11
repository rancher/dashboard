<script>
import { options } from '@/config/footer';
import BannerGraphic from '@/components/BannerGraphic';
import AsyncButton from '@/components/AsyncButton';
import IndentedPanel from '@/components/IndentedPanel';
import Card from '@/components/Card';

import { MANAGEMENT } from '@/config/types';

export default {
  layout: 'home',

  components: {
    BannerGraphic,
    IndentedPanel,
    AsyncButton,
    Card
  },

  async fetch() {
    const fetchOrCreateSetting = async(id, val) => {
      let setting;

      try {
        setting = await this.$store.dispatch('management/find', { type: MANAGEMENT.SETTING, id });
      } catch {
        const schema = this.$store.getters['management/schemaFor'](MANAGEMENT.SETTING);
        const url = schema.linkFor('collection');

        setting = await this.$store.dispatch('management/create', {
          type: MANAGEMENT.SETTING, metadata: { name: id }, value: val, default: val || ''
        });
        setting.save({ url });
      }

      return setting;
    };

    this.supportSetting = await fetchOrCreateSetting('has-support', 'false');
    this.brandSetting = await fetchOrCreateSetting('brand', '');
  },

  data() {
    return {
      supportKey:     '',
      supportSetting: null,
      brandSetting:   null,
      promos:         [
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

    hasSupport() {
      return this.supportSetting?.value && this.supportSetting?.value !== 'false';
    },

    options() {
      return options(this.pl);
    },

    title() {
      return this.hasSupport ? 'support.suse.title' : 'support.community.title';
    },

  },

  methods: {
    async addSubscription(done) {
      try {
        this.supportSetting.value = 'true';
        this.brandSetting.value = 'suse';
        await Promise.all([this.supportSetting.save(), this.brandSetting.save()]);
        this.$cookies.set('brand', 'suse');
        done(true);
        this.$modal.hide('toggle-support');
      } catch {
        done(false);
      }
    },

    async removeSubscription(done) {
      try {
        this.supportSetting.value = 'false';
        this.brandSetting.value = '';
        await Promise.all([this.supportSetting.save(), this.brandSetting.save()]);
        if (this.$cookies.get('brand')) {
          this.$cookies.remove('brand');
        }
        done(true);
        this.$modal.hide('toggle-support');
      } catch {
        done(false);
      }
    },
  }
};
</script>
<template>
  <div>
    <BannerGraphic :title="t(title, {}, true)" />

    <IndentedPanel>
      <div v-if="!hasSupport" class="register row">
        <div>
          {{ t('support.subscription.haveSupport') }}
        </div>
        <button class="ml-5 btn role-secondary btn-sm" type="button" @click="$modal.show('toggle-support')">
          {{ t('support.subscription.addSubscription') }}
        </button>
      </div>

      <div class="content mt-20">
        <div class="promo">
          <div class="boxes">
            <div v-for="key in promos" :key="key" class="box">
              <h2>{{ t(`${key}.title`) }}</h2>
              <div>{{ t(`${key}.text`) }}</div>
            </div>
          </div>
          <div v-if="!hasSupport" class="external">
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
        <div v-if="hasSupport" class="row">
          <button class="btn role-tertiary btn-sm" type="button" @click="$modal.show('toggle-support')">
            {{ t('support.subscription.removeSubscription') }}
          </button>
        </div>
      </div>
    </IndentedPanel>
    <modal
      name="toggle-support"
      height="auto"
      :width="300"
    >
      <Card :show-highlight-border="false" class="toogle-support">
        <template #title>
          {{ hasSupport? t('support.subscription.removeTitle') : t('support.subscription.addTitle') }}
        </template>
        <template #body>
          <div v-if="hasSupport" class="mt-20">
            {{ t('support.subscription.removeBody') }}
          </div>
          <div v-else class="mt-20">
            <input v-model="supportKey" />
          </div>
        </template>
        <template #actions>
          <button type="button" class="btAhn role-secondary" @click="$modal.hide('toggle-support')">
            {{ t('generic.cancel') }}
          </button>
          <AsyncButton v-if="!hasSupport" :disabled="!supportKey.length" class="pull-right" @click="addSubscription" />
          <AsyncButton v-else :action-label="t('generic.remove')" class="pull-right" @click="removeSubscription" />
        </template>
      </Card>
    </modal>
  </div>
</template>
<style lang="scss" scoped>
.content {
  display: grid;
  grid-column-gap: 20px;
  grid-row-gap: 20px;
  grid-template-columns: 70% 30%;
}

.toogle-support {
    height: 100%;

    &.card-container {
      box-shadow: none;
    }

    &::v-deep .card-actions {
      display: flex;
      justify-content: space-between;
    }
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
  margin-top: 20px;
  font-size: 16px;
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
