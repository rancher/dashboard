import cronstrue from 'cronstrue';
import { cronSchedule, cronScheduleRule, isValidCronSchedule } from '@shell/utils/validators/cron-schedule';

jest.mock('cronstrue', () => ({ toString: jest.fn() }));

const mockCronstrue = cronstrue as jest.Mocked<typeof cronstrue>;
const mockGetters = { 'i18n/t': (key: string) => key };

describe('cronScheduleRule', () => {
  it('calls cronstrue.toString with verbose:true', () => {
    mockCronstrue.toString.mockReturnValue('every minute');
    cronScheduleRule.validation('* * * * *');

    expect(mockCronstrue.toString).toHaveBeenCalledWith('* * * * *', { verbose: true });
  });

  it('has the correct message key', () => {
    expect(cronScheduleRule.message).toStrictEqual('validation.invalidCron');
  });
});

describe('cronSchedule', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does not add an error for a valid cron expression', () => {
    mockCronstrue.toString.mockReturnValue('every minute');
    const errors: string[] = [];

    cronSchedule('* * * * *', mockGetters, errors);

    expect(errors).toStrictEqual([]);
  });

  it('adds an error for an invalid cron expression', () => {
    mockCronstrue.toString.mockImplementation(() => {
      throw new Error('Invalid cron expression');
    });
    const errors: string[] = [];

    cronSchedule('not-a-cron', mockGetters, errors);

    expect(errors).toStrictEqual(['validation.invalidCron']);
  });

  it('uses default empty string for schedule when not provided', () => {
    mockCronstrue.toString.mockImplementation(() => {
      throw new Error('Invalid cron expression');
    });
    const errors: string[] = [];

    cronSchedule(undefined as any, mockGetters, errors);

    expect(errors).toStrictEqual(['validation.invalidCron']);
  });

  it('does not push multiple errors for a single invalid schedule', () => {
    mockCronstrue.toString.mockImplementation(() => {
      throw new Error('Invalid');
    });
    const errors: string[] = [];

    cronSchedule('bad', mockGetters, errors);

    expect(errors).toHaveLength(1);
  });

  it('preserves existing errors when adding a new one', () => {
    mockCronstrue.toString.mockImplementation(() => {
      throw new Error('Invalid');
    });
    const errors = ['existing error'];

    cronSchedule('bad', mockGetters, errors);

    expect(errors).toStrictEqual(['existing error', 'validation.invalidCron']);
  });
});

describe('isValidCronSchedule', () => {
  it.each([
    ['0 */5 * * *', true],
    ['* * * * *', true],
    ['0 0 * * 7', true],
    ['0 0 * * MON', true],
    ['0 0 ? * MON', true],
    ['@yearly', true],
    ['@annually', true],
    ['@monthly', true],
    ['@weekly', true],
    ['@daily', true],
    ['@midnight', true],
    ['@hourly', true],
    ['* * * * * *', false],
    ['* * * *', false],
    ['not-a-cron', false],
    ['60 * * * *', false],
    ['', false],
  ])('should treat %p as valid: %p', (schedule, valid) => {
    expect(isValidCronSchedule(schedule)).toStrictEqual(valid);
  });
});
