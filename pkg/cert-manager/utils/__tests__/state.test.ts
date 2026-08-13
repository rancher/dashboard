import { colorForState } from '@shell/plugins/dashboard-store/resource-class';
import { stateObjFor } from '../state';

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

    expect(obj.message).toBe('Issuing certificate');
    expect(obj.name).toBe('pending');
  });

  it('should cope with a resource that has no Steve state', () => {
    expect(stateObjFor({}, 'error')).toStrictEqual({ error: true, transitioning: false });
  });
});
