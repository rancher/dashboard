import { MANAGEMENT } from '@shell/config/types';
import { Store } from 'vuex';
import { DEFAULT_PERF_SETTING, PerfSettings, SETTING } from '@shell/config/settings';

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
  return Object.assign(DEFAULT_PERF_SETTING, perfSetting || {});
};
