import LoggingExtensionDialog from '@shell/dialog/LoggingExtensionDialog.vue';

describe('component: LoggingExtensionDialog', () => {
  it('test methods: updateVolumeMounts & getHosttailerVolumesByVolumeMounts & updateVolumes', () => {
    const containerName = 'test';
    const uid = 'uid123456';
    const localThis = {
      uid,
      value: {
        volumes: [
          { name: `host-path-${ uid }-1` }, { name: `host-path-${ uid }-2` }
        ]
      }
    };
    const containers = [{ name: containerName, volumeMounts: [{ name: `host-path-$uid` }] }];

    LoggingExtensionDialog.methods.updateVolumeMounts.call(localThis, containers);
    expect(containers[0].volumeMounts[0].name ).toBe(`host-path-${ uid }-${ containerName }`);

    const podVolumes = LoggingExtensionDialog.methods.getHosttailerVolumesByVolumeMounts.call(localThis, containers);

    expect(podVolumes).toStrictEqual([{
      _type: 'hostPath', hostPath: { path: `/var/log/hosttailer/${ uid }`, type: 'DirectoryOrCreate' }, name: `host-path-${ uid }-${ containerName }`
    }]);

    LoggingExtensionDialog.methods.updateVolumes.call(localThis, podVolumes);
    expect(localThis.value.volumes).toStrictEqual(podVolumes);
  });
});
