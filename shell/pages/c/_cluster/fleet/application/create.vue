<script setup lang="ts">
import { computed } from 'vue';
import { useStore } from 'vuex';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from '@shell/composables/useI18n';
import { FLEET } from '@shell/config/types';
import { SUB_TYPE } from '@shell/config/query-params';
import { isRancherPrime } from '@shell/config/version';
import FleetUtils from '@shell/utils/fleet';
import Masthead from '@shell/components/ResourceDetail/Masthead';
import suseLogo from '@shell/assets/images/content/suse.svg';
import suseLogoDark from '@shell/assets/images/content/dark/suse.svg';
import RcSeparator from '@shell/components/RcSeparator';

interface Subtype {
  id: string;
  label: string;
  description: string;
  icon?: string;
  bannerImage?: string;
  bannerAbbrv?: string;
  docLink?: string;
  disabled: boolean;
  tooltip: string | null;
  isSuseAppCollection?: boolean;
}

const store = useStore();
const route = useRoute();
const router = useRouter();
const { t } = useI18n(store);

const resource = FLEET.APPLICATION;
const application = computed(() => ({ parentNameOverride: store.getters['i18n/t'](`typeLabel."${ FLEET.APPLICATION }"`, { count: 1 })?.trim() }));
const abbrSizes: Record<number, string> = {
  3: '24px',
  4: '18px',
  5: '16px',
  6: '14px'
};

const i18nExists = (key: string): boolean => store.getters['i18n/exists'](key);

const isDarkMode = computed(() => store.getters['prefs/theme'] === 'dark');

const selectedSubtype = computed(() => route.query[SUB_TYPE] as string);

const types = computed<Subtype[]>(() => {
  return [
    FLEET.GIT_REPO,
    FLEET.HELM_OP,
    FLEET.SUSE_APP_COLLECTION,
  ].reduce((acc: Subtype[], type: string) => {
    if (type === FLEET.SUSE_APP_COLLECTION) {
      if (!isRancherPrime()) {
        return acc;
      }

      const helmOpSchema = store.getters['management/schemaFor'](FLEET.HELM_OP);

      if (!helmOpSchema) {
        return acc;
      }

      const label = store.getters['type-map/labelFor'](helmOpSchema, 2) || '';
      const canCreate = !!helmOpSchema.resourceMethods?.includes('PUT');

      return [
        ...acc,
        {
          id:                  type,
          label:               `fleet.application.subTypes.'${ type }'.label`,
          description:         `fleet.application.subTypes.'${ type }'.description`,
          bannerImage:         isDarkMode.value ? suseLogoDark : suseLogo,
          disabled:            !canCreate,
          tooltip:             canCreate ? null : t('fleet.application.noPermissions', { label }, true),
          isSuseAppCollection: true,
        }
      ];
    }

    const schema = store.getters['management/schemaFor'](type);

    if (schema) {
      const label = store.getters['type-map/labelFor'](schema, 2) || '';
      const canCreate = !!schema.resourceMethods?.includes('PUT');

      return [
        ...acc,
        {
          id:          type,
          label,
          description: `fleet.application.subTypes.'${ type }'.description`,
          icon:        FleetUtils.dashboardIcons[type],
          disabled:    !canCreate,
          tooltip:     canCreate ? null : t('fleet.application.noPermissions', { label }, true),
        }
      ];
    }

    return acc;
  }, []);
});

const subtypeAriaLabel = (subtype: Subtype): string => {
  const label = i18nExists(subtype.label) ? t(subtype.label) : subtype.label;
  const desc = subtype.description && i18nExists(subtype.description) ? t(subtype.description) : subtype.description;

  return desc ? `${ label } - ${ desc }` : label;
};

const selectType = (subtype: Subtype, event?: Event) => {
  if (subtype.disabled) {
    return;
  }

  if ((event?.target as HTMLElement)?.tagName === 'A') {
    return;
  }

  if (subtype.isSuseAppCollection) {
    router.push({
      name:   'c-cluster-fleet-application-appco-credentials',
      params: { cluster: route.params.cluster as string },
    });

    return;
  }

  router.push({
    name:   'c-cluster-fleet-application-resource-create',
    params: {
      cluster:  route.params.cluster as string,
      product:  store.getters.productId,
      resource: subtype.id,
    },
  });
};

const cancel = () => {
  router.back();
};
</script>

