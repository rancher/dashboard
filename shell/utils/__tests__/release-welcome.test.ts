import { setVersionData } from '@shell/config/version';
import { READ_RELEASE_WELCOME } from '@shell/store/prefs';
import { openReleaseWelcome, releaseWelcomeVersion, shouldShowReleaseWelcome, showReleaseWelcomeIfNew } from '@shell/utils/release-welcome';
import { fetchFirstRunFeatures } from '@shell/utils/dynamic-content/first-run';

jest.mock('@shell/utils/dynamic-content/first-run', () => ({ fetchFirstRunFeatures: jest.fn() }));

const mockFetchFirstRunFeatures = fetchFirstRunFeatures as jest.Mock;
const axios = jest.fn();

const setVersion = (version: string) => setVersionData({
  Version: version, RancherPrime: 'false', GitCommit: ''
});

const createGetters = (lastRead: string, isSingleProduct: any = undefined): any => ({
  isSingleProduct,
  'prefs/get': (key: string) => (key === READ_RELEASE_WELCOME ? lastRead : undefined),
});

describe('utils: release-welcome', () => {
  beforeEach(() => {
    mockFetchFirstRunFeatures.mockReset();
    mockFetchFirstRunFeatures.mockResolvedValue(undefined);
  });

  afterEach(() => {
    setVersion('');
    jest.restoreAllMocks();
  });

  describe('releaseWelcomeVersion', () => {
    it.each([
      ['v2.16.0', '2.16'],
      ['v2.16.3', '2.16'],
      ['2.16.0-rc1', '2.16'],
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

  describe('shouldShowReleaseWelcome', () => {
    it.each([
      ['never read', 'v2.16.0', '', true],
      ['read for an older minor', 'v2.16.0', '2.15', true],
      ['read for an older patch line', 'v2.16.2', '2.15', true],
      ['read for this minor', 'v2.16.2', '2.16', false],
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
    it('should open the modal with the built-in content when there is no dynamic content', async() => {
      setVersion('v2.16.0');
      const commit = jest.fn();

      await openReleaseWelcome(commit, jest.fn().mockResolvedValue(undefined), createGetters(''), axios);

      expect(commit).toHaveBeenCalledWith('modal/openModal', {
        component: expect.any(Object), componentProps: { features: undefined }, modalWidth: '900px', closeOnClickOutside: true
      });
    });

    it('should open the modal with the features from dynamic content', async() => {
      setVersion('v2.16.0');
      const features = [{
        id: 'remote', title: 'Remote title', description: 'Remote description'
      }];
      const commit = jest.fn();

      mockFetchFirstRunFeatures.mockResolvedValue(features);

      await openReleaseWelcome(commit, jest.fn().mockResolvedValue(undefined), createGetters(''), axios);

      expect(commit).toHaveBeenCalledWith('modal/openModal', {
        component: expect.any(Object), componentProps: { features }, modalWidth: '900px', closeOnClickOutside: true
      });
    });

    it('should fetch the dynamic content for the running minor version', async() => {
      setVersion('v2.16.1');
      const getters = createGetters('');

      await openReleaseWelcome(jest.fn(), jest.fn().mockResolvedValue(undefined), getters, axios);

      expect(mockFetchFirstRunFeatures).toHaveBeenCalledWith(getters, axios, '2.16');
    });

    it('should not fetch the dynamic content when the version cannot be parsed', async() => {
      setVersion('dev');

      await openReleaseWelcome(jest.fn(), jest.fn(), createGetters(''), axios);

      expect(mockFetchFirstRunFeatures).toHaveBeenCalledTimes(0);
    });

    it('should mark the modal as read for the running minor version', async() => {
      setVersion('v2.16.1');
      const dispatch = jest.fn().mockResolvedValue(undefined);

      await openReleaseWelcome(jest.fn(), dispatch, createGetters(''), axios);

      expect(dispatch).toHaveBeenCalledWith('prefs/set', { key: READ_RELEASE_WELCOME, value: '2.16' });
    });

    it('should not mark the modal as read when the version cannot be parsed', async() => {
      setVersion('dev');
      const dispatch = jest.fn();

      await openReleaseWelcome(jest.fn(), dispatch, createGetters(''), axios);

      expect(dispatch).toHaveBeenCalledTimes(0);
    });

    it('should keep the modal open when the preference cannot be saved', async() => {
      setVersion('v2.16.0');
      const error = new Error('forbidden');
      const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

      await expect(openReleaseWelcome(jest.fn(), jest.fn().mockRejectedValue(error), createGetters(''), axios)).resolves.toBeUndefined();
      expect(warn).toHaveBeenCalledWith('Unable to mark the welcome modal as read', error);
    });
  });

  describe('showReleaseWelcomeIfNew', () => {
    it('should open the modal when it was not read for this minor version', async() => {
      setVersion('v2.16.0');
      const commit = jest.fn();

      await showReleaseWelcomeIfNew(commit, jest.fn().mockResolvedValue(undefined), createGetters('2.15'), axios);

      expect(commit).toHaveBeenCalledTimes(1);
    });

    it('should not open the modal when it was read for this minor version', async() => {
      setVersion('v2.16.0');
      const commit = jest.fn();
      const dispatch = jest.fn();

      await showReleaseWelcomeIfNew(commit, dispatch, createGetters('2.16'), axios);

      expect(commit).toHaveBeenCalledTimes(0);
      expect(dispatch).toHaveBeenCalledTimes(0);
    });

    it('should not fetch the dynamic content when it was read for this minor version', async() => {
      setVersion('v2.16.0');

      await showReleaseWelcomeIfNew(jest.fn(), jest.fn(), createGetters('2.16'), axios);

      expect(mockFetchFirstRunFeatures).toHaveBeenCalledTimes(0);
    });
  });
});
