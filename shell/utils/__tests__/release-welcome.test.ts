import { setVersionData } from '@shell/config/version';
import { SEEN_WHATS_NEW } from '@shell/store/prefs';
import {
  openReleaseWelcome, releaseWelcomeVersion, runningVersion, shouldShowReleaseWelcome, showReleaseWelcomeIfNew
} from '@shell/utils/release-welcome';

jest.mock('@shell/dialog/ReleaseWelcomeDialog.vue', () => ({ __esModule: true, default: { name: 'ReleaseWelcomeDialog' } }));

const setVersion = (version: string) => setVersionData({
  Version: version, RancherPrime: 'false', GitCommit: ''
});

const createGetters = (lastSeen: string, isSingleProduct: any = undefined): any => ({
  isSingleProduct,
  'prefs/get': (key: string) => (key === SEEN_WHATS_NEW ? lastSeen : undefined),
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
    ])('should return undefined for the unparsable version %p', (version) => {
      setVersion(version);

      expect(releaseWelcomeVersion()).toBeUndefined();
    });
  });

  describe('runningVersion', () => {
    it.each([
      ['v2.16.1', '2.16.1'],
      ['2.16.0-rc1', '2.16.0'],
      ['dev', undefined],
      ['', undefined],
    ])('should return the version of %p', (version, expected) => {
      setVersion(version);

      expect(runningVersion()).toStrictEqual(expected);
    });
  });

  describe('shouldShowReleaseWelcome', () => {
    it.each([
      ['never seen', 'v2.16.0', '', true],
      ['seen for an older minor', 'v2.16.0', 'v2.15.4', true],
      ['seen for an older minor, as a head build', 'v2.16.0', 'v2.15.0-abc1234-head', true],
      ['seen for an older minor, below 10', 'v2.10.0', 'v2.9.3', true],
      ['seen for this minor', 'v2.16.0', 'v2.16.0', false],
      ['seen for this minor, after a patch upgrade', 'v2.16.2', 'v2.16.1', false],
      ['seen for this minor, as a head build', 'v2.16.0-abc1234-head', 'v2.16.0-abc1234-head', false],
      ['seen for a newer minor', 'v2.16.0', 'v2.17.0', false],
      ['seen as 2.x.x', 'v2.16.0', '2.x.x', false],
    ])('should handle release notes %s', (_, version, lastSeen, expected) => {
      setVersion(version);

      expect(shouldShowReleaseWelcome(createGetters(lastSeen))).toStrictEqual(expected);
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
    it('should open the modal when the release notes were seen for an older minor version', async() => {
      setVersion('v2.16.0');
      const commit = jest.fn();

      await showReleaseWelcomeIfNew(commit, createGetters('v2.15.3'));

      expect(commit).toHaveBeenCalledTimes(1);
    });

    it('should not open the modal when the release notes were seen for this minor version', async() => {
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
