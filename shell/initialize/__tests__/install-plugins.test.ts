import { installPlugins } from '@shell/initialize/install-plugins';
import ShortKey from '@shell/plugins/shortkey';
import { MODAL_CONTAINER_SELECTOR, SWITCHER_POPPER_SELECTOR } from '@shell/utils/dom';

jest.mock('vue3-resize/dist/vue3-resize.css', () => ({}));
jest.mock('floating-vue/dist/style.css', () => ({}));
jest.mock('codemirror-editor-vue3', () => ({ InstallCodeMirror: {} }));
jest.mock('@rancher/dynamic', () => ({}), { virtual: true });

describe('fx: installPlugins', () => {
  it('should suppress global shortcuts while focus is inside either modal component', async() => {
    const use = jest.fn();

    await installPlugins({ use } as any);

    const shortKey = use.mock.calls.find(([plugin]) => plugin === ShortKey);

    expect(shortKey?.[1].preventContainer).toStrictEqual([MODAL_CONTAINER_SELECTOR, SWITCHER_POPPER_SELECTOR, '.rc-modal']);
  });
});
