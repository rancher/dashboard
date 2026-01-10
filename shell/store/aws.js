import { sortBy } from '@shell/utils/sort';
import { randomStr } from '@shell/utils/string';
import { FetchHttpHandler } from '@smithy/fetch-http-handler';
import { isArray, addObjects } from '@shell/utils/array';
import { formatAWSError } from '@shell/utils/error';

export const state = () => {
  return {
    instanceTypes: [],
    clientInfo:    null
  };
};

class Handler {
  constructor(cloudCredentialId, options) {
    this.cloudCredentialId = (cloudCredentialId || '');
    this.fetchHandler = new FetchHttpHandler(options);
  }

  async handle(httpRequest, options = {}) {
    if (!httpRequest?.headers) {
      httpRequest.headers = {};
    }

    httpRequest.headers['x-api-headers-restrict'] = 'Content-Length';

    if (this.cloudCredentialId) {
      httpRequest.headers['x-api-cattleauth-header'] = `awsv4 credID=${ this.cloudCredentialId }`;
    } else if (httpRequest?.headers['authorization']) {
      httpRequest.headers['x-api-auth-header'] = httpRequest.headers['authorization'];
    }

    delete httpRequest.headers['authorization'];

    const originalContentType = httpRequest.headers['content-type'] ?? '';

    httpRequest.headers['content-type'] = originalContentType ? `rancher:${ originalContentType }` : 'rancher:';

    const endpoint = `/meta/proxy/`;

    if (!httpRequest.path.startsWith(endpoint)) {
      httpRequest.path = endpoint + httpRequest.hostname + httpRequest.path;
    }

    httpRequest.protocol = window.location.protocol;
    httpRequest.hostname = window.location.hostname;
    httpRequest.port = window.location.port;

    return this.fetchHandler.handle(httpRequest, options);
  }
}

function credentialDefaultProvider(accessKey, secretKey) {
  return function() {
    // The SDK will complain if these aren't set, so fill them with something
    // even though the cloudCredential will be used eventually
    const out = {
      accessKeyId:     accessKey || randomStr(),
      secretAccessKey: secretKey || randomStr(),
    };

    return out;
  };
}

export const getters = {
  // You could override these to do something based on the user, maybe.
  defaultRegion() {
    return 'us-west-2';
  },

  defaultInstanceType() {
    return 't3a.medium';
  },

  instanceTypes(state) {
    return state.instanceTypes;
  },

  clientInfo(state) {
    return state.clientInfo;
  }
};

export const mutations = {
  setInstanceTypes(state, { types, clientInfo }) {
    state.instanceTypes = types;
    state.clientInfo = clientInfo;
  }
};

