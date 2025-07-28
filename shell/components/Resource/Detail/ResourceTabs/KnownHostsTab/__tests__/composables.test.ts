import * as composables from '@shell/components/Resource/Detail/ResourceTabs/KnownHostsTab/composables';
import { SECRET_TYPES } from '@shell/config/secret';
import * as crypto from '@shell/utils/crypto';

jest.mock('@shell/utils/crypto');

describe('composables: KnownHostsTab/composables', () => {
  const base64DecodeSpy = jest.spyOn(crypto, 'base64Decode');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('useGetKnownHostsTabProps', () => {
    it('should return undefined if not the ssh type but supportsSshKnownHosts is true', () => {
      const resource = {
        supportsSshKnownHosts: true,
        _type:                 SECRET_TYPES.BASIC
      };

      const props = composables.useGetKnownHostsTabProps(resource);

      expect(props.value).toBeUndefined();
    });

    it('should return undefined if the ssh type but supportsSshKnownHosts is false', () => {
      const resource = {
        supportsSshKnownHosts: false,
        _type:                 SECRET_TYPES.SSH
      };

      const props = composables.useGetKnownHostsTabProps(resource);

      expect(props.value).toBeUndefined();
    });

    it('should return empty knownHosts if known_hosts is falsy', () => {
      const resource = {
        supportsSshKnownHosts: true,
        _type:                 SECRET_TYPES.SSH,
        data:                  {}
      };

      const props = composables.useGetKnownHostsTabProps(resource);

      expect(props.value?.knownHosts).toStrictEqual('');
    });

    it('should return base64decoded knownHosts if known_hosts has a value', () => {
      const knownHosts = 'KNOWN_HOSTS';
      const knowHostsDecoded = 'KNOWN_HOSTS_DECODED';
      const resource = {
        supportsSshKnownHosts: true,
        _type:                 SECRET_TYPES.SSH,
        data:                  { known_hosts: knownHosts }
      };

      base64DecodeSpy.mockReturnValue(knowHostsDecoded);

      const props = composables.useGetKnownHostsTabProps(resource);

      expect(props.value?.knownHosts).toStrictEqual(knowHostsDecoded);
      expect(base64DecodeSpy).toHaveBeenCalledWith(knownHosts);
    });
  });
});
