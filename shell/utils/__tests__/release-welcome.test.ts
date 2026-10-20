import { setVersionData } from '@shell/config/version';
import { READ_WHATS_NEW } from '@shell/store/prefs';
import { openReleaseWelcome, releaseWelcomeVersion, shouldShowReleaseWelcome, showReleaseWelcomeIfNew } from '@shell/utils/release-welcome';

jest.mock('@shell/dialog/ReleaseWelcomeDialog.vue', () => ({ __esModule: true, default: { name: 'ReleaseWelcomeDialog' } }));

const setVersion = (version: string) => setVersionData({
  Version: version, RancherPrime: 'false', GitCommit: ''
});

const createGetters = (lastRead: string, isSingleProduct: any = undefined): any => ({
  isSingleProduct,
  'prefs/get': (key: string) => (key === READ_WHATS_NEW ? lastRead : undefined),
});

describe('utils: release-welcome', () => {
  afterEach(() => {
    setVersion('');
    jest.restoreAllMocks();
  });

  describe('releaseWelcomeVersion', () => {
    it.each([
      ['v2.16.0', '2.16'],
      ['v2.16.3', '2.16'],
      ['2.16.0-rc1', '2.16'],
      ['v2.16.0-abc1234-head', '2.16'],
      ['v3.0.0', '3.0'],
    ])('should return the minor version of %p', (version, expected) => {
      setVersion(version);

      expect(releaseWelcomeVersion()).toStrictEqual(expected);
    });

    it.each([
      ['dev'],
      [''],
      ['master-head'],
      ['9bf6631da'],
      ['abc1234'],
    ])('should return undefined for the unparsable version %p', (version) => {
      setVersion(version);

      expect(releaseWelcomeVersion()).toBeUndefined();
    });
  });

  describe('shouldShowReleaseWelcome', () => {
    it.each([
      ['never read', 'v2.16.0', '', true],
      ['read for an older minor', 'v2.16.0', 'v2.15.0', true],
      ['read for an older minor, on another patch', 'v2.16.2', 'v2.15.2', true],
      ['read for an older minor, below 10', 'v2.10.0', 'v2.9.3', true],
      ['read for this minor', 'v2.16.0', 'v2.16.0', false],
      ['read for this minor, after a patch upgrade', 'v2.16.1', 'v2.16.0', false],
      ['read for this minor, on a head build', 'v2.16.0-abc1234-head', 'v2.16.0', false],
      ['read for a newer minor', 'v2.16.0', 'v2.17.0', false],
      ['read as 2.x.x', 'v2.16.0', '2.x.x', false],
    ])('should handle release notes %s', (_, version, lastRead, expected) => {
      setVersion(version);

      expect(shouldShowReleaseWelcome(createGetters(lastRead))).toStrictEqual(expected);
    });

    it('should not show the modal when the version cannot be parsed', () => {
      setVersion('dev');

      expect(shouldShowReleaseWelcome(createGetters(''))).toStrictEqual(false);
    });

    it('should not show the modal in single product mode', () => {
      setVersion('v2.16.0');

      expect(shouldShowReleaseWelcome(createGetters('', { productNameKey: 'harvester' }))).toStrictEqual(false);
    });
  });

  describe('openReleaseWelcome', () => {
    it('should open the welcome dialog', async() => {
      setVersion('v2.16.0');
      const commit = jest.fn();

      await openReleaseWelcome(commit);

      expect(commit).toHaveBeenCalledWith('modal/openModal', { component: { name: 'ReleaseWelcomeDialog' } });
    });

    it('should open the welcome dialog when the version cannot be parsed', async() => {
      setVersion('dev');
      const commit = jest.fn();

      await openReleaseWelcome(commit);

      expect(commit).toHaveBeenCalledWith('modal/openModal', { component: { name: 'ReleaseWelcomeDialog' } });
    });
  });

  describe('showReleaseWelcomeIfNew', () => {
    it('should open the modal when the release notes were read for an older minor version', async() => {
      setVersion('v2.16.0');
      const commit = jest.fn();

      await showReleaseWelcomeIfNew(commit, createGetters('v2.15.3'));

      expect(commit).toHaveBeenCalledTimes(1);
    });

    it('should not open the modal when the release notes were read for this minor version', async() => {
      setVersion('v2.16.0');
      const commit = jest.fn();

      await showReleaseWelcomeIfNew(commit, createGetters('v2.16.0'));

      expect(commit).toHaveBeenCalledTimes(0);
    });

    it('should not open the modal again after a patch upgrade', async() => {
      setVersion('v2.16.2');
      const commit = jest.fn();

      await showReleaseWelcomeIfNew(commit, createGetters('v2.16.1'));

      expect(commit).toHaveBeenCalledTimes(0);
    });
  });
});