export const actions = {
  ec2Lib() {
    return import(/* webpackChunkName: "aws-ec2" */ '@aws-sdk/client-ec2');
  },

  eksLib() {
    return import(/* webpackChunkName: "aws-eks" */ '@aws-sdk/client-eks');
  },

  kmsLib() {
    return import(/* webpackChunkName: "aws-kms" */ '@aws-sdk/client-kms');
  },

  iamLib() {
    return import(/* webpackChunkName: "aws-iam" */ '@aws-sdk/client-iam');
  },

  async ec2({ dispatch }, {
    region, cloudCredentialId, accessKey, secretKey
  }) {
    const lib = await dispatch('ec2Lib');

    const client = new lib.EC2({
      region,
      credentialDefaultProvider: credentialDefaultProvider(accessKey, secretKey),
      requestHandler:            new Handler(cloudCredentialId),
      useDualstackEndpoint:      true,
    });

    return client;
  },

  async eks({ dispatch }, {
    region, cloudCredentialId, accessKey, secretKey
  }) {
    const lib = await dispatch('eksLib');

    const client = new lib.EKS({
      region,
      credentialDefaultProvider: credentialDefaultProvider(accessKey, secretKey),
      requestHandler:            new Handler(cloudCredentialId),
      useDualstackEndpoint:      true,
    });

    return client;
  },

  async kms({ dispatch }, {
    region, cloudCredentialId, accessKey, secretKey
  }) {
    const lib = await dispatch('kmsLib');

    const client = new lib.KMS({
      region,
      credentialDefaultProvider: credentialDefaultProvider(accessKey, secretKey),
      requestHandler:            new Handler(cloudCredentialId),
      useDualstackEndpoint:      true,
    });

    return client;
  },

  async iam({ dispatch }, {
    region, cloudCredentialId, accessKey, secretKey
  }) {
    const lib = await dispatch('iamLib');

    const client = new lib.IAM({
      region,
      credentialDefaultProvider: credentialDefaultProvider(accessKey, secretKey),
      requestHandler:            new Handler(cloudCredentialId),
      useDualstackEndpoint:      true,
    });

    return client;
  },

  async describeInstanceTypes({
    dispatch, rootGetters, state, commit
  }, { client }) {
    const cloudCredentialId = client?.config?.requestHandler?.cloudCredentialId;
    const region = await client.config.region();

    if (cloudCredentialId === rootGetters['aws/clientInfo']?.cloudCredentialId && region === rootGetters['aws/clientInfo']?.region) {
      return rootGetters['aws/instanceTypes'];
    }
    const data = await dispatch('depaginateList', { client, cmd: 'describeInstanceTypes' });

    const groups = (await import(/* webpackChunkName: "aws-data" */'@shell/assets/data/ec2-instance-groups.json')).default;
    const list = [];

    for ( const row of data ) {
      const apiName = row.InstanceType;
      const instanceClass = apiName.split('.')[0].toLowerCase();
      const groupLabel = groups[instanceClass] || 'Unknown';

      let storageSize = 0;
      let storageUnit = 'GB';
      let storageType = null;
      const storageInfo = row.InstanceStorageInfo;

      if ( storageInfo) {
        storageSize = storageInfo.TotalSizeInGB;
        const disk = storageInfo.Disks?.[0];

        if ( storageInfo.NvmeSupport === 'supported' ) {
          storageType = 'NVMe';
        } else if ( disk?.Type === 'ssd' ) {
          storageType = 'SSD';
        } else if ( disk?.Type === 'hdd' ) {
          storageType = 'HDD';
        } else {
          storageType = 'Unknown';
        }

        if ( storageSize > 1000 ) {
          storageSize /= 1000;
          storageUnit = 'TB';
        }
      } else {
        // storageSize == 0 shows EBS-Only
      }

      list.push({
        apiName,
        currentGeneration:      row.CurrentGeneration || false,
        groupLabel,
        instanceClass,
        memoryBytes:            row.MemoryInfo.SizeInMiB * 1024 * 1024,
        supportedUsageClasses:  row.SupportedUsageClasses,
        supportedArchitectures: row.ProcessorInfo.SupportedArchitectures || [],
        label:                  rootGetters['i18n/t']('cluster.machineConfig.aws.sizeLabel', {
          apiName,
          cpu:          row.VCpuInfo.DefaultVCpus,
          memory:       row.MemoryInfo.SizeInMiB / 1024,
          storageSize,
          storageUnit,
          storageType,
          architecture: (row.ProcessorInfo.SupportedArchitectures || []).map((a) => (a === 'arm64' ? 'ARM' : a)).join(', ')
        }),
      });
    }

    const out = sortBy(list, ['currentGeneration:desc', 'groupLabel', 'instanceClass', 'memoryBytes', 'apiName']);

    commit('setInstanceTypes', { types: out, clientInfo: { region, cloudCredentialId } });

    return out;
  },

  async depaginateList(ctx, {
    client, cmd, key, opt
  }) {
    let hasNext = true;
    const out = [];

    opt = opt || {};

    while ( hasNext ) {
      try {
        const res = await client[cmd](opt);

        if ( !key ) {
          key = Object.keys(res).find((x) => isArray(res[x]));
        }

        addObjects(out, res[key]);
        if (res.NextToken) {
          opt.NextToken = res.NextToken;
          hasNext = true;
        } else if (res.Marker) {
          opt.Marker = res.Marker;
          hasNext = true;
        } else {
          hasNext = false;
        }
      } catch (err) {
        hasNext = false;
        throw formatAWSError(err);
      }
    }

    return out;
  },

  async defaultRegions() {
    const data = (await import(/* webpackChunkName: "aws-data" */'@shell/assets/data/aws-regions.json')).default;

    return data;
  }
};
