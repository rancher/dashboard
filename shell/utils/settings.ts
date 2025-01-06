import { MANAGEMENT } from '@shell/config/types';
import { Store } from 'vuex';
import { DEFAULT_PERF_SETTING, PerfSettings, SETTING } from '@shell/config/settings';
import { pluralize } from '@shell/utils/string';
import { _MULTI } from '@shell/plugins/dashboard-store/actions';
import { IExtensions, RegistrationType, Setting } from 'core/types';

interface ISetting {
  id: string;
  value: string;
}

export const fetchOrCreateSetting = async(store: Store<any>, id: string, val: string, save = true): Promise<any> => {
  let setting;

  try {
    setting = await store.dispatch('management/find', { type: MANAGEMENT.SETTING, id });
  } catch {
    const schema = store.getters['management/schemaFor'](MANAGEMENT.SETTING);
    const url = schema.linkFor('collection');

    setting = await store.dispatch('management/create', {
      type: MANAGEMENT.SETTING, metadata: { name: id }, value: val, default: val || ''
    });
    if ( save ) {
      await setting.save({ url });
    }
  }

  return setting;
};

/**
  * Fetch a specific setting that might not exist
  * We fetch all settings - reality is Rancher will have done this already, so there's no overhead in doing
  * this - but if we fetch a specific setting that does not exist, we will get a 404, which we don't want
  */
export const fetchSetting = async(store: Store<any>, id: string): Promise<any> => {
  const all = await store.dispatch('management/findAll', { type: MANAGEMENT.SETTING });
  const setting = (all || []).find((setting: any) => setting.id === id);

  return setting;
};

/**
 * Carefully fetch mgmt settings
 *
 * Ensures that
 * - Concurrent calls to this function will only result in a single http request
 * - Subsequent calls, when either logged in or logged out, will only result in a single http request
 * - Logged out call will fetch partial settings, after logging in another call will fetch all settings
 *
 * Will be used in many places, particularly multiple times when loading the dashboard
 *
 * Note - We need to specify the url for cases where it can't be determined (i.e. we haven't fetched schemas)
 */
export const fetchInitialSettings = async(store: Store<any>): Promise<any> => {
  const generation = store.getters['management/generation'](MANAGEMENT.SETTING);
  // We use this as it copies the previous mechanism this was based on (in findAll)
  // There is the getter `auth/loggedInAs` (which is set given `fromHeader`), but that's initialised after the first call to here (see `authenticated`)
  const header = store.getters['auth/fromHeader'];
  const authed = `${ header }` === 'true' || `${ header }` === 'none';

  if (authed) {
    // We're authed, we will always get the full list
    return await store.dispatch('management/findAll', {
      type: MANAGEMENT.SETTING,
      opt:  { url: `/v1/${ pluralize(MANAGEMENT.SETTING) }` }
    } );
  }

  if (!generation) {
    // We're not authed, and haven't previously fetched settings (no generation)
    // Fetch settings, put them in the store, but don't say we've got all yet (so subsequent calls will run)
    return await store.dispatch('management/findAll', {
      type: MANAGEMENT.SETTING,
      opt:  {
        url:                  `/v1/${ pluralize(MANAGEMENT.SETTING) }`,
        load:                 _MULTI,
        redirectUnauthorized: false
      }
    });
  }

  // We're not authed, but have a previous value, no need to make a http request to fetch again
  return store.getters['management/all'](MANAGEMENT.SETTING);
};

export const setSetting = async(store: Store<any>, id: string, val: string): Promise<any> => {
  const setting = await fetchOrCreateSetting(store, id, val, false);

  setting.value = val;
  await setting.save();

  return setting;
};

export const getPerformanceSetting = (rootGetters: Record<string, (arg0: string, arg1: string) => any>): PerfSettings => {
  const perfSettingResource = rootGetters['management/byId'](MANAGEMENT.SETTING, SETTING.UI_PERFORMANCE);
  let perfSetting = {};

  if (perfSettingResource?.value) {
    try {
      perfSetting = JSON.parse(perfSettingResource.value);
    } catch (e) {
      console.warn('ui-performance setting contains invalid data'); // eslint-disable-line no-console
    }
  }

  // Start with the default and overwrite the values from the setting - ensures we have defaults for newly added options
  const safeDefaults = Object.assign({}, DEFAULT_PERF_SETTING);

  return Object.assign(safeDefaults, perfSetting || {});
};

// ===========================================================================================================================
// Settings support with overrides from extensions
// ===========================================================================================================================

/**
 * Get a setting value, either from the supplied setting resource, of from an extension, if set that way.
 * This takes into account the override value when set via an extension.
 * 
 * @param setting Setting resource from the backend API 
 * @param $plugin Extensions APi to use to look up the setting
 * @returns Setting value or undefined if not set
 */
export function getSettingValue(setting: ISetting, $plugin: IExtensions): string | undefined {
  if (!setting) {
    return;
  }

  // Simple mapping of setting name - remove the 'ui-' prefix if present
  const id = setting.id.startsWith('ui-') ? setting.id.substr(3) : setting.id;

  // Check first if an extension has set the setting and use that
  const extensionValue = getSettingFromExtension(id, $plugin);

  // If the value is set from an extension, use it if it is set to always be an override
  if (extensionValue?.value && extensionValue?.override) {
    return extensionValue.value;
  }

  // Use the setting, or the value from an extension as a default when not set via a setting
  return setting?.value || extensionValue?.value;  
}

/**
 * Look to see if the given setting is provided by an extension and return it if so
 *
 * @param name Setting name to look up
 * @param $plugin Extensions APi to use to look up the setting
 * @returns Setting or undefined it not set by an extension
 */
export function getSettingFromExtension(name: string, $plugin: IExtensions): Setting {
  return $plugin.getDynamic(RegistrationType.SETTING, name);
}
