<script lang="ts">
import Loading from '@shell/components/Loading.vue';
import { OIDC_CLIENT_SECRET_ANNOTATIONS } from '@shell/config/labels-annotations';
import { SECRET } from '@shell/config/types';
import { exceptionToErrorsArray } from '@shell/utils/error';
import { defineComponent } from 'vue';
import CopyToClipboardText from '@shell/components/CopyToClipboardText.vue';
import DateComponent from '@shell/components/formatter/Date.vue';
import { RcItemCard } from '@components/RcItemCard';
import ActionMenu, { type ActionMenuSelection } from '@shell/components/ActionMenuShell.vue';
import { Banner } from '@components/Banner';

type SecretActionType = 'create-secret' | 'regen-secret' | 'remove-secret'
interface ClientSecretData { createdAt: string, lastUsedAt: string, lastFiveCharacters: string }

export const OIDC_CLIENT_SECRET_ACTION: { [key: string]: SecretActionType } = {
  CREATE: 'create-secret',
  REGEN:  'regen-secret',
  REMOVE: 'remove-secret',
};

interface SecretManageData {
  id: string,
  header?: any,
  image?: any,
  createdAt: string,
  lastFiveCharacters: string,
  lastUsedAt: string,
  displayFullSecret: boolean,
}

const OIDC_SECRETS_NAMESPACE = 'cattle-oidc-client-secrets';

