import { mount } from '@vue/test-utils';
import RcSectionBadges from './RcSectionBadges.vue';

// Stub RcStatusBadge to avoid pulling in its full dependency tree
const RcStatusBadgeStub = {
  name:     'RcStatusBadge',
  props:    ['status'],
  template: '<span class="rc-status-badge" :data-status="status"><slot /></span>',
};

describe('component: RcSectionBadges', () => {
  function createWrapper(badges: { label: string; status: string }[]) {
    return mount(RcSectionBadges, {
      props:  { badges },
      global: { stubs: { RcStatusBadge: RcStatusBadgeStub } },
    });
  }

  it('should render all badges when count is within the limit', () => {
    const badges = [
      { label: 'Active', status: 'success' },
      { label: 'Pending', status: 'warning' },
    ];
    const wrapper = createWrapper(badges);
    const rendered = wrapper.findAll('.rc-status-badge');

    expect(rendered).toHaveLength(2);
    expect(rendered[0].text()).toContain('Active');
    expect(rendered[1].text()).toContain('Pending');
  });

  it('should render exactly 3 badges when 3 are provided', () => {
    const badges = [
      { label: 'A', status: 'success' },
      { label: 'B', status: 'warning' },
      { label: 'C', status: 'error' },
    ];
    const wrapper = createWrapper(badges);

    expect(wrapper.findAll('.rc-status-badge')).toHaveLength(3);
  });

  it('should render a maximum of 3 badges when more than 3 are provided', () => {
    const badges = [
      { label: 'A', status: 'success' },
      { label: 'B', status: 'warning' },
      { label: 'C', status: 'error' },
      { label: 'D', status: 'info' },
    ];
    const wrapper = createWrapper(badges);
    const rendered = wrapper.findAll('.rc-status-badge');

    expect(rendered).toHaveLength(3);
    expect(rendered[0].text()).toContain('A');
    expect(rendered[1].text()).toContain('B');
    expect(rendered[2].text()).toContain('C');
  });

  it('should pass the correct status prop to each badge', () => {
    const badges = [
      { label: 'A', status: 'success' },
      { label: 'B', status: 'error' },
    ];
    const wrapper = createWrapper(badges);
    const rendered = wrapper.findAll('.rc-status-badge');

    expect(rendered[0].attributes('data-status')).toBe('success');
    expect(rendered[1].attributes('data-status')).toBe('error');
  });

  it('should render nothing when badges array is empty', () => {
    const wrapper = createWrapper([]);

    expect(wrapper.findAll('.rc-status-badge')).toHaveLength(0);
  });

  it('should render a single badge', () => {
    const wrapper = createWrapper([{ label: 'Only', status: 'info' }]);

    expect(wrapper.findAll('.rc-status-badge')).toHaveLength(1);
    expect(wrapper.find('.rc-status-badge').text()).toContain('Only');
  });

  describe('console warning', () => {
    it('should warn when more than 3 badges are provided', () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      const badges = [
        { label: 'A', status: 'success' },
        { label: 'B', status: 'warning' },
        { label: 'C', status: 'error' },
        { label: 'D', status: 'info' },
      ];

      createWrapper(badges);

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('[RcSectionBadges]: Received 4 badges but only 3 are allowed')
      );

      warnSpy.mockRestore();
    });

    it('should not warn when 3 or fewer badges are provided', () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      const badges = [
        { label: 'A', status: 'success' },
        { label: 'B', status: 'warning' },
        { label: 'C', status: 'error' },
      ];

      createWrapper(badges);

      expect(warnSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('[RcSectionBadges]')
      );

      warnSpy.mockRestore();
    });
  });
});
