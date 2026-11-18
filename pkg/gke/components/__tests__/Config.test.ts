import { shallowMount } from '@vue/test-utils';
import flushPromises from 'flush-promises';

import Checkbox from '@components/Form/Checkbox/Checkbox.vue';
import LabeledSelect from '@shell/components/form/LabeledSelect.vue';
import RadioGroup from '@components/Form/Radio/RadioGroup.vue';
import Config from '@pkg/gke/components/Config.vue';

const mockedStore = (versionSetting: any) => {
  return {
    getters: {
      'i18n/t':                  (text: string) => text,
      t:                         (text: string) => text,
      currentStore:              () => 'current_store',
      'current_store/schemaFor': jest.fn(),
      'current_store/all':       jest.fn(),
      'management/byId':         () => {
        return versionSetting;
      },
      'management/schemaFor': jest.fn(),
      'rancher/create':       () => {}
    },
    dispatch: jest.fn()
  };
};

const mockedRoute = { query: {} };

const requiredSetup = (versionSetting = { value: '<=1.27.x' }) => {
  return {
    // mixins: [mockedValidationMixin],
    global: {
      mocks: {
        $store:      mockedStore(versionSetting),
        $route:      mockedRoute,
        $fetchState: {},
      }
    }
  };
};

jest.mock('@shell/components/google/util/gcp');
jest.mock('lodash/debounce', () => jest.fn((fn) => fn));

