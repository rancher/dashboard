import { colorForState } from '@shell/plugins/dashboard-store/resource-class';
import { stateObjFor } from '../state';
import { isFailingCondition } from '../conditions';

/** What the badge ultimately renders: `stateColor` on the model, minus the `text-` prefix. */
const colorOf = (state: string, steveState: any = {}) => {
  const obj = stateObjFor({ metadata: { state: steveState } }, state);

  return colorForState(state, obj.error, obj.transitioning).replace('text-', '');
};

describe('fx: stateObjFor', () => {
  // Steve flags any CRD that is not Ready as transitioning, which forces the badge blue and
  // overrides whatever state the model computed.
  const STEVE_TRANSITIONING = {
    transitioning: true, error: false, message: 'not ready'
  };

  it.each([
    ['error', 'error'],
    ['expired', 'error'],
    ['denied', 'error'],
  ])('should render %s as an error, not as transitioning', (state, expected) => {
    expect(colorOf(state, STEVE_TRANSITIONING)).toBe(expected);
  });

  it('should keep in-progress transitioning', () => {
    expect(colorOf('in-progress', STEVE_TRANSITIONING)).toBe('info');
  });

  it.each([
    ['active', 'success'],
    ['expiring', 'warning'],
    ['pending', 'info'],
  ])('should leave %s to the shell state table', (state, expected) => {
    expect(colorOf(state, STEVE_TRANSITIONING)).toBe(expected);
  });

  it('should not let a stale Steve error flag override a healthy state', () => {
    expect(colorOf('active', { error: true })).toBe('success');
  });

  it('should preserve the rest of the Steve state object', () => {
    const obj = stateObjFor({ metadata: { state: { message: 'Issuing certificate', name: 'pending' } } }, 'error');

    expect(obj.name).toBe('pending');
  });

  it('should caption the resource with its own description, not Steve\'s reading of it', () => {
    // Steve reported "Resource is Ready" on a certificate that had failed four times.
    const resource = { metadata: { state: { message: 'Resource is Ready' } }, stateDescription: 'Issuer not found' };

    expect(stateObjFor(resource, 'error').message).toBe('Issuer not found');
  });

  it('should keep the Steve message when the model has nothing to say', () => {
    expect(stateObjFor({ metadata: { state: { message: 'Resource is Ready' } } }, 'active').message).toBe('Resource is Ready');
  });

  it('should cope with a resource that has no Steve state', () => {
    expect(stateObjFor({}, 'error')).toStrictEqual({
      error: true, transitioning: false, message: undefined
    });
  });
});

describe('fx: isFailingCondition', () => {
  const condition = (type: string, status: string) => ({ type, status } as any);

  it.each([
    ['Failed', 'Failed'],
    ['Denied', 'Denied'],
    ['InvalidRequest', 'InvalidRequest'],
  ])('should treat %s=True as a failure regardless of the resource state', (_label, type) => {
    expect(isFailingCondition(condition(type, 'True'), false)).toBe(true);
  });

  it.each([
    ['Failed'],
    ['Denied'],
  ])('should not treat %s=False as a failure', (type) => {
    expect(isFailingCondition(condition(type, 'False'), true)).toBe(false);
  });

  it('should flag Ready=False once the resource is in an error state', () => {
    expect(isFailingCondition(condition('Ready', 'False'), true)).toBe(true);
  });

  it('should leave Ready=False alone while the resource is merely issuing', () => {
    // A certificate part way through issuance legitimately reports Ready=False.
    expect(isFailingCondition(condition('Ready', 'False'), false)).toBe(false);
  });

  it('should never flag a condition that is True', () => {
    expect(isFailingCondition(condition('Ready', 'True'), true)).toBe(false);
  });

  it('should cope with a missing condition', () => {
    expect(isFailingCondition(undefined as any, true)).toBe(false);
  });
});