export default defineComponent({

  components: {
    CopyToClipboardText,
    DateComponent,
    RcItemCard,
    ActionMenu,
    Loading,
    Banner
  },

  props: {
    value: {
      type:     Object,
      required: true,
    },
  },

  created() {
    // this mean that we came from the create screen and we need to display that first secret generated
    if (window.history?.state?.displaySecret) {
      this.displayFirstSecret = true;
      const state = window.history.state;

      const { displaySecret, ...cleanedState } = state;

      // let's clean from the browser history state the flag so that when we do a refresh we don't get the same state back (we don't want to show the secret ever again)
      window.history.replaceState(cleanedState, '', window.location.href);
    }

    setTimeout(() => {
      this.showNoSecretsDelay = true;
    }, 5000);
  },

  data() {
    return {
      displayFirstSecret:    false,
      errors:                [] as any[],
      snapshotSecretsOnLoad: Object.assign({}, this.value?.status?.clientSecrets),
      OIDC_CLIENT_SECRET_ACTION,
      secretsRegenerated:    [] as any[],
      cardActions:           [
        {
          enabled:    true,
          total:      0,
          allEnabled: true,
          anyEnabled: true,
          available:  0,
          action:     'regenerateSecret',
          label:      this.t('oidcclient.regenerate')
        },
        {
          enabled:    true,
          total:      0,
          allEnabled: true,
          anyEnabled: true,
          available:  0,
          action:     'removeSecret',
          label:      this.t('generic.delete')
        }
      ],
      canFetchSecrets:    this.$store.getters[`management/canList`](SECRET),
      showNoSecretsDelay: false
    };
  },

  methods: {
    handleSecretAction(secret: SecretManageData, payload?: ActionMenuSelection) {
      switch (payload?.action) {
      case 'regenerateSecret':
        this.promptSecretsModal(OIDC_CLIENT_SECRET_ACTION.REGEN, secret);
        break;
      case 'removeSecret':
        this.promptSecretsModal(OIDC_CLIENT_SECRET_ACTION.REMOVE, secret);
        break;
      default:
        console.warn(`Unknown secret action: ${ payload?.action }`); // eslint-disable-line no-console
      }
    },

    promptSecretsModal(actionType: SecretActionType, secret: SecretManageData) {
      this.errors = [];

      this.$store.dispatch('management/promptModal', {
        component:      'OidcClientSecretDialog',
        customClass:    'remove-modal',
        modalWidth:     400,
        height:         'auto',
        styles:         'max-height: 100vh;',
        componentProps: {
          type:     actionType,
          actionCb: async() => {
            try {
              await this.performSecretAction(actionType, secret);
            } catch (error: any) {
              this.errors = exceptionToErrorsArray(error);
            }
          }
        }
      });
    },
    async addNewSecret() {
      this.errors = [];

      try {
        await this.performSecretAction(OIDC_CLIENT_SECRET_ACTION.CREATE, {});
      } catch (error: any) {
        this.errors = exceptionToErrorsArray(error);
      }
    },
    async performSecretAction(actionType: SecretActionType, secret: SecretManageData | any) {
      let isValidAction = false;

      if (!this.value?.metadata?.annotations) {
        this.value.metadata.annotations = {};
      }

      if (actionType === OIDC_CLIENT_SECRET_ACTION.CREATE) {
        this.value.metadata.annotations[OIDC_CLIENT_SECRET_ANNOTATIONS.CREATE] = 'true';
        isValidAction = true;
      } else if (actionType === OIDC_CLIENT_SECRET_ACTION.REGEN) {
        this.value.metadata.annotations[OIDC_CLIENT_SECRET_ANNOTATIONS.REGEN] = secret.id;
        this.secretsRegenerated.push(secret);
        isValidAction = true;
      } else if (actionType === OIDC_CLIENT_SECRET_ACTION.REMOVE) {
        this.value.metadata.annotations[OIDC_CLIENT_SECRET_ANNOTATIONS.REMOVE] = secret.id;
        isValidAction = true;
      }

      if (isValidAction) {
        return await this.value.save();
      }

      Promise.reject(new Error(this.t('oidcclient.errors.performSecretAction')));
    },
  },

  watch: {
    clientSecretId: {
      handler(neu) {
        if (neu && this.canFetchSecrets) {
          this.$store.dispatch('management/find', { type: SECRET, id: neu });
        }
      },
      immediate: true
    }
  },

  computed: {
    clientID(): string {
      return this.value?.status?.clientID || '';
    },

    clientSecretId(): string {
      // We can either use `${ OIDC_SECRETS_NAMESPACE }/${ this.value.status.clientID }` directly, or attempt to find the secret owned by the client
      return this.value.metadata.relationships.find((r: any) => r.rel === 'owner' && r.state === 'active' && r.toType === SECRET && r.toId.startsWith(OIDC_SECRETS_NAMESPACE))?.toId;
    },

    clientSecret(): Record<string, any> | undefined {
      return this.clientSecretId ? this.$store.getters['management/byId'](SECRET, this.clientSecretId) : undefined;
    },

    clientSecrets(): SecretManageData[] {
      const clientSecrets: SecretManageData[] = [];
      const oidcClientSecretsData: [string, ClientSecretData][] = this.value?.status?.clientSecrets ? Object.entries(this.value?.status?.clientSecrets) : [];

      oidcClientSecretsData.forEach(([oidcSecretDataKey, oidcSecretData], index: number) => {
        if (oidcSecretDataKey && oidcSecretData) {
          const createdAtNum = parseInt(oidcSecretData.createdAt || '0');
          const createdAt = createdAtNum ? new Date(createdAtNum * 1000).toISOString() : '';
          const lastUsedAtNum = parseInt(oidcSecretData.lastUsedAt || '0');
          const lastUsedAt = lastUsedAtNum ? new Date(lastUsedAtNum * 1000).toISOString() : '';

          let displayFullSecret = false;

          // this covers the first render after creation
          if (this.displayFirstSecret && index === 0) {
            displayFullSecret = true;
          // this cover the "add secret" scenario
          } else if (!this.snapshotSecretsOnLoad[oidcSecretDataKey]) {
            displayFullSecret = true;
          }

          // this cover the "regen secret" scenario
          if (this.secretsRegenerated.find((regen: SecretManageData) => regen.id === oidcSecretDataKey && regen.lastFiveCharacters !== oidcSecretData.lastFiveCharacters)) {
            displayFullSecret = true;
          }

          // this covers the removal, then adding a new secret again... We need to compare keys so that we can check it's new and render it
          if (this.snapshotSecretsOnLoad[oidcSecretDataKey] && (this.snapshotSecretsOnLoad[oidcSecretDataKey].lastFiveCharacters !== oidcSecretData.lastFiveCharacters)) {
            displayFullSecret = true;
          }

          clientSecrets.push({
            id:                 oidcSecretDataKey,
            header:             { title: { text: oidcSecretDataKey } },
            image:              { src: require('~shell/assets/images/key.svg') },
            createdAt,
            lastFiveCharacters: oidcSecretData.lastFiveCharacters,
            lastUsedAt,
            displayFullSecret,
          });
        }
      });

      return clientSecrets;
    },

    showSecrets(): boolean {
      return this.value.status?.clientID;
    },

    showNoSecrets(): boolean {
      // Avoid the no secrets message blipping up whilst we wait for the client status to update over websocket (which unlocks the details required to fetch secrets)
      return !this.showSecrets && this.showNoSecretsDelay;
    }
  }
});
</script>

