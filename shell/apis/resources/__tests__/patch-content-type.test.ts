import {
  PATCH_CONTENT_TYPE, clearPatchStrategyCache, hasRejectedStrategicMerge, isUnsupportedPatchMediaType, patchWithFallback
} from '@shell/apis/resources/patch-content-type';

/**
 * The message the Kubernetes API returns when a CRD is sent a strategic merge patch
 */
const UNSUPPORTED_MESSAGE = 'the body of the request was in an unknown format - accepted media types include: application/json-patch+json, application/merge-patch+json, application/apply-patch+yaml';

/**
 * A Steve error - the response body, with the status attached by the store's `request` action
 */
const steveError = (status: number, message = 'something went wrong') => {
  const error: Record<string, any> = {
    type: 'error', status, message
  };

  Object.defineProperty(error, '_status', { value: status });

  return error;
};

describe('fx: isUnsupportedPatchMediaType', () => {
  it.each([
    ['a Steve 415', steveError(415, UNSUPPORTED_MESSAGE), true],
    ['a 415 with an unrelated message', steveError(415, 'nope'), true],
    ['a plain object with a status', { status: 415 }, true],
    ['an axios error', { response: { status: 415 }, message: 'Request failed' }, true],
    ['a non 415 carrying the message', steveError(500, UNSUPPORTED_MESSAGE), true],
    ['an Error carrying the message', new Error(UNSUPPORTED_MESSAGE), true],
    ['a forbidden', steveError(403, 'forbidden'), false],
    ['a not found', steveError(404, 'not found'), false],
    ['a conflict', steveError(409, 'the object has been modified'), false],
    ['an unrelated Error', new Error('Network Error'), false],
    ['undefined', undefined, false],
    ['null', null, false],
  ])('should return %s --> %s', (_label, error, expected) => {
    expect(isUnsupportedPatchMediaType(error)).toBe(expected);
  });
});

describe('fx: patchWithFallback', () => {
  const STORE = 'cluster';
  const TYPE = 'configmap';

  beforeEach(() => clearPatchStrategyCache());

  afterEach(() => clearPatchStrategyCache());

  it('should send a strategic merge patch when the resource accepts it', async() => {
    // Arrange
    const send = jest.fn().mockResolvedValue({ ok: true });

    // Act
    const res = await patchWithFallback({
      storeName: STORE, resourceType: TYPE, send
    });

    // Assert
    expect(res).toStrictEqual({ ok: true });
    expect(send).toHaveBeenCalledTimes(1);
    expect(send).toHaveBeenCalledWith(PATCH_CONTENT_TYPE.STRATEGIC_MERGE);
    expect(hasRejectedStrategicMerge(STORE, TYPE)).toBe(false);
  });

  it('should retry with a merge patch when the resource rejects the media type', async() => {
    // Arrange
    const onFallback = jest.fn();
    const send = jest.fn()
      .mockRejectedValueOnce(steveError(415, UNSUPPORTED_MESSAGE))
      .mockResolvedValueOnce({ ok: true });

    // Act
    const res = await patchWithFallback({
      storeName: STORE, resourceType: TYPE, send, onFallback
    });

    // Assert
    expect(res).toStrictEqual({ ok: true });
    expect(send).toHaveBeenCalledTimes(2);
    expect(send).toHaveBeenNthCalledWith(1, PATCH_CONTENT_TYPE.STRATEGIC_MERGE);
    expect(send).toHaveBeenNthCalledWith(2, PATCH_CONTENT_TYPE.MERGE);
    expect(onFallback).toHaveBeenCalledWith(expect.stringContaining(TYPE), expect.anything());
  });

  it('should skip the strategic merge patch once the resource has rejected it', async() => {
    // Arrange - first call teaches it that the type won't accept a strategic merge patch
    const onFallback = jest.fn();
    const first = jest.fn()
      .mockRejectedValueOnce(steveError(415, UNSUPPORTED_MESSAGE))
      .mockResolvedValueOnce({ ok: true });

    await patchWithFallback({
      storeName: STORE, resourceType: TYPE, send: first, onFallback
    });

    const send = jest.fn().mockResolvedValue({ ok: true });

    onFallback.mockClear();

    // Act
    await patchWithFallback({
      storeName: STORE, resourceType: TYPE, send, onFallback
    });

    // Assert
    expect(send).toHaveBeenCalledTimes(1);
    expect(send).toHaveBeenCalledWith(PATCH_CONTENT_TYPE.MERGE);
    expect(onFallback).not.toHaveBeenCalled();
  });

  it('should not retry, or remember anything, when the patch fails for any other reason', async() => {
    // Arrange
    const onFallback = jest.fn();
    const error = steveError(403, 'forbidden');
    const send = jest.fn().mockRejectedValue(error);

    // Act
    const act = patchWithFallback({
      storeName: STORE, resourceType: TYPE, send, onFallback
    });

    // Assert
    await expect(act).rejects.toBe(error);
    expect(send).toHaveBeenCalledTimes(1);
    expect(send).toHaveBeenCalledWith(PATCH_CONTENT_TYPE.STRATEGIC_MERGE);
    expect(onFallback).not.toHaveBeenCalled();
    expect(hasRejectedStrategicMerge(STORE, TYPE)).toBe(false);
  });

  it('should surface a failing merge patch to the caller', async() => {
    // Arrange
    const error = steveError(409, 'the object has been modified');
    const send = jest.fn()
      .mockRejectedValueOnce(steveError(415, UNSUPPORTED_MESSAGE))
      .mockRejectedValueOnce(error);

    // Act
    const act = patchWithFallback({
      storeName: STORE, resourceType: TYPE, send, onFallback: jest.fn()
    });

    // Assert
    await expect(act).rejects.toBe(error);
    expect(send).toHaveBeenCalledTimes(2);
  });

  it('should remember rejections per store, not just per type', async() => {
    // Arrange
    const onFallback = jest.fn();
    const first = jest.fn()
      .mockRejectedValueOnce(steveError(415, UNSUPPORTED_MESSAGE))
      .mockResolvedValueOnce({ ok: true });

    await patchWithFallback({
      storeName: 'cluster', resourceType: TYPE, send: first, onFallback
    });

    const send = jest.fn().mockResolvedValue({ ok: true });

    // Act - same type, different store
    await patchWithFallback({
      storeName: 'management', resourceType: TYPE, send, onFallback
    });

    // Assert
    expect(send).toHaveBeenCalledWith(PATCH_CONTENT_TYPE.STRATEGIC_MERGE);
    expect(hasRejectedStrategicMerge('cluster', TYPE)).toBe(true);
    expect(hasRejectedStrategicMerge('management', TYPE)).toBe(false);
  });

  it('should warn on the console when no fallback handler is given', async() => {
    // Arrange
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const send = jest.fn()
      .mockRejectedValueOnce(steveError(415, UNSUPPORTED_MESSAGE))
      .mockResolvedValueOnce({ ok: true });

    // Act
    await patchWithFallback({
      storeName: STORE, resourceType: TYPE, send
    });

    // Assert
    expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining(TYPE), expect.anything());

    consoleWarnSpy.mockRestore();
  });
});
