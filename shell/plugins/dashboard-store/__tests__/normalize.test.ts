import { handleConflict } from '@shell/plugins/dashboard-store/normalize';
import { handleConflictUseCases } from '@shell/plugins/dashboard-store/__tests__/utils/normalize-usecases';
import actions from '@shell/plugins/steve/actions.js';
import cloneDeep from 'lodash/cloneDeep';

describe('fx: handleConflict', () => {
  const testArr = handleConflictUseCases.map((usecase: any) => [usecase.description, usecase.data, usecase.result, usecase.outputValidation]);

  it.each(testArr)('should handleConflict correctly for usecase ::: %s', async(text, usecaseData, res, validationData) => {
    const storeName = 'management';

    const mocks = {
      storeName,
      dispatch: async(arg1: any, arg2: any) => {
        return Promise.resolve(actions.cleanForDiff({}, arg2));
      },
      rootGetters: { 'i18n/t': () => jest.fn().mockReturnValue('some-conflicts') }
    };

    const initialValue = cloneDeep(usecaseData.initialConfig as any);
    const currUserValue = cloneDeep(usecaseData.currentConfig as any);
    const serverValue = cloneDeep(usecaseData.latestConfig as any);

    initialValue.toJSON = () => Object.assign({}, initialValue);
    currUserValue.toJSON = () => Object.assign({}, currUserValue);
    serverValue.toJSON = () => Object.assign({}, serverValue);

    // export async function handleConflict(initialValueJSON, value, liveValue, rootGetters, store, storeNamespace) {
    const result = await handleConflict(initialValue, currUserValue, serverValue, mocks.rootGetters, mocks, storeName);

    expect(typeof res !== 'boolean' ? result?.length : result).toStrictEqual(res);
    expect(currUserValue).toStrictEqual(expect.objectContaining(validationData));
  });
});