<template>
  <div v-if="!selectedSubtype">
    <div class="header">
      <Masthead
        :resource="resource"
        :value="application"
      />
    </div>
    <div class="subtypes-container">
      <div
        v-for="(subtype, i) in types"
        :key="i"
        v-clean-tooltip="subtype.tooltip"
        class="subtype-banner"
        tabindex="0"
        role="link"
        :class="{
          selected: subtype.id === selectedSubtype,
          disabled: subtype.disabled
        }"
        :data-testid="`subtype-banner-item-${subtype.id}`"
        :aria-disabled="subtype.disabled || undefined"
        :aria-label="subtypeAriaLabel(subtype)"
        @click="selectType(subtype, $event)"
        @keyup.enter.space="selectType(subtype, $event)"
      >
        <div class="subtype-container">
          <div class="subtype-logo">
            <img
              v-if="subtype.bannerImage"
              :src="subtype.bannerImage"
              :alt="(resource.type ? resource.type + ': ' : '') + (subtype.label || '')"
            >
            <div v-else-if="subtype.icon">
              <i
                class="icon icon-image"
                :class="subtype.icon"
              />
            </div>
            <div
              v-else
              class="round-image"
            >
              <div
                v-if="subtype.bannerAbbrv"
                class="banner-abbrv"
              >
                <span v-if="i18nExists(subtype.bannerAbbrv)">{{ t(subtype.bannerAbbrv) }}</span>
                <span
                  v-else
                  :style="{fontSize: abbrSizes[subtype.bannerAbbrv.length]}"
                >{{ subtype.bannerAbbrv }}</span>
              </div>
              <div v-else>
                {{ subtype.id.slice(0, 1).toUpperCase() }}
              </div>
            </div>
          </div>
          <div class="subtype-body">
            <div
              class="title"
              :class="{'with-description': !!subtype.description}"
            >
              <h5>
                <span
                  v-if="i18nExists(subtype.label)"
                  v-clean-html="t(subtype.label)"
                />
                <span v-else>{{ subtype.label }}</span>
              </h5>
              <a
                v-if="subtype.docLink"
                :href="subtype.docLink"
                target="_blank"
                rel="noopener nofollow"
                class="flex-right"
              >{{ t('generic.moreInfo') }} <i class="icon icon-external-link" /></a>
            </div>
            <RcSeparator v-if="subtype.description" />
            <div
              v-if="subtype.description"
              class="description"
            >
              <span
                v-if="i18nExists(subtype.description)"
                v-clean-html="t(subtype.description, {}, true)"
              />
              <span v-else>{{ subtype.description }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="footer">
      <button
        type="button"
        class="btn role-secondary"
        @click="cancel"
      >
        {{ t('generic.cancel') }}
      </button>
    </div>
  </div>
  <div v-else>
    empty
  </div>
</template>

<style lang='scss' scoped>

  $logo: 60px;
  $logo-space: 100px;

  .subtypes-container {
    display: flex;
    flex-wrap: wrap;
    width: 100%;
    flex-direction:row;
    align-content: baseline;
    justify-content: space-between;
  }
  .subtype-banner {
    border: 1px solid var(--border);
    border-radius: 0;
    display: flex;
    flex-basis: 48%;
    margin: 10px;

    &.disabled {
      cursor: not-allowed !important;
      background-color: var(--disabled-bg);
    }

    &.selected {
      background-color: var(--accent-btn);
    }

    &.top {
      background-image: linear-gradient(
        -90deg,
        var(--body-bg),
        var(--accent-btn)
      );

      h2 {
        margin: 0px;
      }
    }

    .title {
      align-items: center;
      display: flex;
      width: 100%;

      h5 {
        margin: 0;
      }

      .flex-right {
        margin-left: auto;
      }
    }

    .description {
      color: var(--input-label);
      display: flex;
      flex-direction: column;
      justify-content: center;
    }

    &:not(.top) {
      flex-direction: column;
      justify-content: start;
      &:hover {
        cursor: pointer;
        box-shadow: 0px 0px 1px var(--outline-width) var(--outline);
      }
    }

    .round-image {
      border-radius: 50%;
      height: 60px;
      width: 60px;
      overflow: hidden;
    }

    .banner-abbrv {
      align-items: center;
      background-color: var(--primary);
      color: var(--body-bg);
      display: flex;
      font-size: 2.5em;
      height: 100%;
      justify-content: center;
      width: 100%;
    }
  }

  .subtype-container {
    position: relative;
    display: flex;
    height: 100%;
  }

  .subtype-body {
    flex: 1;
    padding: 10px;
  }

  .subtype-logo {
    align-items: center;
    display: flex;
    justify-content: center;
    min-width: $logo-space;
    min-height: $logo-space;
    overflow: hidden;
    background-color: var(--box-bg);

    img {
      width: $logo - 4px;
      height: $logo - 4px;
      object-fit: contain;
      position: relative;
      top: 2px;
    }
  }

  .subtype-banner {
    .round-image {
      background-color: var(--primary);
    }

    &:focus-visible {
      @include focus-outline;
    }
  }

  .icon {
    font-size: 4.45em;
    line-height: 0.95em;
  }

  .footer {
    display: flex;
    justify-content: flex-end;
    margin: auto 10px 0 10px;
    z-index: 19;
  }
</style>
