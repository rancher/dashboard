import { mount } from '@vue/test-utils';
import { _EDIT, _VIEW } from '@shell/config/query-params';
import SSHKnownHosts from '@shell/components/form/SSHKnownHosts/index.vue';

describe('component: SSHKnownHosts', () => {
  it.each([
    ['0 entities', '', 0],
    ['0 entities (multiple empty lines)', '\n  \n  \n', 0],
    ['1 entity', 'line1\n', 1],
    ['1 entity (multiple empty lines)', 'line1\n\n\n', 1],
    ['2 entities', 'line1\nline2\n', 2],
    ['2 entities (multiple empty lines)', 'line1\n  \n  line2\n \n', 2],
  ])('mode view: summary should be: %p', (_, value, entities) => {
    const wrapper = mount(SSHKnownHosts, {
      props: {
        mode: _VIEW,
        value,
      }
    });

    const knownSshHostsSummary = wrapper.find('[data-testid="input-known-ssh-hosts_summary"]');
    const knownSshHostsOpenDialog = wrapper.findAll('[data-testid="input-known-ssh-hosts_open-dialog"]');

    expect(wrapper.vm.entries).toBe(entities);
    expect(knownSshHostsSummary.element).toBeDefined();
    expect(knownSshHostsOpenDialog).toHaveLength(0);
  });

  it('mode edit: should display summary and edit button', () => {
    const wrapper = mount(SSHKnownHosts, {
      props: {
        mode:  _EDIT,
        value: 'line1\nline2\n',
      }
    });

    const knownSshHostsSummary = wrapper.find('[data-testid="input-known-ssh-hosts_summary"]');
    const knownSshHostsOpenDialog = wrapper.find('[data-testid="input-known-ssh-hosts_open-dialog"]');

    expect(knownSshHostsSummary.element).toBeDefined();
    expect(knownSshHostsOpenDialog.element).toBeDefined();
  });

  it('mode edit: should open edit dialog', async() => {
    const wrapper = mount(SSHKnownHosts, {
      props: {
        mode:  _EDIT,
        value: '',
      }
    });

    const knownSshHostsOpenDialog = wrapper.find('[data-testid="input-known-ssh-hosts_open-dialog"]');
    const editDialog = wrapper.vm.$refs['editDialog'] as any;

    await knownSshHostsOpenDialog.trigger('click');

    expect(editDialog.showModal).toBe(true);
  });
});
