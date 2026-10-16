import { setVersionData } from '@shell/config/version';
import { READ_RELEASE_WELCOME } from '@shell/store/prefs';
import {
  openReleaseWelcome, releaseWelcomeVersion, runningVersion, shouldShowReleaseWelcome, showReleaseWelcomeIfNew
} from '@shell/utils/release-welcome';

jest.mock('@shell/dialog/ReleaseWelcomeDialog.vue', () => ({ __esModule: true, default: { name: 'ReleaseWelcomeDialog' } }));

const setVersion = (version: string) => setVersionData({
  Version: version, RancherPrime: 'false', GitCommit: ''
});

const createGetters = (lastRead: string, isSingleProduct: any = undefined): any => ({
  isSingleProduct,
  'prefs/get': (key: string) => (key === READ_RELEASE_WELCOME ? lastRead : undefined),
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
      ['never read', 'v2.16.0', '', true],
      ['read for an older minor', 'v2.16.0', '2.15', true],
      ['read for an older minor, as a full version', 'v2.16.2', '2.15.4', true],
      ['read for this minor', 'v2.16.0', '2.16', false],
      ['read for this minor, after a patch upgrade', 'v2.16.2', '2.16', false],
      ['read for this minor, as a full version', 'v2.16.2', '2.16.1', false],
      ['read for a newer minor', 'v2.16.0', '2.17', false],
      ['read with an invalid value', 'v2.16.0', 'invalid', true],
    ])('should handle a modal %s', (_, version, lastRead, expected) => {
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

      await openReleaseWelcome(commit, jest.fn().mockResolvedValue(undefined));

      expect(commit).toHaveBeenCalledWith('modal/openModal', { component: { name: 'ReleaseWelcomeDialog' } });
    });

    it('should open the welcome dialog when the version cannot be parsed', async() => {
      setVersion('dev');
      const commit = jest.fn();

      await openReleaseWelcome(commit, jest.fn());

      expect(commit).toHaveBeenCalledWith('modal/openModal', { component: { name: 'ReleaseWelcomeDialog' } });
    });

    it('should mark the modal as read for the running minor version', async() => {
      setVersion('v2.16.1');
      const dispatch = jest.fn().mockResolvedValue(undefined);

      await openReleaseWelcome(jest.fn(), dispatch);

      expect(dispatch).toHaveBeenCalledWith('prefs/set', { key: READ_RELEASE_WELCOME, value: '2.16' });
    });

    it('should not mark the modal as read when the version cannot be parsed', async() => {
      setVersion('dev');
      const dispatch = jest.fn();

      await openReleaseWelcome(jest.fn(), dispatch);

      expect(dispatch).toHaveBeenCalledTimes(0);
    });

    it('should keep the modal open when the preference cannot be saved', async() => {
      setVersion('v2.16.0');
      const error = new Error('forbidden');
      const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

      await expect(openReleaseWelcome(jest.fn(), jest.fn().mockRejectedValue(error))).resolves.toBeUndefined();
      expect(warn).toHaveBeenCalledWith('Unable to mark the welcome modal as read', error);
    });
  });

  describe('showReleaseWelcomeIfNew', () => {
    it('should open the modal when it was not read for this minor version', async() => {
      setVersion('v2.16.0');
      const commit = jest.fn();

      await showReleaseWelcomeIfNew(commit, jest.fn().mockResolvedValue(undefined), createGetters('2.15'));

      expect(commit).toHaveBeenCalledTimes(1);
    });

    it('should not open the modal when it was read for this minor version', async() => {
      setVersion('v2.16.0');
      const commit = jest.fn();
      const dispatch = jest.fn();

      await showReleaseWelcomeIfNew(commit, dispatch, createGetters('2.16'));

      expect(commit).toHaveBeenCalledTimes(0);
      expect(dispatch).toHaveBeenCalledTimes(0);
    });

    it('should not open the modal again after a patch upgrade', async() => {
      setVersion('v2.16.2');
      const commit = jest.fn();

      await showReleaseWelcomeIfNew(commit, jest.fn(), createGetters('2.16.1'));

      expect(commit).toHaveBeenCalledTimes(0);
    });
  });
});
