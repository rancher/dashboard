import ContainerMountPaths from '@shell/pages/c/_cluster/logging/ContainerMountPaths.vue';
import { set } from '@shell/utils/object';

describe('component: ContainerMountPaths', () => {
  it('test methods: initVolumeMounts', () => {
    const containerName = 'test';
    const uid = 'uid123456';
    const localThis = {
      $set:  set,
      uid,
      value: {
        volumes: [
          { name: `host-path-${ uid }-${ containerName }` }
        ]
      },
      workload:   { metadata: { uid } },
      containers: [{ name: containerName, volumeMounts: [{ name: `host-path-${ uid }-${ containerName }` }] }]
    };

    ContainerMountPaths.methods.initVolumeMounts.call(localThis);
    expect(localThis.containers[0].volumeMounts[0].name ).toBe(`host-path-$uid`);
  });
});
