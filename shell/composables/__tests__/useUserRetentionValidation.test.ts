import { ref } from 'vue';
import { useUserRetentionValidation } from '@shell/composables/useUserRetentionValidation';
import type { Setting } from '@shell/types/resources/settings';

jest.mock('@shell/composables/useI18n', () => ({ useI18n: () => ({ t: (key: string) => key }) }));

jest.mock('vuex', () => ({ useStore: () => ({}) }));

function makeComposable(
  disableAfter = false,
  deleteAfter = false,
  sessionTtlMinutes: number | null = null,
) {
  const disableAfterPeriod = ref(disableAfter);
  const deleteAfterPeriod = ref(deleteAfter);
  // The composable only reads `.value`, so a partial Setting mock is sufficient here.
  const authUserSessionTtlMinutes = ref<Setting | null>(
    sessionTtlMinutes !== null ? { value: String(sessionTtlMinutes) } as Setting : null,
  );

  return useUserRetentionValidation(disableAfterPeriod, deleteAfterPeriod, authUserSessionTtlMinutes);
}

describe('useUserRetentionValidation', () => {
  describe('validateUserRetentionCron', () => {
    it('returns undefined when both disable and delete periods are inactive', () => {
      const { validateUserRetentionCron } = makeComposable(false, false);

      expect(validateUserRetentionCron('invalid')).toBeUndefined();
    });

    it.each([
      {
        desc:    'null cron string when disableAfterPeriod is true',
        disable: true,
        delete_: false,
        cron:    null,
      },
      {
        desc:    'empty cron string when disableAfterPeriod is true',
        disable: true,
        delete_: false,
        cron:    '',
      },
      {
        desc:    'invalid cron string when disableAfterPeriod is true',
        disable: true,
        delete_: false,
        cron:    'not-a-cron',
      },
      {
        desc:    'invalid cron string when deleteAfterPeriod is true',
        disable: false,
        delete_: true,
        cron:    'bad',
      },
    ])('returns an error message for $desc', ({ disable, delete_, cron }) => {
      const { validateUserRetentionCron } = makeComposable(disable, delete_);

      expect(validateUserRetentionCron(cron as string | null)).toBeDefined();
    });

    it.each([
      {
        desc:    'valid cron string when disableAfterPeriod is true',
        disable: true,
        delete_: false,
        cron:    '0 0 * * *',
      },
      {
        desc:    'valid cron string when deleteAfterPeriod is true',
        disable: false,
        delete_: true,
        cron:    '*/5 * * * *',
      },
    ])('returns undefined for $desc', ({ disable, delete_, cron }) => {
      const { validateUserRetentionCron } = makeComposable(disable, delete_);

      expect(validateUserRetentionCron(cron)).toBeUndefined();
    });
  });

  describe('validateDisableInactiveUserAfterDuration', () => {
    it('returns undefined when disableAfterPeriod is false', () => {
      const { validateDisableInactiveUserAfterDuration } = makeComposable(false);

      expect(validateDisableInactiveUserAfterDuration('bad')).toBeUndefined();
    });

    it.each([
      { desc: 'valid hours format', duration: '6h' },
      { desc: 'valid minutes format', duration: '30m' },
      { desc: 'valid seconds format', duration: '45s' },
      { desc: 'format with multiple units (matches leading h)', duration: '6h30m' },
    ])('returns undefined for $desc when disableAfterPeriod=true', ({ duration }) => {
      const { validateDisableInactiveUserAfterDuration } = makeComposable(true);

      expect(validateDisableInactiveUserAfterDuration(duration)).toBeUndefined();
    });

    it.each([
      { desc: 'empty string', duration: '' },
      { desc: 'text without unit', duration: 'abc' },
    ])('returns an error for $desc when disableAfterPeriod=true', ({ duration }) => {
      const { validateDisableInactiveUserAfterDuration } = makeComposable(true);

      expect(validateDisableInactiveUserAfterDuration(duration)).toBeDefined();
    });
  });

  describe('validateDeleteInactiveUserAfterDuration', () => {
    it('returns undefined when deleteAfterPeriod is false', () => {
      const { validateDeleteInactiveUserAfterDuration } = makeComposable(false, false);

      expect(validateDeleteInactiveUserAfterDuration('bad')).toBeUndefined();
    });

    it('returns undefined for valid duration when deleteAfterPeriod=true', () => {
      const { validateDeleteInactiveUserAfterDuration } = makeComposable(false, true);

      expect(validateDeleteInactiveUserAfterDuration('1h')).toBeUndefined();
    });

    it('returns an error for invalid duration format when deleteAfterPeriod=true', () => {
      const { validateDeleteInactiveUserAfterDuration } = makeComposable(false, true);

      expect(validateDeleteInactiveUserAfterDuration('notvalid')).toBeDefined();
    });
  });

  describe('validateDeleteInactiveUserAfter', () => {
    it.each([
      { desc: 'duration of exactly 336h (minimum)', duration: '336h' },
      { desc: 'duration greater than 336h', duration: '400h' },
    ])('returns undefined for $desc', ({ duration }) => {
      const { validateDeleteInactiveUserAfter } = makeComposable();

      expect(validateDeleteInactiveUserAfter(duration)).toBeUndefined();
    });

    it.each([
      { desc: 'duration less than 336h', duration: '1h' },
      { desc: 'duration of 0h', duration: '0h' },
    ])('returns an error for $desc', ({ duration }) => {
      const { validateDeleteInactiveUserAfter } = makeComposable();

      expect(validateDeleteInactiveUserAfter(duration)).toBeDefined();
    });

    it('returns undefined for invalid duration format (swallows ExpectedValidationError)', () => {
      const { validateDeleteInactiveUserAfter } = makeComposable();

      expect(validateDeleteInactiveUserAfter('')).toBeUndefined();
    });
  });

  describe('validateDurationAgainstAuthUserSession', () => {
    it('returns undefined when duration exceeds session TTL', () => {
      const { validateDurationAgainstAuthUserSession } = makeComposable(false, false, 60);

      expect(validateDurationAgainstAuthUserSession('2h')).toBeUndefined();
    });

    it('returns error when duration is less than session TTL', () => {
      // Session TTL is 120 minutes (2h), input is 1h
      const { validateDurationAgainstAuthUserSession } = makeComposable(false, false, 120);
      const result = validateDurationAgainstAuthUserSession('1h');

      expect(result).toBeDefined();
    });

    it('returns undefined when duration equals session TTL', () => {
      // Session TTL is 60 minutes, input is 1h (60 minutes)
      const { validateDurationAgainstAuthUserSession } = makeComposable(false, false, 60);

      expect(validateDurationAgainstAuthUserSession('1h')).toBeUndefined();
    });

    it('returns undefined for invalid duration format (swallows ExpectedValidationError)', () => {
      const { validateDurationAgainstAuthUserSession } = makeComposable(false, false, 60);

      expect(validateDurationAgainstAuthUserSession('')).toBeUndefined();
    });

    it('returns undefined when authUserSessionTtlMinutes is null', () => {
      const { validateDurationAgainstAuthUserSession } = makeComposable(false, false, null);

      // NaN comparison — duration never less than NaN, so returns undefined
      expect(validateDurationAgainstAuthUserSession('1h')).toBeUndefined();
    });
  });
});
