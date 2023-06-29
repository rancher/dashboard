<script>
import { Card } from '@components/Card';
import JsonView from '@pkg/components/JsonView';
import Tabbed from '@shell/components/Tabbed';
import Tab from '@shell/components/Tabbed/Tab';
import Loading from '@shell/components/Loading';
import { Banner } from '@components/Banner';

export default {
  props: {
    value: {
      type:     Object,
      required: true
    },
    clusterName: {
      type:     String,
      required: false,
      default:  ''
    },
    clusterId: {
      type:     String,
      required: true,
      default:  ''
    },
    serverAddress: {
      type:     String,
      required: true
    }
  },
  async fetch() {
    await this.loadLogDetail(this.clusterId, this.value.auditID, this.value.stage);
  },
  data() {
    return {
      defaultTab: 'user',
      log:        {},
      errors:     []
    };
  },
  computed: {
    requestBody() {
      const json = this.value?.requestBody;

      return json && JSON.stringify(JSON.parse(json), undefined, 2);
    },
    responseBody() {
      const json = this.value?.responseBody;

      return json && JSON.stringify(JSON.parse(json), undefined, 2);
    },
    user() {
      const json = this.value?.user;

      return json && JSON.stringify(JSON.parse(json), undefined, 2);
    },
    userAgent() {
      const json = this.value?.userAgent;

      return json && JSON.stringify(JSON.parse(json), undefined, 2);
    },
    impersonatedUser() {
      const json = this.value?.impersonatedUser;

      return json && JSON.stringify(JSON.parse(json), undefined, 2);
    }

  },
  methods: {
    close() {
      this.$emit('close');
    },
    handleTabChanged({ selectedName }) {
      this.$nextTick(() => {
        this.$refs[selectedName]?.refresh();
      });
    },
    async loadLogDetail(clusterID, auditID, stage) {
      try {
        const { data } = await this.$store.dispatch('management/request', {
          url:    `/meta/auditlog/${ this.serverAddress.replace('//', '/') }/v1/k8sauditlogs/${ auditID }?stage=${ stage }&clusterID=${ clusterID }`,
          method: 'GET',
        });

        if (data.length < 0) {
          // this.$store.dispatch('growl/error', { title: this.t('auditLog.errors.notFound') }, { root: true });
          this.errors = [this.t('auditLog.errors.notFound')];

          return;
        }
        this.log = data[0];
      } catch (err) {
        this.errors = [err];
      }
    },
  },
  components: {
    Card,
    JsonView,
    Tabbed,
    Tab,
    Loading,
    Banner,
  }
};
</script>
<template>
  <div class="content">
    <Loading
      v-if="$fetchState.pending"
      mode="relative"
    />
    <Card
      v-else-if="errors.length === 0"
      class="view-audit-log-dialog"
      :show-highlight-border="false"
      :sticky="true"
    >
      <div
        slot="title"
        class="title"
      >
        <h4
          v-clean-html="t('auditLog.detail.title')"
          class="text-default-text"
        />
        <i
          class="icon icon-close"
          @click="close"
        />
      </div>

      <div
        slot="body"
        class="pl-10 pr-10"
      >
        <h5>
          {{ t('auditLog.k8sAuditEventDialog.title') }} : {{ value.auditID }}
        </h5>
        <div class="flex gap-4">
          <div
            v-if="clusterName"
            class="flex gap-2"
          >
            <span class="text-$label-color">{{ t('auditLog.k8sAuditEventDialog.cluster') }}: </span><span>{{ clusterName }}</span>
          </div>
          <div class="flex gap-2">
            <span class="text-$label-color">{{ t('auditLog.table.stage') }}: </span><span>{{ value?.stage }}</span>
          </div>
          <div class="flex gap-2">
            <span class="text-$label-color">{{ t('auditLog.table.requestTimestamp') }}: </span> {{ value?.requestTimestamp }}
          </div>
        </div>
        <hr class="mt-4 mb-4">
        <div class="grid gap-4px">
          <div class="flex gap-2">
            <span class="text-$label-color">{{ t('auditLog.table.verb') }}:</span> <span>{{ value?.verb }}</span>
          </div>
          <div class="flex gap-2">
            <span class="text-$label-color">{{ t('auditLog.table.requestURI') }}:</span> <span>{{ value?.requestURI }}</span>
          </div>
          <div class="flex gap-2">
            <span class="text-$label-color">{{ t('auditLog.k8sAuditEventDialog.stageTime') }}:</span> <span>{{ value?.stageTimestamp }}</span>
          </div>
          <div class="flex gap-2">
            <span class="text-$label-color">{{ t('auditLog.k8sAuditEventDialog.responseCode') }}:</span> <span>{{ value?.responseCode }}</span>
          </div>
          <div class="flex gap-2">
            <span class="text-$label-color">{{ t('auditLog.k8sAuditEventDialog.sourceIPs') }}:</span> <span>{{ value?.sourceIPs }}</span>
          </div>
        </div>
        <hr class="mt-10 mb-10">
        <Tabbed
          :default-tab="defaultTab"
          :flat="true"
          @changed="handleTabChanged"
        >
          <Tab
            :label="t('auditLog.k8sAuditEventDialog.user')"
            name="user"
            :weight="5"
          >
            <JsonView
              ref="user"
              :value="user"
              class="m-20"
            />
          </Tab>
          <Tab
            :label="t('auditLog.k8sAuditEventDialog.impersonaltedUser')"
            name="impersonatedUser"
            :weight="4"
          >
            <JsonView
              ref="impersonatedUser"
              :value="impersonatedUser"
              class="m-20"
            />
          </Tab>
          <Tab
            :label="t('auditLog.k8sAuditEventDialog.userAgent')"
            name="userAgent"
            :weight="3"
          >
            <div class="m-20">
              {{ value.userAgent }}
            </div>
          </Tab>
          <Tab
            :label="t('auditLog.k8sAuditEventDialog.requestBody')"
            name="requestBody"
            :weight="2"
          >
            <JsonView
              ref="requestBody"
              :value="requestBody"
              class="m-20"
            />
          </Tab>
          <Tab
            :label="t('auditLog.k8sAuditEventDialog.responseBody')"
            name="responseBody"
            :weight="1"
          >
            <JsonView
              ref="responseBody"
              :value="responseBody"
              class="m-20"
            />
          </Tab>
        </Tabbed>
      </div>
      <div
        slot="actions"
        class="buttons"
      >
        <button
          class="btn role-secondary mr-10"
          @click="close"
        >
          {{ t('generic.cancel') }}
        </button>
      </div>
    </Card>
    <div v-else>
      <Banner
        v-for="(err, i) in errors"
        :key="i"
        color="error"
        :label="err"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.title {
  display: flex;
  justify-content: space-between;
  width: 100%;
  & > i {
    cursor: pointer;
  }
}
.buttons {
  display: flex;
  justify-content: flex-end;
  width: 100%;
}
.content {
  min-height: 300px;
}
.view-audit-log-dialog {
  &.card-container {
      box-shadow: none;
    }
}
.flex {
  display: flex;
}

.gap-2 {
  grid-gap: 0.5rem;
  gap: 0.5rem
}
.gap-4 {
    grid-gap: 1rem;
    gap: 1rem;
}
.text-\$label-color {
  & ~ span {
    color: var(--body-text);
  }
  color: var(--label-color);
}
</style>