describe('gke Config', () => {
  it('should load versions and zones when projectid or cloudcredential id change', async() => {
    const setup = requiredSetup();

    const wrapper = shallowMount(Config, {
      props: {
        zone:              'test-zone',
        region:            'test-region',
        cloudCredentialId: '',
        projectId:         'test-project'
      },
      ...setup
    });
    const spy = jest.spyOn(wrapper.vm, 'debouncedLoadGCPData');

    wrapper.setProps({ cloudCredentialId: 'abc' });
    await flushPromises();
    wrapper.setProps({ projectId: '1234' });
    await flushPromises();

    expect(spy).toHaveBeenCalledTimes(2);
  });

  it.each([
    ['<=1.27.x', 13], ['<=1.29.x', 24]
  ])('should filter the version dropdown according to the supportedVersionRange setting', async(versionRange: string, numVersionsAvailable: number) => {
    const setup = requiredSetup({ value: versionRange });

    const wrapper = shallowMount(Config, {
      props: {
        zone:              'test-zone',
        region:            'test-region',
        cloudCredentialId: '',
        projectId:         'test-project'
      },
      ...setup
    });

    wrapper.setProps({ cloudCredentialId: 'abc' });
    await flushPromises();

    const versionDropdown = wrapper.getComponent<typeof LabeledSelect>('[data-testid="gke-version-select"]');

    expect(versionDropdown.props().options).toHaveLength(numVersionsAvailable);
  });

  it.each([
    ['test1-ranchername', 'test1', 'REGULAR', 7],
    ['test2-ranchername', 'test2', 'RAPID', 4]
  ])('should filter the list of available versions by the cluster\'s release channel', async(clusterName: string, gkeClusterName: string, expectedReleaseChannel: string, numVersionsAvailable: number) => {
    const setup = requiredSetup();

    const wrapper = shallowMount(Config, {
      props: {
        mode:              'edit',
        zone:              'test-zone',
        region:            'test-region',
        cloudCredentialId: 'abc',
        projectId:         'test-project',
        clusterName,
        gkeClusterName
      },
      ...setup
    });

    await flushPromises();
    await wrapper.vm.$nextTick();

    const versionDropdown = wrapper.getComponent<typeof LabeledSelect>('[data-testid="gke-version-select"]');

    expect((wrapper.vm as any).releaseChannel).toBe(expectedReleaseChannel);
    expect(versionDropdown.props().options).toHaveLength(numVersionsAvailable);
  });

  it.each([
    [{ zone: 'us-east1-c', region: '' }, false],
    [{ zone: '', region: 'us-east1' }, true]
  ])('should detect whether a zone or region is configured and flip the  location  mode radio button accordingly', async({ zone, region }, isUsingRegion) => {
    const setup = requiredSetup();

    const wrapper = shallowMount(Config, {
      props: {
        zone,
        region,
        cloudCredentialId: '',
        projectId:         'test-project'
      },
      ...setup
    });

    wrapper.setProps({ cloudCredentialId: 'abc' });
    await flushPromises();

    const locationModeRadio = wrapper.getComponent<typeof RadioGroup>('[data-testid="gke-location-mode-radio"]');

    expect(locationModeRadio.props().value).toBe(isUsingRegion);
  });

  it('should not show the extra zones inputs if currently importing a new gke cluster', async() => {
    const setup = requiredSetup();

    const wrapper = shallowMount(Config, {
      props: {
        zone:              'us-east1-b',
        region:            '',
        cloudCredentialId: '',
        projectId:         'test-project',
        isImport:          true
      },
      ...setup
    });

    wrapper.setProps({ cloudCredentialId: 'abc' });
    await flushPromises();

    const extraZonesContainer = wrapper.findComponent('[data-testid="gke-extra-zones-container"]');

    expect(extraZonesContainer.exists()).toBe(false);
  });

  // mock data has multiple zones for us-east1 and us-east4
  it.each([
    ['us-east1-b', ['us-east1-c', 'us-east1-f']],
    ['us-east4-b', ['us-east4-c']]
  ])('should populate extra zones with any zones in the same region as the selected zone', async(zone, extraZones) => {
    const setup = requiredSetup();

    const wrapper = shallowMount(Config, {
      props: {
        zone,
        region:            '',
        cloudCredentialId: '',
        projectId:         'test-project'
      },
      ...setup
    });

    wrapper.setProps({ cloudCredentialId: 'abc' });
    await flushPromises();
    extraZones.forEach((extraZoneOpt) => {
      const extraZonesCheckbox = wrapper.find(`[data-testid="gke-extra-zones-${ extraZoneOpt }"]`);

      expect(extraZonesCheckbox.exists()).toBe(true);
    });
  });

  it.each([
    ['us-east1', ['us-east1-b', 'us-east1-c', 'us-east1-f']],
    ['us-east4', ['us-east4-b', 'us-east4-c']]
  ])('should populate extra zones with all zones in the selected region', async(region, extraZones) => {
    const setup = requiredSetup();

    const wrapper = shallowMount(Config, {
      props: {
        zone:              '',
        region,
        cloudCredentialId: '',
        projectId:         'test-project'
      },
      ...setup
    });

    wrapper.setProps({ cloudCredentialId: 'abc' });
    await flushPromises();
    extraZones.forEach((extraZoneOpt) => {
      const extraZonesCheckbox = wrapper.find(`[data-testid="gke-extra-zones-${ extraZoneOpt }"]`);

      expect(extraZonesCheckbox.exists()).toBe(true);
    });
  });

  it.each([
    [['us-east1-b', 'us-east1-c', 'us-east1-f']],
    [['us-east1-b', 'us-east1-c']],
    [[]]
  ])('should populate extra zones with any zones already configured in locations', async(locations: string[]) => {
    const setup = requiredSetup();

    const wrapper = shallowMount(Config, {
      props: {
        zone:              '',
        region:            'us-east1',
        cloudCredentialId: '',
        projectId:         'test-project',
        locations
      },
      ...setup
    });

    wrapper.setProps({ cloudCredentialId: 'abc' });
    await flushPromises();

    // verify that each location has a checkbox and it is checked
    locations.forEach((location) => {
      const extraZonesCheckbox = wrapper.findComponent<typeof Checkbox>(`[data-testid="gke-extra-zones-${ location }"]`);

      expect(extraZonesCheckbox.exists()).toBe(true);
      expect(extraZonesCheckbox.props().value).toBe(true);
    });

    const allExtraZoneCheckboxes = wrapper.findAllComponents(Checkbox);

    // verify that there are no checked zone checkboxes NOT in locations
    const checkedNotInLocations = allExtraZoneCheckboxes.filter((zoneCheckbox) => {
      // `label` is optional on Checkbox; an unlabelled checkbox can never be one of `locations`
      return !!zoneCheckbox.props().value && !locations.includes(zoneCheckbox.props().label as string);
    });

    expect(Object.keys(checkedNotInLocations)).toHaveLength(0);
  });

  it('should add newly selected zone to the list of extra zones (gkeConfig.locations) and remove old extra zones', async() => {
    const setup = requiredSetup();

    const wrapper = shallowMount(Config, {
      props: {
        zone:              'us-east1-b',
        region:            '',
        cloudCredentialId: '',
        projectId:         'test-project',
        locations:         ['us-east1-a']
      },
      ...setup
    });

    wrapper.setProps({ cloudCredentialId: 'abc' });
    await flushPromises();

    const zoneSelect = wrapper.getComponent<typeof LabeledSelect>('[data-testid="gke-zone-select"]');

    zoneSelect.vm.$emit('selecting', { name: 'us-east4-b' });

    await flushPromises();
    expect(wrapper.emitted('update:locations')?.[0]?.[0]).toStrictEqual(['us-east4-b']);
  });

  it.each([
    ['creating a zonal cluster', {
      mode: 'create', zone: 'us-east1-b', region: '', isNewOrUnprovisioned: true
    }, false],
    ['creating a regional cluster', {
      mode: 'create', zone: '', region: 'us-east1', isNewOrUnprovisioned: true
    }, false],
    ['editing a zonal cluster', {
      mode: 'edit', zone: 'us-east1-b', region: '', isNewOrUnprovisioned: false
    }, false],
    ['editing a regional cluster', {
      mode: 'edit', zone: '', region: 'us-east1', isNewOrUnprovisioned: false
    }, true],
  ])('should only allow the extra zones checkboxes to be edited for zonal clusters - %s', async(_description, props, expectedDisabled) => {
    const setup = requiredSetup();

    const wrapper = shallowMount(Config, {
      props: {
        cloudCredentialId: '',
        projectId:         'test-project',
        ...props
      },
      ...setup
    });

    wrapper.setProps({ cloudCredentialId: 'abc' });
    await flushPromises();

    const extraZoneCheckboxes = wrapper.findAllComponents(Checkbox);

    expect(extraZoneCheckboxes.length).toBeGreaterThan(0);
    extraZoneCheckboxes.forEach((checkbox) => {
      expect(checkbox.props().disabled).toBe(expectedDisabled);
    });
  });

  it.each([
    ['creating a regional cluster', {
      mode: 'create', zone: '', region: 'us-east1', isNewOrUnprovisioned: true
    }, null],
    ['editing a zonal cluster', {
      mode: 'edit', zone: 'us-east1-b', region: '', isNewOrUnprovisioned: false
    }, null],
    ['viewing a regional cluster', {
      mode: 'view', zone: '', region: 'us-east1', isNewOrUnprovisioned: false
    }, null],
    ['editing a regional cluster', {
      mode: 'edit', zone: '', region: 'us-east1', isNewOrUnprovisioned: false
    }, 'gke.location.extraZonesDisabledTooltip'],
  ])('should only show the extra zones disabled tooltip when editing a regional cluster - %s', async(_description, props, expectedTooltip) => {
    const setup = requiredSetup();

    const wrapper = shallowMount(Config, {
      props: {
        cloudCredentialId: '',
        projectId:         'test-project',
        ...props
      },
      ...setup
    });

    wrapper.setProps({ cloudCredentialId: 'abc' });
    await flushPromises();

    expect((wrapper.vm as any).extraZonesDisabledTooltip).toBe(expectedTooltip);
  });
});
