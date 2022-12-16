import { MANAGEMENT } from '@shell/config/types';
import { Store } from 'vuex';
import { DEFAULT_PERF_SETTING, SETTING } from '@shell/config/settings';

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

export const setSetting = async(store: Store<any>, id: string, val: string): Promise<any> => {
  const setting = await fetchOrCreateSetting(store, id, val, false);

  setting.value = val;
  await setting.save();

  return setting;
};

export const getPerformanceSetting = (rootGetters: Record<string, (arg0: string, arg1: string) => any>) => {
  const perfSetting = rootGetters['management/byId'](MANAGEMENT.SETTING, SETTING.UI_PERFORMANCE);
  let perfConfig = {};

  if (perfSetting && perfSetting.value) {
    try {
      perfConfig = JSON.parse(perfSetting.value);
    } catch (e) {
      console.warn('ui-performance setting contains invalid data'); // eslint-disable-line no-console
    }
  }

  // Start with the default and overwrite the values from the setting - ensures we have defaults for newly added options
  perfConfig = Object.assign(DEFAULT_PERF_SETTING, perfConfig);

  return perfConfig;
};
