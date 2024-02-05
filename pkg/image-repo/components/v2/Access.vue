<template>
  <div
    v-loading="loading"
    class="access-container"
  >
    <div class="access-switch">
      <div
        :class="{ 'active': !access }"
        @click="changeAccess"
      >
        <t k="harborConfig.table.storeStatus.private" />
      </div>
      <div
        :class="{ 'active': access }"
        @click="changeAccess"
      >
        <t k="harborConfig.table.storeStatus.public" />
      </div>
    </div>
    <Banner
      color="warning"
    >
      <t k="harborConfig.table.storeStatus.message" />
    </Banner>
    <div class="footer">
      <button
        :disabled="disabled || loading || disableActionButton"
        type="button"
        class="btn bg-primary"
        @click="saveAccess"
      >
        {{ t('generic.save') }}
      </button>
    </div>
  </div>
</template>
<script>
import { Banner } from '@components/Banner';
import access from '../../mixins/access.js';

export default {
  components: { Banner },
  mixins:     [access],
  props:      {
    apiRequest: {
      type:     Object,
      required: true
    },
    currentUser: {
      type:     Object,
      required: true
    },
    project: {
      type:     Object,
      required: true
    }
  },
  data() {
    const access = this?.project?.metadata?.public === 'true';

    return {
      loading:  false,
      disabled: true,
      access,
    };
  },
  watch: {
    'project.metadata.public': {
      handler(access) {
        this.access = access === 'true';
        this.disabled = true;
      },
      deep: true
    },
  },
  computed: {
    disableActionButton() {
      return parseInt(this?.project?.current_user_role_id, 10) !== 1 && !this?.currentUser?.sysadmin_flag;
    }
  },
  methods: {
    changeAccess() {
      this.access = !this.access;
      const currentSate = this.access ? 'true' : 'false';

      this.disabled = currentSate === this?.project?.metadata?.public;
    },

    async saveAccess() {
      if (this.project?.project_id) {
        const params = { metadata: { public: this.access ? 'true' : 'false' } };

        this.loading = true;
        this.disabled = true;
        try {
          await this.apiRequest.setProjectPublic(this.project?.project_id, { ...params });
          this.loading = false;
        } catch (e) {
          this.loading = false;
        }

        this.$emit('refresh');
      }
    }
  }
};
</script>
<style lang="scss" scoped>
  .access-container {
    position: relative;
    .access-switch {
      position: absolute;
      top: -75px;
      right: 0px;
      display: flex;
      div {
        padding: 0 7px 0 7px;
        min-height: 30px;
        line-height: 28px;
        border: 0;
        align-items: center;
        display: inline-flex;
        text-align: center;
        white-space: nowrap;
        vertical-align: middle;
        background-color: #EFEFEF;
        cursor: pointer;
      }
      .active {
        background-color: var(--accent-btn);
        color: var(--primary);
      }
    }
    .footer {
      display: flex;
      justify-content: center;
      align-items: center;
    }
  }
</style>
