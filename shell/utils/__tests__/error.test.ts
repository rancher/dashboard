import { formatAWSError } from '@shell/utils/error';
const SOME_ERROR = 'Some error';

describe('formatAWSError', () => {
  it('should return the extracted reason when error is a TypeError and message includes "reading \'Error\'"', () => {
    const error = Object.assign(new TypeError("Cannot read property of undefined (reading 'Error')"), { $response: { reason: SOME_ERROR } });

    const result = formatAWSError(error);

    expect(result).toBe(SOME_ERROR);
  });

  it('should return the original error if it is not an instance of TypeError', () => {
    const error = Object.assign(new Error("Cannot read property of undefined (reading 'Error')"), { $response: { reason: SOME_ERROR } });

    const result = formatAWSError(error);

    expect(result).toBe(error);
  });

  it('should return the original error if the message does not contain "reading \'Error\'"', () => {
    const error = Object.assign(new TypeError('Some other type error occurred'), { $response: { reason: SOME_ERROR } });

    const result = formatAWSError(error);

    expect(result).toBe(error);
  });

  it('should return the original input if it is a plain object (not an Error instance)', () => {
    const error = {
      message:   "reading 'Error'",
      $response: { reason: 'Should not be returned' }
    };

    const result = formatAWSError(error);

    expect(result).toBe(error);
  });

  it('should return null or undefined as-is without crashing', () => {
    expect(formatAWSError(null)).toBeNull();
    expect(formatAWSError(undefined)).toBeUndefined();
  });
});
