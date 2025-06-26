import { computed, Ref, toValue } from 'vue';
import { useStore } from 'vuex';
import { Props as BannerProps } from '@components/Banner/Banner.vue';
import { useI18n } from '@shell/composables/useI18n';

export const useResourceDetailBannerProps = (resource: any): Ref<BannerProps | undefined> => {
  const store = useStore();
  const i18n = useI18n(store);
  const resourceValue = toValue(resource);

  return computed(() => {
    const options = store.getters[`type-map/optionsFor`](resourceValue.type);

    if (options.hideBanner) {
      return;
    }

    if (resourceValue?.stateObj?.error) {
      const defaultErrorMessage = i18n.t('resourceDetail.masthead.defaultBannerMessage.error', undefined, true);

      return {
        color: 'error',
        label: resourceValue.stateObj.message || defaultErrorMessage
      };
    }

    if (resourceValue?.spec?.paused) {
      return {
        color: 'info',
        label: i18n.t('asyncButton.pause.description')
      };
    }

    if (resourceValue?.stateObj?.transitioning) {
      const defaultTransitioningMessage = i18n.t('resourceDetail.masthead.defaultBannerMessage.transitioning', undefined, true);

      return {
        color: 'info',
        label: resourceValue.stateObj.message || defaultTransitioningMessage
      };
    }

    return undefined;
  });
};
