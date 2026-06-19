import { shallowMount } from '@vue/test-utils';
import ButtonGroup from '@shell/components/ButtonGroup.vue';

describe('component: ButtonGroup', () => {
  it('should render component with the default props correctly', () => {
    const options = [
      {
        label: 'label1',
        value: 'val1'
      },
      {
        label: 'label2',
        value: 'val2'
      },
      {
        label: 'label3',
        value: 'val3'
      },
    ];

    const wrapper = shallowMount(ButtonGroup, {
      props: {
        options,
        value: 'val1'
      }
    });

    const firstBtn = wrapper.find('[data-testid="button-group-child-0"]');
    const firstBtnLabel = wrapper.find('[data-testid="button-group-child-0"] span');
    const secondBtn = wrapper.find('[data-testid="button-group-child-1"]');
    const secondBtnLabel = wrapper.find('[data-testid="button-group-child-1"] span');
    const thirdBtn = wrapper.find('[data-testid="button-group-child-2"]');

    expect(wrapper.findAll('button')).toHaveLength(3);
    expect(firstBtn.exists()).toBe(true);
    expect(firstBtn.attributes().type).toBe('button');
    expect(firstBtn.classes()).toContain('btn');
    expect(firstBtn.classes()).toContain('bg-primary');
    expect(secondBtn.classes()).toContain('bg-disabled');
    expect(thirdBtn.classes()).toContain('bg-disabled');

    expect(firstBtnLabel.text()).toBe('label1');
    expect(secondBtnLabel.text()).toBe('label2');
  });

  it('should render component with icon correctly', () => {
    const options = [
      {
        label: 'label1',
        value: 'val1',
        icon:  'some-icon'
      },
      {
        label: 'label2',
        value: 'val2'
      },
      {
        label: 'label3',
        value: 'val3'
      },
    ];

    const wrapper = shallowMount(ButtonGroup, {
      props: {
        options,
        activeClass:   'bg-another-active-class',
        inactiveClass: 'bg-some-inactive-class',
        iconSize:      'xxxxl',
        value:         'val1'
      }
    });

    const firstBtn = wrapper.find('[data-testid="button-group-child-0"]');
    const firstBtnIcon = wrapper.find('[data-testid="button-group-child-0"] i');
    const firstBtnLabel = wrapper.find('[data-testid="button-group-child-0"] span');
    const secondBtn = wrapper.find('[data-testid="button-group-child-1"]');

    expect(wrapper.findAll('button')).toHaveLength(3);

    expect(firstBtn.classes()).toContain('bg-another-active-class');
    expect(secondBtn.classes()).toContain('bg-some-inactive-class');

    expect(firstBtnLabel.exists()).toBe(true);
    expect(firstBtnIcon.exists()).toBe(true);

    expect(firstBtnIcon.classes()).toContain('icon');
    expect(firstBtnIcon.classes()).toContain('some-icon');
    expect(firstBtnIcon.classes()).toContain('icon-xxxxl');
  });

  it('clicking on button should emit event "input"', () => {
    const options = [
      {
        label: 'label1',
        value: 'val1'
      },
      {
        label: 'label2',
        value: 'val2'
      },
      {
        label: 'label3',
        value: 'val3'
      },
    ];

    const wrapper = shallowMount(ButtonGroup, {
      props: {
        options,
        value: 'val1'
      }
    });

    const firstBtn = wrapper.find('[data-testid="button-group-child-0"]');

    firstBtn.trigger('click');

    expect(wrapper.emitted('update:value')).toHaveLength(1);
    expect(wrapper.emitted('update:value')![0][0]).toBe('val1');
  });

  it.each([
    ['small', 'btn-sm'],
    ['medium', 'btn-md'],
  ])('should apply the size class to each button when size is %s', (size, sizeClass) => {
    const options = [
      {
        label: 'label1',
        value: 'val1'
      },
      {
        label: 'label2',
        value: 'val2'
      },
    ];

    const wrapper = shallowMount(ButtonGroup, {
      props: {
        options,
        value: 'val1',
        size
      }
    });

    const buttons = wrapper.findAll('button');

    expect(buttons).toHaveLength(2);
    buttons.forEach((button) => {
      expect(button.classes()).toContain(sizeClass);
    });
  });

  it.each([
    [undefined],
    ['large'],
  ])('should not apply a size class when size is %s', (size) => {
    const options = [
      {
        label: 'label1',
        value: 'val1'
      },
    ];

    const wrapper = shallowMount(ButtonGroup, {
      props: {
        options,
        value: 'val1',
        ...(size ? { size } : {})
      }
    });

    const button = wrapper.find('button');

    expect(button.classes()).not.toContain('btn-sm');
    expect(button.classes()).not.toContain('btn-md');
  });
});
