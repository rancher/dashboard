import { mount } from '@vue/test-utils';
import flushPromises from 'flush-promises';
import { SECRET_TYPES } from '@shell/config/secret';
import { FLEET as FLEET_ANNOTATIONS } from '@shell/config/labels-annotations';
import FleetOCIStorageSecret from '@shell/components/fleet/FleetOCIStorageSecret.vue';
import { _CREATE, _EDIT } from '@shell/config/query-params';

const workspaces = [
  {
    id:       'fleet-local',
    metadata: { annotations: { [FLEET_ANNOTATIONS.OCI_STORAGE_SECRET_DEFAULT]: 'secret-1' } }
  },
  {
    id:       'fleet-default',
    metadata: { annotations: { } }
  },
  {
    id:       'fleet-custom-workspace',
    metadata: { annotations: { [FLEET_ANNOTATIONS.OCI_STORAGE_SECRET_DEFAULT]: 'secret-6' } }
  },
];

const secrets = [
  {
    id:       'fleet-local/secret-1',
    name:     'secret-1',
    _type:    SECRET_TYPES.FLEET_OCI_STORAGE,
    metadata: {
      namespace:   'fleet-local',
      annotations: { [FLEET_ANNOTATIONS.OCI_STORAGE_SECRET_GENERATED]: false }
    }
  },
  {
    id:       'fleet-local/secret-2',
    name:     'secret-2',
    _type:    SECRET_TYPES.FLEET_OCI_STORAGE,
    metadata: {
      namespace:   'fleet-local',
      annotations: { [FLEET_ANNOTATIONS.OCI_STORAGE_SECRET_GENERATED]: 'true' }
    }
  },
  {
    id:       'fleet-default/secret-3',
    name:     'secret-3',
    _type:    SECRET_TYPES.FLEET_OCI_STORAGE,
    metadata: {
      namespace:   'fleet-default',
      annotations: { [FLEET_ANNOTATIONS.OCI_STORAGE_SECRET_GENERATED]: false }
    }
  },
  {
    id:       'fleet-default/secret-4',
    name:     'secret-4',
    _type:    SECRET_TYPES.FLEET_OCI_STORAGE,
    metadata: {
      namespace:   'fleet-default',
      annotations: { [FLEET_ANNOTATIONS.OCI_STORAGE_SECRET_GENERATED]: 'true' }
    }
  },
  {
    id:       'fleet-custom-workspace/secret-5',
    name:     'secret-5',
    _type:    SECRET_TYPES.FLEET_OCI_STORAGE,
    metadata: { namespace: 'fleet-custom-workspace' }
  },
  {
    id:       'fleet-custom-workspace/secret-6',
    name:     'secret-6',
    _type:    SECRET_TYPES.FLEET_OCI_STORAGE,
    metadata: { namespace: 'fleet-custom-workspace' }
  }
];

describe('component: FleetOCIStorageSecret', () => {
  describe('mode: create', () => {
    const mode = _CREATE;

    it('displays empty options', () => {
      const wrapper = mount(FleetOCIStorageSecret, {
        props: {
          workspace: 'fleet-local',
          secret:    '',
          mode,
        },
        data() {
          return { secrets: [], workspaces } as any;
        },
      });

      expect(wrapper.vm.options).toHaveLength(1);
      expect(wrapper.vm.options[0].label).toContain('none');
    });

    it('displays default and None options', () => {
      const wrapper = mount(FleetOCIStorageSecret, {
        props: {
          workspace: 'fleet-local',
          secret:    '',
          mode,
        },
        data() {
          return { secrets, workspaces } as any;
        },
      });

      expect(wrapper.vm.options).toHaveLength(2);
      expect(wrapper.vm.options[0].label).toContain('none');

      expect(wrapper.vm.options[1].label).toContain('secret-1');
      expect(wrapper.vm.options[1].label).toContain('default');
    });

    it('displays custom secrets options', () => {
      const wrapper = mount(FleetOCIStorageSecret, {
        props: {
          workspace: 'fleet-default',
          secret:    '',
          mode,
        },
        data() {
          return { secrets, workspaces } as any;
        },
      });

      expect(wrapper.vm.options).toHaveLength(3);
      expect(wrapper.vm.options[0].label).toContain('none');

      expect(wrapper.vm.options[1].label).toContain('chooseCustom');
      expect(wrapper.vm.options[2].label).toContain('secret-3');
      expect(wrapper.vm.options[2].label).not.toContain('default');
    });

    it('displays all options', () => {
      const wrapper = mount(FleetOCIStorageSecret, {
        props: {
          workspace: 'fleet-custom-workspace',
          secret:    '',
          mode,
        },
        data() {
          return { secrets, workspaces } as any;
        },
      });

      expect(wrapper.vm.options).toHaveLength(4);
      expect(wrapper.vm.options[0].label).toContain('none');

      expect(wrapper.vm.options[1].label).toContain('secret-6');
      expect(wrapper.vm.options[1].label).toContain('default');

      expect(wrapper.vm.options[2].label).toContain('chooseCustom');
      expect(wrapper.vm.options[3].label).toContain('secret-5');
    });

    it('select default if default secret exists', async() => {
      const wrapper = mount(FleetOCIStorageSecret, {
        props: {
          workspace: '',
          secret:    '',
          mode,
        },
        data() {
          return { secrets, workspaces } as any;
        },
      });

      wrapper.setProps({ workspace: 'fleet-local' });
      await flushPromises();

      expect(wrapper.emitted('update:value')?.[0][0]).toBe('secret-1');
    });

    it('select none if default secret not exists', async() => {
      const wrapper = mount(FleetOCIStorageSecret, {
        props: {
          workspace: '',
          secret:    '',
          mode,
        },
        data() {
          return { secrets, workspaces } as any;
        },
      });

      wrapper.setProps({ workspace: 'fleet-default' });
      await flushPromises();

      expect(wrapper.emitted('update:value')).toBeUndefined();
    });
  });

  describe('mode: edit', () => {
    const mode = _EDIT;

    it('displays selected secret', async() => {
      const wrapper = mount(FleetOCIStorageSecret, {
        props: {
          workspace: 'fleet-local',
          secret:    'test',
          mode,
        },
        data() {
          return { secrets, workspaces } as any;
        },
      });

      const secretSelector = wrapper.find('[data-testid="fleet-oci-storage-secret-list"]');

      expect(wrapper.vm.selected).toBe('test');
      expect(secretSelector.element.textContent).toContain('test');
    });
  });
});
