import { mount } from '@vue/test-utils';
import MemberPermissionGroup, { MemberPermissionOption } from '@shell/components/form/Members/MemberPermissionGroup.vue';
import { RadioButton } from '@components/Form/Radio';
import { waitForTooltip } from '@shell/directives/__tests__/utils/tooltip';

describe('component: MemberPermissionGroup', () => {
  const options: MemberPermissionOption[] = [
    {
      label:       'Owner',
      description: 'Full control',
      value:       'owner',
    },
    {
      label:       'Member',
      description: 'Standard access',
      value:       'member',
    },
    {
      label:       'Locked Role',
      description: 'Locked role description',
      value:       'locked-role',
      disabled:    true,
      locked:      true,
      tooltip:     'This role is locked.',
    },
    {
      label:       'Custom',
      description: 'Custom permissions',
      value:       'custom',
    },
  ];

  it('disables locked options, renders a focusable lock tooltip, and includes the locked reason in aria-label', async() => {
    const wrapper = mount(MemberPermissionGroup, {
      attachTo: document.body,
      props:    { value: 'member', options },
    });

    const buttons = wrapper.findAllComponents(RadioButton);
    const lockedRadio = buttons.find((r) => r.props('val') === 'locked-role');
    const memberRadio = buttons.find((r) => r.props('val') === 'member');

    expect(memberRadio?.props('disabled')).toStrictEqual(false);
    expect(lockedRadio?.props('disabled')).toStrictEqual(true);
    expect(lockedRadio?.find('span[role="radio"]').attributes('aria-label')).toStrictEqual('Locked Role (This role is locked.)');

    const tooltipBtn = lockedRadio?.find('button.rc-icon-tooltip');

    expect(tooltipBtn?.exists()).toStrictEqual(true);
    expect(tooltipBtn?.find('i.icon-lock').exists()).toStrictEqual(true);

    tooltipBtn?.element.dispatchEvent(new FocusEvent('focus'));
    await waitForTooltip();

    expect(document.querySelector('.v-popper__popper--shown')?.textContent?.trim()).toStrictEqual('This role is locked.');

    await lockedRadio?.find('label.radio-container').trigger('click');

    expect(wrapper.emitted('update:value')).toBeUndefined();
    wrapper.unmount();
  });

  it('skips locked options during keyboard arrow navigation', async() => {
    const wrapper = mount(MemberPermissionGroup, {
      attachTo: document.body,
      props:    { value: 'member', options },
    });

    const group = wrapper.find('[role="radiogroup"]');

    (group.element as HTMLElement).focus();
    await group.trigger('keydown.down');

    expect(wrapper.emitted('update:value')?.[0]).toStrictEqual(['custom']);
    wrapper.unmount();
  });

  it('emits update:value when an unlocked option is clicked', async() => {
    const wrapper = mount(MemberPermissionGroup, { props: { value: 'member', options } });

    const ownerRadio = wrapper.findAllComponents(RadioButton).find((r) => r.props('val') === 'owner');

    await ownerRadio?.find('label.radio-container').trigger('click');

    expect(wrapper.emitted('update:value')?.[0]).toStrictEqual(['owner']);
  });
});
