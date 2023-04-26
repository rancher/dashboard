<script>
import { exceptionToErrorsArray } from '@shell/utils/error';
import { mapGetters } from 'vuex';
import { Card } from '@components/Card';
import { Banner } from '@components/Banner';
import AsyncButton from '@shell/components/AsyncButton';
import { LabeledInput } from '@components/Form/LabeledInput';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import PercentageBar from '@shell/components/PercentageBar';
import { get, set } from '@shell/utils/object';
import { downloadFile } from '@shell/utils/download';
export default {
  name:       'HotplugModal',
  components: {
    AsyncButton, Card, LabeledInput, LabeledSelect, Banner, PercentageBar
  },
  props: {
    resources: {
      type:     Array,
      required: true
    },
  },
  data() {
    const currentPod = this.resources[0] || {};
    const containers = currentPod?.spec?.containers || [];
    const currentContainer = containers?.[0]?.name || '';
    const downloadLink = currentPod?.actions?.download;

    return {
      currentContainer,
      filePath:           '',
      errors:             [],
      xhr:                null,
      percent:            -1,
      total:              -1,
      largeFileSize:      false,
      inProgressFunction: null,
      downloadLink,
      containers,
      colorStops:         { 100: '--primary' },
    };
  },
  computed: {
    ...mapGetters({ t: 'i18n/t' }),
    choices() {
      return (this.containers || []).map((c) => {
        return {
          label: c.name,
          value: c.name,
          data:  c,
        };
      });
    },
    showProgress() {
      return parseInt(get(this, 'percent'), 10) >= 0 && parseInt(get(this, 'percent'), 10) < 100;
    },
  },
  methods: {
    close() {
      this.$emit('close');
    },
    formatPercent(value, max) {
      if (max === -1 || value === 0) {
        return 0;
      }
      if (value >= max) {
        return 100;
      }

      return Math.ceil(value / max * 100);
    },
    inProgress(resp) {
      if (resp && resp.target) {
        if (resp.target.status === 200) {
          if (resp.target && resp.target.getResponseHeader('x-decompressed-content-length') && get(this, 'total') === -1) {
            set(this, 'total', parseInt(resp.target.getResponseHeader('x-decompressed-content-length'), 10));
            if (get(this, 'total') / (1024 * 1024) > 600) {
              set(this, 'largeFileSize', true);
            }
          }
          if (resp.loaded) {
            set(this, 'percent', this.formatPercent(resp.loaded, get(this, 'total')));
          }
        }
      }
    },
    save(buttonCb) {
      try {
        const filePath = this.filePath;
        const fileName = filePath.substr(filePath.lastIndexOf('/') + 1);

        if ( typeof XMLHttpRequest !== 'undefined' ) {
          const csrf = document.cookie.split(';').find(item => item.includes('CSRF'));
          const body = JSON.stringify({
            containerName: get(this, 'currentContainer'),
            filePath,
          });

          set(this, 'inProgressFunction', (resp) => {
            this.inProgress(resp);
          });
          set(this, 'xhr', new XMLHttpRequest());
          if (!get(this, 'downloadLink')) {
            return;
          }
          get(this, 'xhr').open('POST', get(this, 'downloadLink'), true);
          get(this, 'xhr').setRequestHeader('content-type', 'application/json');
          get(this, 'xhr').setRequestHeader('Accept', 'application/json');
          get(this, 'xhr').setRequestHeader('x-api-action-links', 'actionLinks');
          get(this, 'xhr').setRequestHeader('x-api-no-challenge', 'true');
          get(this, 'xhr').setRequestHeader('x-api-csrf', csrf.trim().substr(5));
          get(this, 'xhr').responseType = 'arraybuffer';
          get(this, 'xhr').send(body);
          get(this, 'xhr').addEventListener('progress', get(this, 'inProgressFunction'));
          get(this, 'xhr').onload = (resp) => {
            if (resp && resp.target && resp.target.status === 200) {
              downloadFile(fileName, resp.target.response, 'application/octet-stream');
              if (!this._isDestroyed) {
                this.close();
                buttonCb(true);
              }
            } else if (resp && resp.target && resp.target.status !== 200) {
              let errorMessage = '';

              if (resp.target.response) {
                try {
                  const respJson = JSON.parse(String.fromCharCode.apply(null, new Uint8Array(resp.target.response)));

                  errorMessage = respJson && respJson.message ? respJson.message : '';
                } catch (error) {
                  errorMessage = '';
                }
              }
              this.$store.dispatch('growl/fromError', { title: errorMessage || this.t('modalDownLoadFileComponent.serverError') }, { root: true });
              if (!this._isDestroyed) {
                buttonCb(false);
              }
            } else {
              this.$store.dispatch('growl/fromError', { title: Error, err: 'Unknown Error' }, { root: true });
              if (!this._isDestroyed) {
                buttonCb(false);
              }
            }
          };
        } else {
          this.$store.dispatch('rancher/request', {
            url:    get(this, 'downloadLink'),
            method: 'POST',
            data:   JSON.stringify({
              containerName: get(this, 'currentContainer'),
              filePath,
            }),
          }).then((data) => {
            this.$store.dispatch('growl/fromError', { title: 'Error', err: 'If the browser version is low, there may be errors when downloading' }, { root: true });
            if (data.status === 200) {
              buttonCb(true);
              downloadFile(fileName, data.body, 'application/octet-stream');
              this.close();
            }
          }).catch((err) => {
            this.$store.dispatch('growl/fromError', { title: 'Error', err: err.body.message }, { root: true });
            buttonCb(false);
          });
        }
      } catch (err) {
        const error = err?.data || err;
        const message = exceptionToErrorsArray(error);

        this.$set(this, 'errors', message);
        buttonCb(false);
      }
    },
  }
};
</script>
<template>
  <Card
    ref="modal"
    name="modal"
    :show-highlight-border="false"
  >
    <h4
      slot="title"
      v-clean-html="t('modalDownLoadFileComponent.title')"
      class="text-default-text"
    />
    <template #body>
      <LabeledSelect
        v-model="currentContainer"
        :label="t('modalDownLoadFileComponent.container')"
        :options="choices"
        class="mt-20"
        required
      />
      <LabeledInput
        v-model="filePath"
        :label="t('modalDownLoadFileComponent.filePath')"
        class="mt-20"
        required
      />
      <div v-if="largeFileSize">
        <Banner
          color="warning"
          :label="t('modalDownLoadFileComponent.notice')"
        />
      </div>
      <div v-if="showProgress">
        <div style="margin: 15px 5px 5px 0px;">
          {{ percent }}%
        </div>
        <PercentageBar
          :value="percent"
          :color-stops="colorStops"
        />
      </div>
    </template>
    <div
      slot="actions"
      class="actions"
    >
      <div class="buttons">
        <button
          type="button"
          class="btn role-secondary mr-10"
          @click="close"
        >
          {{ t('generic.cancel') }}
        </button>
        <AsyncButton
          mode="download"
          :disabled="!currentContainer || !filePath"
          @click="save"
        />
      </div>
      <Banner
        v-for="(err, i) in errors"
        :key="i"
        color="error"
        :label="err"
      />
    </div>
  </Card>
</template>
<style lang="scss" scoped>
.actions {
  width: 100%;
}
.buttons {
  display: flex;
  justify-content: flex-end;
  width: 100%;
}
</style>
