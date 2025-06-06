import { mount } from '@vue/test-utils';
import RcItemCard from '@shell/components/cards/RcItemCard.vue';

const id = 'test';

const baseProps = {
  id,
  value:  { someProperty: 'some-value' },
  image:  { src: 'logo.png', alt: { text: 'Logo' } },
  header: {
    title:    { text: 'Card Title' },
    statuses: [
      { icon: 'icon-one', tooltip: { text: 'Status One' } },
      { icon: 'icon-two' }
    ]
  },
  content: { text: 'Card description here' }
};

describe('rcItemCard', () => {
  it('renders title, image, and content', () => {
    const wrapper = mount(RcItemCard, { props: baseProps });

    expect(wrapper.get('[data-testid="item-card-header-title"]').text()).toBe('Card Title');
    expect(wrapper.get('[data-testid="item-card-content"]').text()).toContain('Card description here');
    expect(wrapper.get('[data-testid="item-card-image"]')).toBeTruthy();
    expect(wrapper.findAll(`[data-testid="item-card-header-statuses-status"]`)).toHaveLength(2);
  });

  it('renders pill only in medium variant', () => {
    const wrapper = mount(RcItemCard, {
      props: {
        ...baseProps,
        variant: 'medium',
        pill:    { label: { text: 'Installed' } }
      }
    });

    expect(wrapper.get('[data-testid="item-card-pill"]').text()).toBe('Installed');

    // now test that it's not rendered when variant is small
    const wrapperSmall = mount(RcItemCard, {
      props: {
        ...baseProps,
        variant: 'small',
        pill:    { label: { text: 'Installed' } }
      }
    });

    expect(wrapperSmall.find('[data-testid="item-card-pill"]').exists()).toBe(false);
  });

  it('emits card-click when clicked and clickable', async() => {
    const wrapper = mount(RcItemCard, {
      props: {
        ...baseProps,
        clickable: true
      }
    });

    await wrapper.trigger('click');

    const emitted = wrapper.emitted('card-click');

    expect(emitted).toBeTruthy();
    expect(emitted?.[0]).toStrictEqual([{ someProperty: 'some-value' }]);
  });

  it('does not emit card-click when clicking on .no-card-click', async() => {
    const wrapper = mount(RcItemCard, {
      props: {
        ...baseProps,
        clickable: true
      },
      slots: { 'item-card-actions': '<button class="no-card-click">Actions</button>' }
    });

    await wrapper.find('.no-card-click').trigger('click');

    expect(wrapper.emitted('card-click')).toBeFalsy();
  });

  it('sets role and tabindex when clickable', () => {
    const wrapper = mount(RcItemCard, {
      props: {
        ...baseProps,
        clickable: true
      }
    });

    const root = wrapper.get(`[data-testid="item-card-${ id }"]`);

    expect(root.attributes('role')).toBe('button');
    expect(root.attributes('tabindex')).toBe('0');
  });

  it('does not set role or tabindex when not clickable', () => {
    const wrapper = mount(RcItemCard, {
      props: {
        ...baseProps,
        clickable: false
      }
    });

    const root = wrapper.get(`[data-testid="item-card-${ id }"]`);

    expect(root.attributes('role')).toBeUndefined();
    expect(root.attributes('tabindex')).toBeUndefined();
  });

  it('supports keyboard enter to trigger click', async() => {
    const wrapper = mount(RcItemCard, {
      props: {
        ...baseProps,
        clickable: true
      }
    });

    await wrapper.trigger('keydown.enter');
    expect(wrapper.emitted('card-click')).toBeTruthy();
  });

  it('supports slot for footer and sub-header', () => {
    const wrapper = mount(RcItemCard, {
      props: baseProps,
      slots: {
        'item-card-footer':     '<div>FooterContent</div>',
        'item-card-sub-header': '<div>SubHeaderContent</div>'
      }
    });

    expect(wrapper.text()).toContain('FooterContent');
    expect(wrapper.text()).toContain('SubHeaderContent');
  });

  it('renders icon with custom color', () => {
    const wrapper = mount(RcItemCard, {
      props: {
        ...baseProps,
        header: {
          ...baseProps.header,
          statuses: [
            { icon: 'icon-custom', customColor: 'red' }
          ]
        }
      }
    });

    const icon = wrapper.get('[data-testid="item-card-header-status-0"]');

    expect(icon.attributes('style')).toContain('color: red');
  });
});
