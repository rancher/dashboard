import { SHARE_USAGE_DATA } from '@shell/store/prefs';
import { isAdminUser } from '@shell/store/type-map';
import { askShareUsageDataIfNeeded, openShareUsageDataDialog, shouldAskShareUsageData } from '@shell/utils/share-usage-data';

jest.mock('@shell/store/type-map', () => ({ isAdminUser: jest.fn() }));

const mockIsAdminUser = isAdminUser as jest.Mock;

const createGetters = (choice: unknown, isSingleProduct?: unknown): any => ({
  'prefs/get': jest.fn().mockReturnValue(choice),
  isSingleProduct,
});

describe('utils: share-usage-data', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('shouldAskShareUsageData', () => {
    it.each([
      ['an admin who has not chosen yet', true, '', true],
      ['an admin whose choice is missing', true, undefined, true],
      ['an admin who chose to share', true, 'share', false],
      ['an admin who chose not to share', true, 'dont-share', false],
      ['a user who is not an admin', false, '', false],
    ])('should return the expected result for %s', (_, admin, choice, expected) => {
      mockIsAdminUser.mockReturnValue(admin);

      expect(shouldAskShareUsageData(createGetters(choice))).toStrictEqual(expected);
    });

    it('should return false in single product mode, even for an admin who has not chosen yet', () => {
      mockIsAdminUser.mockReturnValue(true);

      expect(shouldAskShareUsageData(createGetters('', { productNameKey: 'harvester' }))).toStrictEqual(false);
    });

    it('should read the choice from the share usage data preference', () => {
      mockIsAdminUser.mockReturnValue(true);
      const getters = createGetters('');

      shouldAskShareUsageData(getters);

      expect(getters['prefs/get']).toHaveBeenCalledWith(SHARE_USAGE_DATA);
    });
  });

  describe('openShareUsageDataDialog', () => {
    it('should open a dialog that cannot be dismissed without a choice', () => {
      const commit = jest.fn();

      openShareUsageDataDialog(commit);

      expect(commit).toHaveBeenCalledWith('modal/openModal', {
        component:           expect.any(Object),
        modalWidth:          '640px',
        closeOnClickOutside: false,
      });
    });
  });

  describe('askShareUsageDataIfNeeded', () => {
    it('should open the dialog when the admin has not chosen yet', () => {
      mockIsAdminUser.mockReturnValue(true);
      const commit = jest.fn();

      askShareUsageDataIfNeeded(commit, createGetters(''));

      expect(commit).toHaveBeenCalledTimes(1);
    });

    it.each([
      ['the user is not an admin', false, '', undefined],
      ['the admin already chose', true, 'share', undefined],
      ['the UI is in single product mode', true, '', { productNameKey: 'harvester' }],
    ])('should not open the dialog when %s', (_, admin, choice, isSingleProduct) => {
      mockIsAdminUser.mockReturnValue(admin);
      const commit = jest.fn();

      askShareUsageDataIfNeeded(commit, createGetters(choice, isSingleProduct));

      expect(commit).toHaveBeenCalledTimes(0);
    });
  });
});
