import { mount } from '@vue/test-utils';
import Security, { FORM_TYPES } from '@shell/components/form/Security.vue';
import { _EDIT } from '@shell/config/query-params';

describe('component: Security', () => {
  describe('formType: container', () => {
    it('should display all the container inputs', () => {
      const wrapper = mount(Security, { props: { mode: _EDIT, formType: FORM_TYPES.CONTAINER } });

      const inputWrappers = wrapper.findAll('[data-testid^=input-security-]');
      const actualIds = inputWrappers.map((wrap) => wrap.attributes('data-testid'));

      const expectedIds = [
        'input-security-privileged',
        'input-security-allowPrivilegeEscalation',
        'input-security-seccompProfile-type',
        'input-security-runasNonRoot',
        'input-security-runAsUser',
        'input-security-readOnlyRootFilesystem',
        'input-security-add',
        'input-security-drop',
      ];

      expect(actualIds).toStrictEqual(expect.arrayContaining(expectedIds));
    });

    it('should hide fields when privileged is checked', async() => {
      const wrapper = mount(Security, { props: { mode: _EDIT, formType: FORM_TYPES.CONTAINER } });

      // Before: Check that the fields are visible
      let allowPrivilegeEscalation = wrapper.find('[data-testid="input-security-allowPrivilegeEscalation"]');
      let seccompProfile = wrapper.find('[data-testid="input-security-seccompProfile-type"]');

      expect(allowPrivilegeEscalation.exists()).toBe(true);
      expect(seccompProfile.exists()).toBe(true);

      // Action: Click the privileged checkbox
      const privilegedCheckbox = wrapper
        .find(`[data-testid="input-security-privileged"]`)
        .find('label');

      await privilegedCheckbox.trigger('click');

      // After: Check that the fields are hidden
      allowPrivilegeEscalation = wrapper.find('[data-testid="input-security-allowPrivilegeEscalation"]');
      seccompProfile = wrapper.find('[data-testid="input-security-seccompProfile-type"]');

      expect(allowPrivilegeEscalation.exists()).toBe(false);
      expect(seccompProfile.exists()).toBe(false);
    });

    it('should display localhostProfile when seccompProfile type is Localhost', async() => {
      const wrapper = mount(Security, {
        props: {
          mode: _EDIT, formType: FORM_TYPES.CONTAINER, seccompProfileTypes: ['None', 'Unconfined', 'RuntimeDefault', 'Localhost']
        }
      });

      // Set seccomp type to 'Localhost'
      const seccompProfile = wrapper.findComponent({ name: 'SeccompProfile' });

      (seccompProfile.vm as any).type = 'Localhost';
      await wrapper.vm.$nextTick();

      const localhostInput = wrapper.find('[data-testid="input-security-seccompProfile-localhostProfile"]');

      expect(localhostInput.exists()).toBe(true);
    });

    it.each([
      'runAsUser',
    ])('should emit an update on %p input', (field) => {
      const wrapper = mount(Security, { props: { mode: _EDIT, formType: FORM_TYPES.CONTAINER } });
      const input = wrapper.find(`[data-testid="input-security-${ field }"]`).find('input');
      const newValue = 123;

      input.setValue(newValue);

      expect(wrapper.emitted('update:value')).toHaveLength(1);
    });

    it.each([
      'privileged',
      'allowPrivilegeEscalation',
      'runasNonRoot',
      'readOnlyRootFilesystem',
    ])('should emit an update on %p checkbox option change', (field) => {
      const wrapper = mount(Security, { props: { mode: _EDIT, formType: FORM_TYPES.CONTAINER } });
      const radioOption = wrapper
        .find(`[data-testid="input-security-${ field }"]`)
        .find('label');

      radioOption.trigger('click');

      expect(wrapper.emitted('update:value')).toHaveLength(1);
    });

    it.each([
      'add',
      'drop',
    ])('should emit an update on %p selection change', async(field) => {
      const wrapper = mount(Security, { props: { mode: _EDIT, formType: FORM_TYPES.CONTAINER } });
      const select = wrapper.find(`[data-testid="input-security-${ field }"]`);

      select.find('button').trigger('click');
      await wrapper.trigger('keydown.down');
      await wrapper.trigger('keydown.enter');

      expect(wrapper.emitted('update:value')).toHaveLength(1);
    });
  });

  describe('formType: pod', () => {
    it('should display all the pod inputs', () => {
      const wrapper = mount(Security, { props: { mode: _EDIT, formType: FORM_TYPES.POD } });

      const inputWrappers = wrapper.findAll('[data-testid^=input-security-]');
      const actualIds = inputWrappers.map((wrap) => wrap.attributes('data-testid'));

      const expectedIds = [
        'input-security-fsGroup',
        'input-security-seccompProfile-type',
        'input-security-runasNonRoot',
        'input-security-runAsUser',
      ];

      expect(actualIds).toStrictEqual(expect.arrayContaining(expectedIds));
    });

    it.each([
      'fsGroup',
      'runAsUser',
    ])('should emit an update on %p input', (field) => {
      const wrapper = mount(Security, { props: { mode: _EDIT, formType: FORM_TYPES.POD } });
      const input = wrapper.find(`[data-testid="input-security-${ field }"]`).find('input');
      const newValue = 123;

      input.setValue(newValue);

      expect(wrapper.emitted('update:value')).toHaveLength(1);
    });
  });
});
