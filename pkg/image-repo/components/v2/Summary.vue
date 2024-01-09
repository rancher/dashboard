<template>
  <div
    v-loading="loading || innerLoading"
    class="summary"
  >
    <div class="left">
      <div class="repositories">
        <img
          :src="defaultIcon"
          width="30"
          height="30"
        >
        <span
          style="line-height: 30px;"
          class="ml-30"
        >{{ t('harborConfig.summary.projectImageRepo') }}</span>
        <span
          style="line-height: 30px;"
          class="pl-30"
        >
          {{ count }}
        </span>
      </div>
      <div class="quotas">
        <div class="title">
          <span>{{ t('harborConfig.summary.projectQuota') }}</span>
        </div>
        <div class="content">
          <div>
            <span>{{ t('harborConfig.summary.storage') }}</span>
          </div>
          <div>
            <span style="text-align: right;"><b>{{ transformStorageUsed }}</b> of <b>{{ transformStorageMax }}</b></span>
          </div>
          <div>
            <ProgressBarMulti
              :values="percentage"
              :min="0"
              :max="100"
            />
          </div>
        </div>
      </div>
    </div>
    <div class="summary-member">
      <ul
        class="member-list"
        style="list-style-type: none"
      >
        <li>
          <span>{{ t('harborConfig.table.roleItem.admin') }}</span>
          <b>{{ summary?.project_admin_count }}</b>
        </li>
        <li>
          <span>{{ t('harborConfig.table.roleItem.master') }}</span>
          <b>{{ maintainerCount }}</b>
        </li>
        <li>
          <span>{{ t('harborConfig.table.roleItem.developer') }}</span>
          <b>{{ summary?.developer_count }}</b>
        </li>
        <li>
          <span>{{ t('harborConfig.table.roleItem.visitor') }}</span>
          <b>{{ summary?.guest_count }}</b>
        </li>
        <li>
          <span>{{ t('harborConfig.table.roleItem.limitedGuest') }}</span>
          <b>{{ summary?.limited_guest_count }}</b>
        </li>
      </ul>
    </div>
  </div>
</template>

<script>
import ProgressBarMulti from '@shell/components/ProgressBarMulti';

export default {
  components: { ProgressBarMulti },
  props:      {
    apiRequest: {
      type:     Object,
      required: true
    },
    project: {
      type:     Object,
      required: true
    },
    loading: {
      type:     Boolean,
      required: true
    }
  },
  async mounted() {
    await this.fetchSummary();
  },
  data() {
    return {
      value:        0,
      innerLoading: false,
      summary:      null,
      defaultIcon:  require('../../assets/image/harbor-repo.svg'),
    };
  },
  methods: {
    async fetchSummary() {
      if (this.project?.project_id) {
        this.innerLoading = true;
        try {
          const summary = await this.apiRequest.fetchProjectSummary(this.project?.project_id);

          this.summary = summary;
          this.innerLoading = false;
        } catch (e) {
          this.innerLoading = false;
        }
      }
    },
    formatBytes(bytes, decimals = 2) {
      if (bytes === 0) {
        return '0 Bytes';
      }

      const k = 1024;
      const dm = decimals < 0 ? 0 : decimals;
      const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));

      return `${ parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) } ${ sizes[i] }`;
    },
    formatPercent(value, max) {
      if (max === -1 || value === 0) {
        return 0;
      }
      if (value >= max) {
        return 100;
      }

      return (value / max * 100).toFixed(2);
    }
  },
  watch: {
    async project() {
      await this.fetchSummary();
    }
  },
  computed: {
    percentage() {
      let value = 0;

      if (this.summary) {
        value = this.formatPercent(this.summary?.quota?.used?.storage, this.summary?.quota?.hard?.storage);
      }

      let color = 'bg-success';

      if (value > 70) {
        color = 'bg-warning';
      }

      return [{
        value,
        color
      }];
    },
    count() {
      if (this.summary) {
        return this.summary?.repo_count;
      }

      return 0;
    },
    transformStorageUsed() {
      if (this.summary) {
        const used = this.summary?.quota?.used?.storage;

        return this.formatBytes(used);
      }

      return '0 Bytes';
    },
    transformStorageMax() {
      if (this.summary) {
        const hard = this.summary?.quota?.hard?.storage;

        if (hard === -1) {
          return this.t('harborConfig.summary.infinity');
        }

        return this.formatBytes(hard);
      }

      return '0 Bytes';
    },
    maintainerCount() {
      return this.summary?.maintainer_count || this.summary?.master_count;
    },
  }
};
</script>
<style lang="scss" scoped>
  .summary {
    display: flex;
    justify-content: space-between;
    .left {
      width: 100%;
      .repositories {
        background-color: #F3F5F5;
        border: 1px solid #DDE6EF;
        margin-top : 10px;
        padding: 10px 5px 10px 40px;
        display: flex;
        align-items: center;
        justify-content: left;
      }
      .quotas {
        .title {
          padding: 20px 5px;
        }
        .content {
          border: 1px solid #D6DBE7;
          padding: 10px 15px;
          div {
            margin: 15px 0px;
          }
          .progress {
            width: 300px !important;
          }
        }
      }
    }
    .summary-member {
      .member-list {
        margin-top: 10px;
        min-width: 260px;
        & li {
          border: 1px solid #D6DBE7;
          height: 45px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0px 20px;
          margin-bottom: 10px;
        }
      }
    }
  }
</style>
