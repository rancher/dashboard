import Cloudcredential from '@shell/edit/cloudcredential.vue';

describe('fetch: cloudcredential', () => {
  it('should fetch operator driver', async() => {
    const value = {};
    let requestFun = key => (key);
    const localThis = {
      value,
      $store: {
        dispatch: (key) => {
          return new Promise((resolve, reject) => {
            const store = {
              'rancher/request': requestFun,
              'rancher/find':    (key, a) => {
                return key;
              },
              'management/findAll': (key, a) => {
                return key;
              },
            };

            if (store[key]) {
              return resolve(store[key]());
            }
          });
        },
      },
    };

    await Cloudcredential.fetch.call(localThis);
    expect(localThis.operatorDrivers).toStrictEqual([]); // test error return []

    requestFun = (key) => {
      return { data: [{ id: 'test' }] };
    };
    await Cloudcredential.fetch.call(localThis);
    expect(localThis.operatorDrivers).toHaveLength(1);
  });
});
