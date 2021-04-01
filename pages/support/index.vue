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
    return { hasSupport: false };
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
      return this.hasSupport ? 'Great News - You\'re covered' : 'SUSE Rancher provides world-class support';
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
    <BannerGraphic :title="title" />

    <IndentedPanel v-if="!hasSupport">
      <div class="content mt-20">
        <div class="promo">
          <div class="register">
            <div>Already have support? Add your SUSE Subscription ID</div>
            <button class="btn add" @click="addSubscription()">
              Add
            </button>
          </div>
          <div class="boxes">
            <div class="box">
              <h2>24x7 Support</h2>
              <div>We provide tightly defined SLAs, and offer round the clock support options.</div>
            </div>
            <div class="box">
              <h2>Issue Resolution</h2>
              <div>Run SUSE Rancher products with confidence, knowing that the developers who built them are available to quickly resolve issues.</div>
            </div>
            <div class="box">
              <h2>Troubleshooting</h2>
              <div>We focus on uncovering the root cause of any issue, whether it is related to Rancher Labs products, Kubernetes, Docker or your underlying infrastructure.</div>
            </div>
            <div class="box">
              <h2>Innovate with Freedom</h2>
              <div>Take advantage of our certified compatibility with a wide range of Kubernetes providers, operating systems, and open source software.</div>
            </div>
          </div>
          <div class="external">
            <a href="https://rancher.com/pricing" target="_blank" rel="noopener noreferrer nofollow">Find out more about SUSE Rancher Support <i class="icon icon-external-link" /></a>
          </div>
        </div>
        <div class="community">
          <h2>Community Support</h2>
          <div v-for="(value, name) in options" :key="name" class="support-link">
            <a v-t="name" :href="value" target="_blank" rel="noopener noreferrer nofollow" />
          </div>
        </div>
      </div>
    </IndentedPanel>
    <IndentedPanel v-else>
      You've got support
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
  border-left: 1px solid #d8d8d8;
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
    border: 1px solid #d8d8d8;

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
