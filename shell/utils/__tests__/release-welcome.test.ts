import { setVersionData } from '@shell/config/version';
import { READ_RELEASE_WELCOME } from '@shell/store/prefs';
import {
  openReleaseWelcome, releaseWelcomeVersion, runningVersion, shouldShowReleaseWelcome, showReleaseWelcomeIfNew
} from '@shell/utils/release-welcome';
import { fetchFirstRunContent, hasExactFirstRunRelease } from '@shell/utils/dynamic-content/first-run';

jest.mock('@shell/utils/dynamic-content/first-run', () => ({ fetchFirstRunContent: jest.fn(), hasExactFirstRunRelease: jest.fn() }));

const mockFetchFirstRunContent = fetchFirstRunContent as jest.Mock;
const mockHasExactFirstRunRelease = hasExactFirstRunRelease as jest.Mock;
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
    mockFetchFirstRunContent.mockReset();
    mockFetchFirstRunContent.mockResolvedValue({});
    mockHasExactFirstRunRelease.mockReset();
    mockHasExactFirstRunRelease.mockResolvedValue(false);
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
      ['read for an older patch line', 'v2.16.2', '2.15.4', true],
      ['read for this minor, as a minor version', 'v2.16.0', '2.16', false],
      ['read for this version', 'v2.16.1', '2.16.1', false],
      ['read for a newer minor', 'v2.16.0', '2.17', false],
      ['read for a newer patch', 'v2.16.1', '2.16.2', false],
      ['read with an invalid value', 'v2.16.0', 'invalid', true],
    ])('should handle a modal %s', async(_, version, lastRead, expected) => {
      setVersion(version);

      expect(await shouldShowReleaseWelcome(createGetters(lastRead), axios)).toStrictEqual(expected);
    });

    it.each([
      ['with', true],
      ['without', false],
    ])('should show the modal after a patch upgrade %s an entry for the exact version', async(_, hasEntry) => {
      setVersion('v2.16.2');
      mockHasExactFirstRunRelease.mockResolvedValue(hasEntry);

      expect(await shouldShowReleaseWelcome(createGetters('2.16.1'), axios)).toStrictEqual(hasEntry);
    });

    it('should look up the exact running version after a patch upgrade', async() => {
      setVersion('v2.16.2');
      const getters = createGetters('2.16');

      await shouldShowReleaseWelcome(getters, axios);

      expect(mockHasExactFirstRunRelease).toHaveBeenCalledWith(getters, axios, '2.16.2');
    });

    it.each([
      ['for a new minor', 'v2.16.0', '2.15.3'],
      ['for the version already read', 'v2.16.1', '2.16.1'],
    ])('should not fetch the dynamic content %s', async(_, version, lastRead) => {
      setVersion(version);

      await shouldShowReleaseWelcome(createGetters(lastRead), axios);

      expect(mockHasExactFirstRunRelease).toHaveBeenCalledTimes(0);
    });

    it('should not show the modal when the version cannot be parsed', async() => {
      setVersion('dev');

      expect(await shouldShowReleaseWelcome(createGetters(''), axios)).toStrictEqual(false);
    });

    it('should not show the modal in single product mode', async() => {
      setVersion('v2.16.0');

      expect(await shouldShowReleaseWelcome(createGetters('', { productNameKey: 'harvester' }), axios)).toStrictEqual(false);
    });
  });

  describe('openReleaseWelcome', () => {
    it('should open the modal with the built-in content when there is no dynamic content', async() => {
      setVersion('v2.16.0');
      const commit = jest.fn();

      await openReleaseWelcome(commit, jest.fn().mockResolvedValue(undefined), createGetters(''), axios);

      expect(commit).toHaveBeenCalledWith('modal/openModal', {
        component:      expect.any(Object),
        componentProps: {
          features: undefined, matchedVersion: undefined, primePromo: undefined, registration: undefined
        },
        modalWidth:          '900px',
        closeOnClickOutside: true
      });
    });

    it('should open the modal with the built-in content when the version cannot be parsed', async() => {
      setVersion('dev');
      const commit = jest.fn();

      await openReleaseWelcome(commit, jest.fn(), createGetters(''), axios);

      expect(commit).toHaveBeenCalledWith('modal/openModal', {
        component:      expect.any(Object),
        componentProps: {
          features: undefined, matchedVersion: undefined, primePromo: undefined, registration: undefined
        },
        modalWidth:          '900px',
        closeOnClickOutside: true
      });
    });

    it('should open the modal with the content from dynamic content', async() => {
      setVersion('v2.16.0');
      const features = [{
        id: 'remote', title: 'Remote title', description: 'Remote description'
      }];
      const primePromo = {
        title: 'Go Prime', description: 'Remote promotion', products: ['Remote product'], cta: { action: 'Explore', link: 'https://www.suse.com' }
      };
      const registration = {
        title: 'Register', description: 'Remote card', benefits: [{ text: 'Remote benefit' }], cta: { action: 'Open', link: 'https://scc.suse.com' }
      };
      const commit = jest.fn();

      mockFetchFirstRunContent.mockResolvedValue({
        features, matchedVersion: '2.16', primePromo, registration
      });

      await openReleaseWelcome(commit, jest.fn().mockResolvedValue(undefined), createGetters(''), axios);

      expect(commit).toHaveBeenCalledWith('modal/openModal', {
        component:      expect.any(Object),
        componentProps: {
          features, matchedVersion: '2.16', primePromo, registration
        },
        modalWidth:          '900px',
        closeOnClickOutside: true
      });
    });

    it('should fetch the dynamic content for the running version', async() => {
      setVersion('v2.16.1');
      const getters = createGetters('');

      await openReleaseWelcome(jest.fn(), jest.fn().mockResolvedValue(undefined), getters, axios);

      expect(mockFetchFirstRunContent).toHaveBeenCalledWith(getters, axios, '2.16.1');
    });

    it('should not fetch the dynamic content when the version cannot be parsed', async() => {
      setVersion('dev');

      await openReleaseWelcome(jest.fn(), jest.fn(), createGetters(''), axios);

      expect(mockFetchFirstRunContent).toHaveBeenCalledTimes(0);
    });

    it('should mark the modal as read for the running version', async() => {
      setVersion('v2.16.1');
      const dispatch = jest.fn().mockResolvedValue(undefined);

      await openReleaseWelcome(jest.fn(), dispatch, createGetters(''), axios);

      expect(dispatch).toHaveBeenCalledWith('prefs/set', { key: READ_RELEASE_WELCOME, value: '2.16.1' });
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

      expect(mockFetchFirstRunContent).toHaveBeenCalledTimes(0);
    });

    it('should open the modal again after an upgrade to a version with its own entry', async() => {
      setVersion('v2.16.2');
      mockHasExactFirstRunRelease.mockResolvedValue(true);
      const commit = jest.fn();

      await showReleaseWelcomeIfNew(commit, jest.fn().mockResolvedValue(undefined), createGetters('2.16.1'), axios);

      expect(commit).toHaveBeenCalledTimes(1);
    });
  });
});
