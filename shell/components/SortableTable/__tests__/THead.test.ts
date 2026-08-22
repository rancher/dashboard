import { shallowMount } from '@vue/test-utils';
import { Checkbox } from '@components/Form/Checkbox';
import THead from '@shell/components/SortableTable/THead.vue';

describe('component: THead', () => {
  const requiredProps = {
    columns:         [],
    sortBy:          'name',
    tableActions:    true,
    rowActions:      false,
    rowActionsWidth: 40,
    howMuchSelected: 'none',
    labelFor:        (col: { name: string }) => col.name,
  };

  const mountTHead = (props = {}) => shallowMount(THead, {
    props:  { ...requiredProps, ...props },
    global: { mocks: { t: (key: string) => key } },
  });

  describe('select all checkbox', () => {
    it('should use the label provided by the parent table', () => {
      const wrapper = mountTHead({ selectAllLabel: 'Select all Projects/Namespaces' });

      const checkbox = wrapper.findComponent(Checkbox);

      expect(checkbox.props('alternateLabel')).toBe('Select all Projects/Namespaces');
    });

    it.each([
      ['no label is provided', undefined],
      ['an empty label is provided', ''],
    ])('should fall back to the generic label when %s', (_, selectAllLabel) => {
      const wrapper = mountTHead({ selectAllLabel });

      const checkbox = wrapper.findComponent(Checkbox);

      expect(checkbox.props('alternateLabel')).toBe('sortableTable.genericGroupCheckbox');
    });

    it('should not be rendered when the table has no table actions', () => {
      const wrapper = mountTHead({ tableActions: false, selectAllLabel: 'Select all Namespaces' });

      expect(wrapper.findComponent(Checkbox).exists()).toBe(false);
    });
  });
});
