import { FetchHttpHandler } from '@aws-sdk/fetch-http-handler';
import { sortBy } from '@/utils/sort';
import { randomStr } from '@/utils/string';
import { parseSi } from '@/utils/units';

export const state = () => {
  return {};
};

class Handler {
  constructor(cloudCredentialId) {
    this.cloudCredentialId = (cloudCredentialId || '');
  }

  handle(httpRequest, ...args) {
    httpRequest.headers['x-api-headers-restrict'] = 'Content-Length';

    if ( this.cloudCredentialId ) {
      httpRequest.headers['x-api-cattleauth-header'] = `awsv4 credID=${ this.cloudCredentialId }`;
    } else {
      httpRequest.headers['x-api-auth-header'] = httpRequest.headers['authorization'];
    }

    delete httpRequest.headers['authorization'];

    httpRequest.headers['content-type'] = `rancher:${ httpRequest.headers['content-type'] }`;

    const endpoint = `/meta/proxy/`;

    if ( !httpRequest.path.startsWith(endpoint) ) {
      httpRequest.path = endpoint + httpRequest.hostname + httpRequest.path;
    }

    httpRequest.protocol = window.location.protocol;
    httpRequest.hostname = window.location.hostname;
    httpRequest.port = window.location.port;

    return FetchHttpHandler.prototype.handle.call(this, httpRequest, ...args);
  }
}

function credentialDefaultProvider(accessKey, secretKey) {
  return function() {
    // The SDK will complain if these aren't set, so fill them with something
    // even though the cloudCredential will be used eventually
    const out = {
      accessKeyId:         accessKey || randomStr(),
      secretAccessKey:     secretKey || randomStr(),
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
    return import(/* webpackChunkName: "aws-ec2" */ '@aws-sdk/client-kms');
  },

  async ec2({ dispatch }, {
    region, cloudCredentialId, accessKey, secretKey
  }) {
    const lib = await dispatch('ec2Lib');

    const client = new lib.EC2({
      region,
      credentialDefaultProvider: credentialDefaultProvider(accessKey, secretKey),
      requestHandler:            new Handler(cloudCredentialId),
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
    });

    return client;
  },

  async instanceInfo({ rootGetters }) {
    const data = (await import(/* webpackChunkName: "aws-data" */'@/assets/data/ec2instances.csv')).default;
    const groups = (await import(/* webpackChunkName: "aws-data" */'@/assets/data/ec2-instance-groups.json')).default;
    const out = [];

    for ( const row of data ) {
      const apiName = row['API Name'];
      const instanceClass = apiName.split('.')[0].toLowerCase();
      const groupLabel = groups[instanceClass] || 'Unknown';
      const instanceStorage = row['Instance Storage'];

      let storageSize = 0;
      let storageType = null;

      if ( instanceStorage !== 'EBS Only' ) {
        const match = instanceStorage.match(/^(\d+)\s*GiB.*(NVMe|SSD|HDD).*/);

        if ( match ) {
          storageSize = parseInt(match[1], 10);
          storageType = match[2] || '';
        }
      }

      out.push({
        apiName,
        groupLabel,
        instanceClass,
        memoryBytes:   parseSi(row['Memory']),
        label:         rootGetters['i18n/t']('cluster.machineConfig.aws.sizeLabel', {
          apiName,
          cpu:          row['vCPUs'],
          memory:       parseInt(row['Memory'], 10),
          storageSize,
          storageType,
        }),
      });
    }

    return sortBy(out, ['groupLabel', 'instanceClass', 'memoryBytes', 'apiName']);
  },

  async defaultRegions() {
    const data = (await import(/* webpackChunkName: "aws-data" */'@/assets/data/aws-regions.json')).default;

    return data;
  }
};
