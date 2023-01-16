<script>
import Collapse from '@shell/components/Collapse';
import PercentageBar from '@shell/components/PercentageBar';

export default {
  name:       'HarvesterUpgradeProgressList',
  components: { PercentageBar, Collapse },

  props: {
    title: {
      type:    String,
      default: ''
    },

    precent: {
      type:    Number,
      default: 0
    },

    list: {
      type:    Array,
      default: () => {
        return [];
      }
    }
  },

  data() {
    return { open: true };
  },

  methods: {
    handleSwitch() {
      this.open = !this.open;
    }
  }
};
</script>

<template>
  <div class="bar-list">
    <h4>{{ title }} <span class="float-r text-info">{{ precent }}%</span></h4>
    <div>
      <div>
        <Collapse :open.sync="open">
          <template #title>
            <div class="total-bar">
              <span class="bar"><PercentageBar :value="precent" preferred-direction="MORE" /></span>
              <span class="on-off" @click="handleSwitch"> {{ open ? t('harvester.generic.close') : t('harvester.generic.open') }}</span>
            </div>
          </template>

          <template>
            <div class="custom-content">
              <div v-for="item in list" :key="item.name" class="item">
                <p>{{ item.name }} <span class="status" :class="{ [item.state]: true }">{{ item.state }}</span></p>
                <PercentageBar :value="item.percent" preferred-direction="MORE" />
                <p class="warning">
                  {{ item.message }}
                </p>
              </div>
            </div>
          </template>
        </Collapse>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.bar-list {
  .float-r {
    float: right;
  }

  .total-bar {
    display: flex;
    user-select: none;
    .bar {
      width: 85%;
    }
    .on-off {
      margin-left: 10px;
      cursor: pointer;
    }
  }
  .custom-content {
    .item {
      margin-bottom: 14px;
      p {
        margin-bottom: 4px;
      }
      .status {
        float: right;
      }
      .Succeeded, .Upgrading, .Pending {
        color: var(--success);
      }
      .failed {
        color: var(--error)
      }
      .warning {
        color: var(--error);
      }
    }
  }
}

</style>
