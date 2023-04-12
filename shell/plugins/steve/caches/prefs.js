import ExternalCache from '@shell/plugins/steve/caches/externalCache';
import { get } from '@shell/utils/prefs';
export default class PrefsCache extends ExternalCache {
  load(data) {
    super.load(data);

    const prefsDefinitions = this.resources.definitions;
    const prefsData = this.resources.data;

    this.rootGetters['prefs/get'] = get(prefsDefinitions, prefsData);
  }
}
