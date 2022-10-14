import { addObjects } from '@shell/utils/array';

const PAGE_SIZE = 50;
const DEFAULT_GROUP = 'docker-machine';

function toLowerCaseInitial(name) {
  return name.charAt(0).toLowerCase() + name.slice(1);
}

function getQueryParamsString(params, deep = false) {
  const keys = Object.keys(params).sort((a, b) => {
    return a < b ? -1 : 1;
  });

  return keys.map((key) => {
    if (params[key] === undefined) {
      return '';
    }

    return `${ key }${ deep ? encodeURIComponent('=') : '=' }${ encodeURIComponent(params[key]) }`;
  }).join(deep ? encodeURIComponent('&') : '&');
}

function getAvailableResources(res) {
  const results = [];
  const zones = res['AvailableZones'];

  if (!zones) {
    return results;
  }

  zones.AvailableZone.forEach((zone) => {
    zone['AvailableResources']['AvailableResource'].forEach((resource) => {
      resource['SupportedResources']['SupportedResource'].forEach((support) => {
        if ( support.Status === 'Available' && !results.includes(support.Value) ) {
          results.push(support.Value);
        }
      });
    });
  });

  return results;
}

export const state = function() {
  return { instanceTypes: null };
};

export const getters = {
  // You could override these to do something based on the user, maybe.
  defaultValue() {
    return {
      resourceGroupId:    '',
      zone:               undefined,
      vpcId:              null,
      vswitchId:          null,
      instanceType:       null,
      imageId:            null,
      systemDiskCategory: null,
      diskCategory:       null,
      internetChargeType: 'PayByTraffic',
      diskFs:             'ext4',
      securityGroup:      DEFAULT_GROUP,
      instanceChargeType: 'PostPaid',
      spotStrategy:       'NoSpot',
      spotDuration:       true,
      systemDiskSize:     {
        Max: 500,
        Min: 20,
      },
      dataDiskSize:       {
        Max: 32768,
        Min: 20,
      },
      openPort:               [
        '6443/tcp',
        '2379/tcp',
        '2380/tcp',
        '8472/udp',
        '4789/udp',
        '9796/tcp',
        '10256/tcp',
        '10250/tcp',
        '10251/tcp',
        '10252/tcp',
      ],
    };
  },

  defaultRegion() {
    return 'cn-hangzhou';
  }
};

export const mutations = {
  gotInstanceTypes(state, instanceTypes) {
    state.instanceTypes = instanceTypes;
  },
};

export const actions = {
  async fetchALY({ dispatch, rootGetters }, {
    resource, plural, params = {}, page = 1,
  }) {
    let results = [];

    if (!params?.cloudCredentialId) {
      return results;
    }

    let resourceName = '';

    if (resource) {
      resourceName = toLowerCaseInitial(resource);
    } else {
      resourceName = toLowerCaseInitial(plural);
    }
    if (resourceName === 'vSwitch') {
      resourceName = 'vswitch';
    }

    let acceptLanguage = 'zh-CN';

    if (rootGetters['i18n/current']() === 'en-us') {
      acceptLanguage = 'en-US';
    }

    const url = `/meta/ack/${ resourceName }`;
    const query = Object.assign({}, params, {
      acceptLanguage,
      pageSize:   PAGE_SIZE,
      pageNumber: page
    });

    const req = {
      url:     `${ url }?${ getQueryParamsString(query) }`,
      method:  'GET',
    };

    const res = await dispatch('rancher/request', req, { root: true });

    if (resource === '') {
      return res;
    }

    results = res[`${ plural }`][resource];

    if (res.TotalCount > ((PAGE_SIZE * (page - 1)) + results.length)) {
      params.page = page + 1;
      const data = await dispatch('fetchALY', {
        resource,
        plural,
        params,
        page: page + 1,
      });

      addObjects(results, data);
    }

    return results;
  },

  async fetchAvailableResource({ dispatch, rootGetters, state }, params) {
    const data = await dispatch('fetchALY', params);

    return getAvailableResources(data);
  },
  async regions({ dispatch }, params) {
    return await dispatch('fetchALY', {
      resource: 'Region',
      plural:   'Regions',
      params,
    });
  },
  async resourceGroups({ dispatch }, params) {
    const data = await dispatch('fetchALY', {
      resource: 'ResourceGroup',
      plural:   'ResourceGroups',
      params,
    });

    return data;
  },
  async zones({ dispatch }, params) {
    const data = await dispatch('fetchALY', {
      resource:       'Zone',
      plural:         'Zones',
      params,
    });

    return data;
  },
  async vpcs({ dispatch }, params) {
    const data = await dispatch('fetchALY', {
      resource:       'Vpc',
      plural:         'Vpcs',
      params,
    });

    return data;
  },
  async vSwitches({ dispatch }, params) {
    const data = await dispatch('fetchALY', {
      resource:       'VSwitch',
      plural:         'VSwitches',
      params,
    });

    return data;
  },
  async securityGroups({ dispatch }, params) {
    const data = await dispatch('fetchALY', {
      resource:       'SecurityGroup',
      plural:         'SecurityGroups',
      params,
    });

    return data;
  },

  async instanceTypes({ dispatch, state, commit }, params) {
    const data = await dispatch('fetchALY', {
      resource:       'InstanceType',
      plural:         'InstanceTypes',
      params,
    });

    commit('gotInstanceTypes', data);

    return data;
  },
  async availableInstanceTypes({ dispatch, state }, params) {
    const data = await dispatch('fetchAvailableResource', {
      resource: '',
      plural:   'AvailableResource',
      params,
    });

    return data;
  },
  async images({ dispatch }, params) {
    const data = await dispatch('fetchALY', {
      resource:       'Image',
      plural:         'Images',
      params,
    });

    return data.filter(obj => obj.OSType === 'linux');
  },
  async systemDiskCategories({ dispatch }, params) {
    const data = await dispatch('fetchAvailableResource', {
      resource:       '',
      plural:         'AvailableResource',
      params,
    });

    return data;
  },
  async dataDiskCategories({ dispatch }, params) {
    const data = await dispatch('fetchAvailableResource', {
      resource:       '',
      plural:         'AvailableResource',
      params,
    });

    return data;
  },
};
