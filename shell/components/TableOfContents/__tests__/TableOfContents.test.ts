import { mount } from '@vue/test-utils';
import {
  computed, defineComponent, nextTick, reactive, ref
} from 'vue';
import TableOfContents from '@shell/components/TableOfContents/TableOfContents.vue';
import { useFormSummary } from '@shell/components/TableOfContents/composables';
import RcSection from '@components/RcSection/RcSection.vue';
import { useReportInvalidToSection } from '@components/RcSection/useSectionValidity';

const ICON = '[data-testid="toc-invalid-fields"]';

describe('component: TableOfContents', () => {
  const mountToc = (accordions: unknown[]) => mount(TableOfContents, {
    props:  { accordions },
    global: { directives: { 'clean-tooltip': () => {} } },
  });

  it('should show an error icon next to an invalid parent entry', () => {
    const wrapper = mountToc([{
      label: 'Networking', scrollTo: jest.fn(), invalid: true
    }]);

    expect(wrapper.find('[data-testid="toc-list-item-0"]').find(ICON).exists()).toBe(true);
  });

  it('should show an error icon next to an invalid child entry only', () => {
    const wrapper = mountToc([{
      label:    'Cluster',
      scrollTo: jest.fn(),
      children: [
        {
          label: 'Networking', scrollTo: jest.fn(), invalid: true
        },
        {
          label: 'Backups', scrollTo: jest.fn(), invalid: false
        },
      ],
    }]);

    expect(wrapper.findAll(ICON).map((icon) => icon.element.closest('li')?.getAttribute('data-testid'))).toStrictEqual(['toc-list-item-0-0']);
  });

  it.each([
    [false],
    [undefined],
  ])('should not show an error icon when invalid is %p', (invalid) => {
    const wrapper = mountToc([{
      label: 'Networking', scrollTo: jest.fn(), invalid
    }]);

    expect(wrapper.find(ICON).exists()).toBe(false);
  });

  it('should keep the label in the link alongside the icon', () => {
    const wrapper = mountToc([{
      label: 'Networking', scrollTo: jest.fn(), invalid: true
    }]);

    expect(wrapper.find('.toc-parent-link').text()).toStrictEqual('Networking');
  });

  it('should unwrap a computed invalid flag from a registered summary', () => {
    const invalid = computed(() => true);
    const accordions = reactive([{
      label: 'Networking', scrollTo: jest.fn(), invalid
    }]);
    const wrapper = mountToc(accordions);

    expect(wrapper.find(ICON).exists()).toBe(true);
  });
});

describe('component: TableOfContents with useFormSummary', () => {
  const Field = defineComponent({
    props: { invalid: { type: Boolean, default: false } },
    setup(props) {
      useReportInvalidToSection(computed(() => props.invalid));
    },
    template: '<input />',
  });

  // Like CruResource: sections register through useFormSummary and the located entries feed the TOC
  const mountForm = async(invalid: boolean) => {
    const Host = defineComponent({
      components: {
        RcSection, Field, TableOfContents
      },
      setup() {
        const root = ref<HTMLElement | null>(null);
        const { locatedComponents } = useFormSummary(root);

        return {
          root, locatedComponents, fieldInvalid: ref(invalid)
        };
      },
      template: `
        <div>
          <div ref="root">
            <RcSection type="primary" mode="with-header" title="Backups" expandable :expanded="false">
              <Field :invalid="fieldInvalid" />
            </RcSection>
          </div>
          <TableOfContents :accordions="locatedComponents" />
        </div>
      `,
    });

    const wrapper = mount(Host, { global: { directives: { 'clean-tooltip': () => {} } } });

    jest.runAllTimers();
    await nextTick();

    return wrapper;
  };

  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should show the icon for a collapsed section with an invalid field', async() => {
    const wrapper = await mountForm(true);

    expect(wrapper.find(ICON).exists()).toBe(true);
  });

  it('should show the icon once a field in a collapsed section becomes invalid', async() => {
    const wrapper = await mountForm(false);

    expect(wrapper.find(ICON).exists()).toBe(false);

    (wrapper.vm as unknown as { fieldInvalid: boolean }).fieldInvalid = true;
    await nextTick();
    await nextTick();

    expect(wrapper.find(ICON).exists()).toBe(true);
  });
});
