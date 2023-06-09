import Cronjob from '@shell/models/batch.cronjob';
describe('class Cronjob', () => {
  it('should have no ownerReferences by default', () => {
    const cronJobData = {
      id:         'any-id',
      type:       'batch.job',
      apiVersion: 'batch/v1',
      kind:       'Job',
      metadata:   {
        name:      'any-name',
        namespace: 'any-namespace',
        uid:       'any-uid'
      },
      spec: { jobTemplate: {} }
    };
    const expectation = {
      name: 'any-name', namespace: 'any-namespace', uid: 'any-uid'
    };
    const cronjob = new Cronjob(cronJobData);

    expect(cronjob.metadata).toStrictEqual(expectation);
  });

  describe('method runNow', () => {
    it('should populate job metadata', async() => {
      const jobData = {
        id:         'any-id',
        type:       'batch.job',
        apiVersion: 'batch/v1',
        kind:       'Job',
        metadata:   {
          name:      'any-name',
          namespace: 'any-namespace',
          uid:       'any-uid'
        },
        spec: { jobTemplate: {} }
      };
      const date = Date.now();
      const expected = {
        name:            `${ jobData.metadata.name }-${ date }`,
        namespace:       jobData.metadata.namespace,
        ownerReferences: [{
          apiVersion: 'batch/v1',
          controller: true,
          kind:       'Job',
          name:       jobData.metadata.name,
          uid:        jobData.metadata.uid
        }],
        uid: jobData.metadata.uid
      };
      const dispatcher = () => ({
        ...jobData,
        save:       jest.fn(),
        goToDetail: jest.fn()
      });
      const cronjob = new Cronjob(jobData, { dispatch: dispatcher });

      jest
        .useFakeTimers()
        .setSystemTime(date);
      jest.spyOn(cronjob, '$dispatch').mockImplementation(dispatcher);

      await cronjob.runNow();

      expect(cronjob.metadata).toStrictEqual(expected);
    });

    it('should redirect to another page', async() => {
      const jobData = {
        metadata: { name: 'any-name' },
        spec:     { jobTemplate: {} }
      };
      const callback = jest.fn();
      const dispatcher = () => ({
        ...jobData,
        save:       jest.fn(),
        goToDetail: callback
      });
      const cronjob = new Cronjob(jobData, { dispatch: dispatcher });

      jest.spyOn(cronjob, '$dispatch').mockImplementation(dispatcher);

      await cronjob.runNow();

      expect(callback).toHaveBeenCalledWith();
    });
  });
});
