import { registerTableViewShortcuts, runTableViewShortcut } from '@shell/utils/table-views/shortcuts';

describe('table views shortcuts', () => {
  const list = (el: Element) => {
    const run = jest.fn();
    const unregister = registerTableViewShortcuts({ owns: (focused) => !!focused && el.contains(focused), run });

    return { run, unregister };
  };

  it('should run the action on the list the focus is in, whichever table asked', () => {
    const first = document.createElement('div');
    const second = document.createElement('div');
    const input = document.createElement('input');

    first.appendChild(input);
    const a = list(first);
    const b = list(second);

    runTableViewShortcut('saveChanges', input);

    expect(a.run).toHaveBeenCalledWith('saveChanges');
    expect(b.run).not.toHaveBeenCalled();
    a.unregister();
    b.unregister();
  });

  it('should do nothing when the focus is in no list', () => {
    const a = list(document.createElement('div'));

    runTableViewShortcut('duplicateCurrent', document.body);

    expect(a.run).not.toHaveBeenCalled();
    a.unregister();
  });

  it('should forget a list once it has gone', () => {
    const el = document.createElement('div');
    const input = document.createElement('input');

    el.appendChild(input);
    const a = list(el);

    a.unregister();
    runTableViewShortcut('openSaveAsNew', input);

    expect(a.run).not.toHaveBeenCalled();
  });
});
