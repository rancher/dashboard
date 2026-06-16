import { computed, Ref, toValue } from 'vue';
import { useStore } from 'vuex';
import { Props as BannerProps } from '@components/Banner/Banner.vue';
import { useI18n } from '@shell/composables/useI18n';
import ResourceClass from '@shell/plugins/dashboard-store/resource-class';

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

export const useOnShowConfiguration = (resource: any) => {
  return (returnFocusSelector?: string, defaultTab?: string) => {
    const resourceValue = toValue(resource);
    // Because extensions can make a copy of the resource-class it's possible that an extension will have a resource-class which predates the inclusion of showConfiguration
    // to still the rest of shell to consume
    const showConfiguration = resourceValue.showConfiguration ? resourceValue.showConfiguration.bind(resourceValue) : ResourceClass.prototype.showConfiguration.bind(resourceValue);

    showConfiguration(returnFocusSelector, defaultTab);
  };
};