<template>
  <div>
    <Loading v-if="!value" />
    <div v-else-if="showSecrets">
      <div
        v-if="errors && errors.length"
      >
        <Banner
          v-for="(err, i) in errors"
          :key="i"
          color="error"
          :data-testid="`error-banner${i}`"
          :label="err"
        />
      </div>

      <!-- clientID -->
      <h3
        class="mt-10 mb-20"
      >
        {{ t('oidcclient.clientId') }}:
        <CopyToClipboardText
          :aria-label="t('oidcclient.a11y.copyText.clientId')"
          :text="clientID"
          data-testid="oidc-clients-copy-clipboard-client-id"
        />
      </h3>
      <!-- secrets cards -->
      <div
        class="mb-20"
      >
        <h3 class="mt-20 mb-20">
          {{ t('oidcclient.clientSecrets') }}
        </h3>
        <div class="card-grid-container">
          <rc-item-card
            v-for="(secret, i) in clientSecrets"
            :id="secret.id"
            :key="secret.id"
            class="card-item"
            :header="secret.header"
            :image="secret.image"
            :value="secret"
            variant="medium"
            :clickable="false"
          >
            <template #item-card-content>
              <p v-if="secret.displayFullSecret">
                <CopyToClipboardText
                  :aria-label="t('oidcclient.a11y.copyText.clientSecret')"
                  :text="clientSecret?.decodedData?.[secret.id]"
                  :data-testid="`oidc-client-secret-${i}-copy-full-secret`"
                />
              </p>
              <p v-else>
                ********{{ secret.lastFiveCharacters }}
              </p>
            </template>
            <template
              #item-card-footer
            >
              <div class="card-footer">
                <p class="mr-40">
                  <span class="card-footer-title">{{ t('generic.created') }}</span>
                  <span>: <DateComponent :value="secret.createdAt" /></span>
                </p>
                <p>
                  <span class="card-footer-title">{{ t('tableHeaders.lastUsed') }}</span>
                  <span v-if="!secret.lastUsedAt">: {{ t('oidcclient.usedNever') }}</span>
                  <span v-else>: <DateComponent :value="secret.lastUsedAt" /></span>
                </p>
              </div>
            </template>
            <template
              #item-card-actions
            >
              <ActionMenu
                :data-testid="`oidc-client-secret-${i}-action-menu`"
                :resource="secret"
                :custom-actions="cardActions"
                @action-invoked="(payload) => handleSecretAction(secret, payload)"
              />
            </template>
          </rc-item-card>
        </div>
        <button
          class="btn role-primary mt-20"
          data-testid="oidc-client-add-new-secret"
          @click="addNewSecret"
        >
          {{ t('oidcclient.addNewSecret') }}
        </button>
      </div>
    </div>
    <div v-else-if="showNoSecrets">
      {{ t('oidcclient.noClientId') }}
    </div>
  </div>
</template>

<style lang="scss" scoped>
.card-item {
  max-width: 800px
}
.card-grid-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(600px, 1fr));
  gap: 24px;
}

.card-footer {
  display: flex;

  p {
    color: var(--link-text-secondary);
    font-weight: 400;
    font-size: 14px;
    line-height: 20px;
    letter-spacing: 0%;

    .card-footer-title {
      text-decoration: underline;
    }
  }
}
</style>
