<script setup lang="ts">
import {
  computed, onBeforeUnmount, onMounted, ref, watch
} from 'vue';
import { useStore } from 'vuex';
import { useI18n } from '@shell/composables/useI18n';
import Loading from '@shell/components/Loading.vue';
import { Banner } from '@components/Banner';

// One Grafana dashboard in a frame, the way the shell's GrafanaDashboard draws it - for a cluster that
// is not the open one, which GrafanaDashboard cannot be pointed at (it builds its URL from the open
// cluster). The caller hands the finished URL; this frames it, dresses it as the shell does once it
// loads (the same background and hidden panel chrome), links out to Grafana, and decides "loaded" and
// "failed" the way the shell does: by looking for Grafana's panels and its error marks in the frame.

const props = defineProps<{
  url: string;
  backgroundColor: string;
}>();

const store = useStore();
const { t } = useI18n(store);

// A failed frame is tried again this often, as the shell does.
const RETRY_MS = 45000;

const frame = ref<HTMLIFrameElement | null>(null);
const loading = ref(true);
const error = ref(false);
let poller: ReturnType<typeof setInterval> | null = null;
let retry: ReturnType<typeof setInterval> | null = null;

function stopPolling(): void {
  if (poller) {
    clearInterval(poller);
    poller = null;
  }
}

// GrafanaDashboard's test: panels mean loaded; an error mark, or Grafana's own failure page, means it
// did not.
function poll(): void {
  stopPolling();
  poller = setInterval(() => {
    try {
      const doc = frame.value?.contentWindow?.document;

      if (!doc) {
        return;
      }

      const failedPanel = doc.querySelectorAll('[class$="alert-error"], [class$="panel-info-corner--error"]').length > 0;
      const loaded = doc.querySelectorAll('[class$="panel-in-fullscreen"], [class$="panel-container"]').length > 0;
      const failure = (doc.getElementsByTagName('pre')[0]?.innerText || '').includes('"status": "Failure"');

      if (failedPanel) {
        throw new Error('An error was detected in the frame');
      }
      loading.value = !loaded;
      error.value = failure;
    } catch (e) {
      error.value = true;
      loading.value = false;
      stopPolling();
    }
  }, 100);
}

function reload(ev?: Event): void {
  ev?.preventDefault();
  frame.value?.contentWindow?.location.reload();
  poll();
}

watch(error, (failed) => {
  if (retry) {
    clearInterval(retry);
    retry = null;
  }
  if (failed) {
    retry = setInterval(reload, RETRY_MS);
  }
});

onMounted(poll);

onBeforeUnmount(() => {
  stopPolling();
  if (retry) {
    clearInterval(retry);
  }
});

// Opening it in Grafana itself drops the kiosk mode the frame uses.
const grafanaUrl = computed(() => props.url.replace('&kiosk', ''));

watch(() => props.url, () => {
  loading.value = true;
  error.value = false;
  poll();
});

// The shell's own dressing for an embedded dashboard (GrafanaDashboard's injectCss).
function onLoad(): void {
  const doc = frame.value?.contentWindow?.document;

  if (doc?.head) {
    const style = doc.createElement('style');

    style.innerHTML = `
      body .grafana-app .dashboard-content { background: ${ props.backgroundColor }; padding: 0; }
      body .grafana-app .layout { background: ${ props.backgroundColor }; }
      body .grafana-app .dashboard-content .panel-container { background-color: initial; border: none; }
      body .grafana-app .dashboard-content .panel-wrapper { height: 100%; }
      body .grafana-app .panel-menu-container { display: none; }
      body .grafana-app .panel-title { cursor: default; }
      body .grafana-app .panel-title .panel-title-text div { display: none; }
    `;
    doc.head.appendChild(style);
  }
}
</script>

<template>
  <div class="cgraf">
    <Banner
      v-if="error"
      color="error"
      class="cgraf__error"
    >
      <div class="text-center">
        {{ t('grafanaDashboard.failedToLoad') }} <a
          href="#"
          @click="reload"
        >{{ t('grafanaDashboard.reload') }}</a>
      </div>
    </Banner>
    <iframe
      v-show="!error"
      ref="frame"
      :class="{ 'cgraf__frame--loading': loading }"
      class="cgraf__frame"
      :src="url"
      frameborder="0"
      scrolling="no"
      @load="onLoad"
    />
    <Loading
      v-if="loading"
      mode="relative"
    />
    <div
      v-else-if="!error"
      class="cgraf__link"
    >
      <a
        :href="grafanaUrl"
        target="_blank"
        rel="noopener nofollow"
      >{{ t('grafanaDashboard.grafana') }} <i class="icon icon-external-link" /></a>
    </div>
  </div>
</template>

<style lang="scss" scoped>
// GrafanaDashboard's geometry, with DashboardMetrics' placement of the Grafana link beside the options.
.cgraf {
  height:     100%;
  min-height: 100%;
  min-width:  100%;
  position:   relative;

  &__frame {
    border:   0;
    height:   100%;
    inset:    0;
    overflow: hidden;
    position: absolute;
    width:    100%;

    &--loading {
      visibility: hidden;
    }
  }

  &__error {
    position: relative;
    z-index:  1;
  }

  &__link {
    left:     200px;
    position: absolute;
    top:      -45px;
  }
}
</style>
