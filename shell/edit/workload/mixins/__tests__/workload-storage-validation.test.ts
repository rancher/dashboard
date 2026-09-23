import { h, VNode } from 'vue';
import { shallowMount } from '@vue/test-utils';
import FormValidation from '@shell/mixins/form-validation';
import workloadMixin from '@shell/edit/workload/mixins/workload.js';

describe('workload mixin: storage validation', () => {
  const mockT = (key: string, args?: { key?: string, name?: string }) => (args ? `${ key }:${ args.key ?? args.name }` : key);

  const Host = {
    mixins:   [FormValidation],
    props:    ['value', 'mode'],
    data:     (workloadMixin as any).data,
    computed: {
      podTemplateSpec:          (workloadMixin.computed as any).podTemplateSpec,
      volumeRules:              (workloadMixin.computed as any).volumeRules,
      volumeClaimTemplateNames: (workloadMixin.computed as any).volumeClaimTemplateNames,
      tabErrors:                (workloadMixin.computed as any).tabErrors,
      allContainers:            (workloadMixin.computed as any).allContainers,
    },
    methods: {
      volumeMountsOf:              (workloadMixin.methods as any).volumeMountsOf,
      secondaryResourceDataConfig: () => ({}),
      t:                           mockT,
    },
    render(this: any): VNode {
      return h('div', JSON.stringify({ tabErrors: this.tabErrors, errors: this.allContainers.map((container: any) => container.error) }));
    },
  };

  function mountWith({ volumes, volumeMounts = [], volumeClaimTemplates }: { volumes?: any[], volumeMounts?: any[], volumeClaimTemplates?: any[] }) {
    const value = {
      type:     'apps.statefulset',
      metadata: { name: 'test', namespace: 'default' },
      spec:     {
        volumeClaimTemplates,
        template: {
          spec: {
            containers: [{
              name: 'container-0', image: 'nginx', volumeMounts
            }],
            volumes,
          }
        }
      },
    };

    return shallowMount(Host, {
      props:  { value, mode: 'edit' },
      global: {
        mocks: {
          $route: { params: { resource: 'apps.statefulset' }, query: {} },
          $store: { getters: { 'i18n/t': mockT, currentStore: () => 'cluster' } },
        },
      },
    }).vm as any;
  }

  it.each([
    ['name', 'workload.storage.volumeName', { name: '', emptyDir: {} }],
    ['awsElasticBlockStore.volumeID', 'workload.storage.csi.volumeID', { name: 'vol', awsElasticBlockStore: {} }],
    ['azureDisk.diskName', 'workload.storage.csi.diskName', { name: 'vol', azureDisk: { diskURI: 'uri' } }],
    ['azureDisk.diskURI', 'workload.storage.csi.diskURI', { name: 'vol', azureDisk: { diskName: 'disk' } }],
    ['azureFile.shareName', 'workload.storage.csi.shareName', { name: 'vol', azureFile: { secretName: 'secret' } }],
    ['azureFile.secretName', 'workload.storage.csi.secretName', { name: 'vol', azureFile: { shareName: 'share' } }],
    ['configMap.name', 'workload.storage.subtypes.configMap', { name: 'vol', configMap: {} }],
    ['csi.driver', 'workload.storage.driver', { name: 'vol', csi: { volumeAttributes: {} } }],
    ['gcePersistentDisk.pdName', 'workload.storage.csi.pdName', { name: 'vol', gcePersistentDisk: {} }],
    ['hostPath.path', 'workload.storage.nodePath', { name: 'vol', hostPath: { type: '' } }],
    ['nfs.path', 'workload.storage.path', { name: 'vol', nfs: { server: 'server' } }],
    ['nfs.server', 'workload.storage.server', { name: 'vol', nfs: { path: '/export' } }],
    ['persistentVolumeClaim.claimName', 'workload.storage.subtypes.persistentVolumeClaim', { name: 'vol', persistentVolumeClaim: {} }],
    ['secret.secretName', 'workload.storage.subtypes.secret', { name: 'vol', secret: {} }],
    ['vsphereVolume.volumePath', 'workload.storage.csi.volumePath', { name: 'vol', vsphereVolume: {} }],
  ])('should reject a volume missing %p', (field, label, volume) => {
    const vm = mountWith({ volumes: [volume] });
    const [required] = vm.volumeRules[field];

    expect(vm.fvFormIsValid).toStrictEqual(false);
    expect(vm.tabErrors.podStorage).toStrictEqual(true);
    expect(required('')).toStrictEqual(`validation.required:${ label }`);
  });

  it.each([
    ['emptyDir', { name: 'vol', emptyDir: { medium: '' } }],
    ['awsElasticBlockStore', { name: 'vol', awsElasticBlockStore: { volumeID: 'vol-123' } }],
    ['nfs', { name: 'vol', nfs: { server: 'server', path: '/export' } }],
    ['vsphereVolume without a storage policy', { name: 'vol', vsphereVolume: { volumePath: '[ds] disk.vmdk' } }],
  ])('should accept a complete %p volume', (_type, volume) => {
    const vm = mountWith({ volumes: [volume] });

    expect(vm.fvFormIsValid).toStrictEqual(true);
    expect(vm.tabErrors.podStorage).toStrictEqual(false);
  });

  it('should accept a pod without volumes', () => {
    const vm = mountWith({});

    expect(vm.fvFormIsValid).toStrictEqual(true);
    expect(vm.tabErrors.podStorage).toStrictEqual(false);
  });

  it('should flag the volume claim templates tab, not the container storage tab, for an empty claim template mount point', () => {
    const vm = mountWith({
      volumeClaimTemplates: [{ metadata: { name: 'data' } }],
      volumeMounts:         [{ name: 'data' }],
    });

    expect(vm.tabErrors.volumeClaimTemplates).toStrictEqual(true);
    expect(vm.allContainers[0].error.storage).toBeUndefined();
  });

  it('should flag the volume claim templates tab for a mount of a claim template that has no name yet', () => {
    const vm = mountWith({
      volumeClaimTemplates: [{ metadata: {} }],
      volumeMounts:         [{ name: '' }],
    });

    expect(vm.tabErrors.volumeClaimTemplates).toStrictEqual(true);
    expect(vm.allContainers[0].error.storage).toBeUndefined();
  });

  it('should reject a claim template without a name', () => {
    const vm = mountWith({
      volumeClaimTemplates: [{ metadata: {} }],
      volumeMounts:         [{ name: '', mountPath: '/data' }],
    });

    expect(vm.fvFormIsValid).toStrictEqual(false);
    expect(vm.tabErrors.volumeClaimTemplates).toStrictEqual(true);
  });

  it('should accept a named claim template whose mount has a mount point', () => {
    const vm = mountWith({
      volumeClaimTemplates: [{ metadata: { name: 'data' } }],
      volumeMounts:         [{ name: 'data', mountPath: '/data' }],
    });

    expect(vm.fvFormIsValid).toStrictEqual(true);
    expect(vm.tabErrors.volumeClaimTemplates).toStrictEqual(false);
  });

  it('should render container and tab errors without recursive updates', async() => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const vm = mountWith({
      volumes:              [{ name: 'vol', emptyDir: {} }],
      volumeClaimTemplates: [{ metadata: { name: 'data' } }],
      volumeMounts:         [{ name: 'data' }, { name: 'vol' }],
    });

    vm.podTemplateSpec.containers[0].volumeMounts[1].mountPath = '/data';
    await vm.$nextTick();

    expect(warn.mock.calls.flat().join(' ')).not.toContain('Maximum recursive updates');
    expect(vm.$el.textContent).toContain('"volumeClaimTemplates":true');
    warn.mockRestore();
  });

  it('should flag the container storage tab, not the volume claim templates tab, for an empty volume mount point', () => {
    const vm = mountWith({
      volumes:              [{ name: 'vol', emptyDir: {} }],
      volumeClaimTemplates: [{ metadata: { name: 'data' } }],
      volumeMounts:         [{ name: 'data', mountPath: '/data' }, { name: 'vol' }],
    });

    expect(vm.tabErrors.volumeClaimTemplates).toStrictEqual(false);
    expect(vm.allContainers[0].error.storage).toStrictEqual('workload.validation.volumeMountPath:container-0');
  });
});
