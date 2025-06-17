import { handleConflict } from '@shell/plugins/dashboard-store/normalize';
import { usecases } from '@shell/plugins/dashboard-store/__tests__/utils/normalize-usecases';
import actions from '@shell/plugins/steve/actions.js';

describe('fx: handleConflict', () => {
  it.each([
    ['two keys same, another different', usecases.usecase1, false],
    ['two different keys', usecases.usecase2, false],
    ['only one left', usecases.usecase3, false],
    ['with conflict', usecases.usecase4, 1],
  ])('should handleConflict correctly for usecase ::: %s', async(text, usecaseData, res) => {
    const storeName = 'management';

    const mocks = {
      storeName,
      dispatch: async(arg1: any, arg2: any) => {
        return Promise.resolve(actions.cleanForDiff({}, arg2));
      },
      rootGetters: { 'i18n/t': () => jest.fn().mockReturnValue('some-conflicts') }
    };

    const initialValue = usecaseData.initialConfig as any;
    const currUserValue = usecaseData.currentConfig as any;
    const serverValue = usecaseData.latestConfig as any;

    initialValue.toJSON = () => Object.assign({}, initialValue);
    currUserValue.toJSON = () => Object.assign({}, currUserValue);
    serverValue.toJSON = () => Object.assign({}, serverValue);

    // export async function handleConflict(initialValueJSON, value, liveValue, rootGetters, store, storeNamespace) {
    const result = await handleConflict(initialValue, currUserValue, serverValue, mocks.rootGetters, mocks, storeName);

    expect(typeof res !== 'boolean' ? result?.length : result).toStrictEqual(res);
  });
});
