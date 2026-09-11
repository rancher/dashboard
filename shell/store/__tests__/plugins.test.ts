import {
  simplify,
  configureCredential,
  mapDriver,
  rke1Supports,
  likelyFields,
  iffyFields,
  fullFields,
  prefixFields,
  suffixFields,
  getters,
  actions,
} from '@shell/store/plugins';

describe('plugins store', () => {
  describe('simplify', () => {
    it.each([
      {
        desc:     'lowercases a string',
        input:    'AccessKey',
        expected: 'accesskey',
      },
      {
        desc:     'removes non-alphanumeric characters',
        input:    'client-secret',
        expected: 'clientsecret',
      },
      {
        desc:     'removes underscores',
        input:    'access_key_id',
        expected: 'accesskeyid',
      },
      {
        desc:     'handles empty string',
        input:    '',
        expected: '',
      },
      {
        desc:     'handles already simplified string',
        input:    'accesskey',
        expected: 'accesskey',
      },
      {
        desc:     'removes spaces',
        input:    'my key',
        expected: 'mykey',
      },
    ])('$desc', ({ input, expected }) => {
      expect(simplify(input)).toStrictEqual(expected);
    });
  });

  describe('rke1Supports', () => {
    it('contains expected cloud providers', () => {
      expect(rke1Supports).toStrictEqual([
        'aws',
        'azure',
        'digitalocean',
        'gcp',
        'harvester',
        'linode',
        'oracle',
        'pnap',
        'vmwarevsphere',
      ]);
    });
  });

  describe('exported field lists', () => {
    it('likelyFields are simplified and contain expected values', () => {
      expect(likelyFields).toContain('username');
      expect(likelyFields).toContain('password');
      expect(likelyFields).toContain('accesskey');
      expect(likelyFields).toContain('token');
      expect(likelyFields).toContain('secret');
      expect(likelyFields).toContain('clientid');
      expect(likelyFields).toContain('clientsecret');
    });

    it('iffyFields are simplified and contain expected values', () => {
      expect(iffyFields).toContain('location');
      expect(iffyFields).toContain('region');
    });

    it('fullFields are simplified', () => {
      expect(fullFields).toContain('username');
      expect(fullFields).toContain('accesskey');
      expect(fullFields).toContain('clientid');
    });

    it('prefixFields are simplified', () => {
      expect(prefixFields).toContain('token');
      expect(prefixFields).toContain('apikey');
      expect(prefixFields).toContain('secret');
    });

    it('suffixFields is empty array', () => {
      expect(suffixFields).toStrictEqual([]);
    });
  });

  describe('configureCredential', () => {
    it('registers new credential options accessible via credentialOptions getter', () => {
      const name = 'testprovider';
      const opt = {
        publicKey:  'apiKey',
        publicMode: 'full',
        keys:       ['apiKey'],
      };

      configureCredential(name, opt);

      const credOptions = getters.credentialOptions()('testprovider');

      expect(credOptions).toStrictEqual(opt);
    });

    it('lowercases the name lookup in credentialOptions getter', () => {
      configureCredential('myprovider', {
        publicKey: 'key', publicMode: 'full', keys: ['key']
      });

      const credOptions = getters.credentialOptions()('MyProvider');

      expect(credOptions.publicKey).toStrictEqual('key');
    });
  });

  describe('mapDriver', () => {
    it('maps a driver name to a credential name accessible via credentialDriverFor getter', () => {
      mapDriver('customdriver', 'aws');

      const credDriver = getters.credentialDriverFor()('customdriver');

      expect(credDriver).toStrictEqual('aws');
    });

    it('lowercases the name lookup', () => {
      mapDriver('newdriver', 'azure');

      const credDriver = getters.credentialDriverFor()('NewDriver');

      expect(credDriver).toStrictEqual('azure');
    });
  });

  describe('getters', () => {
    describe('credentialOptions', () => {
      it('returns aws credential options', () => {
        const result = getters.credentialOptions()('aws');

        expect(result.publicKey).toStrictEqual('accessKey');
        expect(result.publicMode).toStrictEqual('full');
      });

      it('returns digitalocean credential options', () => {
        const result = getters.credentialOptions()('digitalocean');

        expect(result.publicKey).toStrictEqual('accessToken');
        expect(result.publicMode).toStrictEqual('prefix');
      });

      it('returns empty object for unknown driver', () => {
        const result = getters.credentialOptions()('unknowndriver_xyz');

        expect(result).toStrictEqual({});
      });

      it('is case-insensitive', () => {
        const result = getters.credentialOptions()('AWS');

        expect(result.publicKey).toStrictEqual('accessKey');
      });

      it('handles undefined name', () => {
        const result = getters.credentialOptions()(undefined);

        expect(result).toStrictEqual({});
      });
    });

    describe('credentialDriverFor', () => {
      it('maps amazonec2 to aws', () => {
        const result = getters.credentialDriverFor()('amazonec2');

        expect(result).toStrictEqual('aws');
      });

      it('maps amazoneks to aws', () => {
        const result = getters.credentialDriverFor()('amazoneks');

        expect(result).toStrictEqual('aws');
      });

      it('maps google to gcp', () => {
        const result = getters.credentialDriverFor()('google');

        expect(result).toStrictEqual('gcp');
      });

      it('returns the name unchanged for unknown drivers', () => {
        const result = getters.credentialDriverFor()('somedriverxyz');

        expect(result).toStrictEqual('somedriverxyz');
      });

      it('is case-insensitive', () => {
        const result = getters.credentialDriverFor()('AmazonEC2');

        expect(result).toStrictEqual('aws');
      });

      it('handles undefined name', () => {
        const result = getters.credentialDriverFor()(undefined);

        expect(result).toStrictEqual('');
      });
    });

    describe('credentialFieldForDriver', () => {
      it('maps aws to amazonec2', () => {
        const result = getters.credentialFieldForDriver()('aws');

        expect(result).toStrictEqual('amazonec2');
      });

      it('maps gcp to google', () => {
        const result = getters.credentialFieldForDriver()('gcp');

        expect(result).toStrictEqual('google');
      });

      it('maps oracle to oci', () => {
        const result = getters.credentialFieldForDriver()('oracle');

        expect(result).toStrictEqual('oci');
      });

      it('returns the name unchanged for unknown drivers', () => {
        const result = getters.credentialFieldForDriver()('unknown');

        expect(result).toStrictEqual('unknown');
      });

      it('is case-insensitive', () => {
        const result = getters.credentialFieldForDriver()('AWS');

        expect(result).toStrictEqual('amazonec2');
      });

      it('handles undefined', () => {
        const result = getters.credentialFieldForDriver()(undefined);

        expect(result).toStrictEqual('');
      });
    });

    describe('clusterDrivers', () => {
      it('returns empty array', () => {
        const result = getters.clusterDrivers();

        expect(result).toStrictEqual([]);
      });
    });

    describe('cloudProviderForDriver', () => {
      it('returns aws for amazonec2', () => {
        const result = getters.cloudProviderForDriver()('amazonec2');

        expect(result).toStrictEqual('aws');
      });

      it('returns azure for azure', () => {
        const result = getters.cloudProviderForDriver()('azure');

        expect(result).toStrictEqual('azure');
      });

      it('returns undefined for custom', () => {
        const result = getters.cloudProviderForDriver()('custom');

        expect(result).toBeUndefined();
      });

      it('returns empty string for digitalocean (restricted options)', () => {
        const result = getters.cloudProviderForDriver()('digitalocean');

        expect(result).toStrictEqual('');
      });

      it('returns undefined for unknown drivers', () => {
        const result = getters.cloudProviderForDriver()('unknown_xyz');

        expect(result).toBeUndefined();
      });
    });

    describe('schemaForDriver', () => {
      it('calls rootGetters management/schemaFor with composed id', () => {
        const mockSchema = { id: 'rke-machine-config.cattle.io.driverconfig' };
        const mockSchemaFor = jest.fn(() => mockSchema);
        const rootGetters = { 'management/schemaFor': mockSchemaFor };

        const result = getters.schemaForDriver(undefined, undefined, undefined, rootGetters)('driver');

        expect(mockSchemaFor).toHaveBeenCalledWith('rke-machine-config.cattle.io.driverconfig');
        expect(result).toStrictEqual(mockSchema);
      });

      it('returns undefined when schema not found', () => {
        const mockSchemaFor = jest.fn(() => undefined);
        const rootGetters = { 'management/schemaFor': mockSchemaFor };

        const result = getters.schemaForDriver(undefined, undefined, undefined, rootGetters)('nonexistent');

        expect(result).toBeUndefined();
      });
    });
  });

  describe('actions', () => {
    describe('mapDriver', () => {
      it('calls mapDriver util with name and to', () => {
        const ctx = {};

        actions.mapDriver(ctx, { name: 'testaction', to: 'azure' });

        const result = getters.credentialDriverFor()('testaction');

        expect(result).toStrictEqual('azure');
      });
    });
  });
});
