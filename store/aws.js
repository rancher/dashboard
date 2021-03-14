import { sortBy } from '@/utils/sort';
import { randomStr } from '@/utils/string';
import { parseSi } from '@/utils/units';
import { FetchHttpHandler } from '@aws-sdk/fetch-http-handler';

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

  async instanceInfo() {
    const data = (await import(/* webpackChunkName: "aws-data" */'@/assets/data/ec2instances.csv')).default;

    data.forEach((row) => {
      row.instanceClass = row['API Name'].split('.')[0].toLowerCase();
      row.memoryBytes = parseSi(row['Memory']);
    });

    return sortBy(data, ['instanceClass', 'memoryBytes', 'API Name']);
  },

  async defaultRegions() {
    const data = (await import(/* webpackChunkName: "aws-data" */'@/assets/data/aws-regions.json')).default;

    return data;
  }
};
