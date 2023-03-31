import ExternalCache from '@shell/plugins/steve/caches/externalCache';
import { i18n } from '@shell/plugins/steve/storeUtils/i18n';

export default class TranslationCache extends ExternalCache {
  config = {};

  load(config) {
    this.config = config;
    this.rootGetters['i18n/translate'] = i18n(this.config).translate;
    this.rootGetters['i18n/translateWithFallback'] = i18n(this.config).translateWithFallback;
    this.rootGetters['i18n/exists'] = i18n(this.config).exists;
  }
}
