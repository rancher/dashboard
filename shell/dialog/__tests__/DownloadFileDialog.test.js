import { mount } from '@vue/test-utils';
import { Banner } from '@components/Banner';
import DownloadFileDialog from '@shell/dialog/DownloadFileDialog.vue';
import { cleanHtmlDirective } from '@shell/plugins/clean-html-directive';

describe('component: DownloadFileDialog', () => {
  it('should clear old error message after verifying the connection', async() => {
    const wrapper = mount(DownloadFileDialog, {
      directives: { cleanHtmlDirective },
      slots:      { title: '<h4 />' },
      propsData:  {
        resources: [
          {
            id:       'test',
            metadata: { name: 'test' }
          }
        ]
      },
      mocks: {
        $store: {
          dispatch: jest.fn(() => Promise.resolve({})),
          getters:  { 'i18n/t': jest.fn(), 'i18n/exists': k => k }
        }
      }
    });

    const inputWraps = wrapper.findAll('[class^=labeled-]');

    expect(inputWraps).toHaveLength(2);

    await wrapper.setData({ errors: ['error'] });
    expect(wrapper.findComponent(Banner).props('label')).toStrictEqual('error');

    await wrapper.setData({ largeFileSize: true });

    expect(wrapper.findAllComponents(Banner)).toHaveLength(2);
  });
});
