import { tabBodyId } from '@shell/components/nav/WindowManager/panels/tab-body';
import { BOTTOM, LEFT, RIGHT } from '@shell/utils/position';

describe('fx: tabBodyId', () => {
  it.each([
    [BOTTOM, 'kubectl-local', 'wm-panel-body-bottom-kubectl-local'],
    [LEFT, 'kubectl-local', 'wm-panel-body-left-kubectl-local'],
    [RIGHT, 'kubectl-local', 'wm-panel-body-right-kubectl-local'],
  ])('should build the id from the position and the tab id (%s)', (position, id, expected) => {
    expect(tabBodyId(position, id)).toBe(expected);
  });

  it.each([
    ['logs-pod/namespace', 'wm-panel-body-bottom-logs-pod-namespace'],
    ['shell:container.1', 'wm-panel-body-bottom-shell-container-1'],
    ['tab id', 'wm-panel-body-bottom-tab-id'],
    ['', 'wm-panel-body-bottom-'],
  ])('should replace characters that are not valid in an id (%s)', (id, expected) => {
    expect(tabBodyId(BOTTOM, id)).toBe(expected);
  });
});
