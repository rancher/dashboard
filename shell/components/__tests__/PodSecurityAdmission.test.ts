import { mount } from '@vue/test-utils';
import PodSecurityAdmission from '@shell/components/PodSecurityAdmission.vue';

describe('component: PodSecurityAdmission', () => {
  it.each([
    ['true', 'active'],
    ['', 'level'],
    ['', 'version'],
  ])('should display default value %p for input %p', (value, inputId) => {
    const wrapper = mount(PodSecurityAdmission, { propsData: { mode: 'create' } });

    const input = wrapper.find(`[data-testid="pod-security-admission--0-${ inputId }"]`).find('input').element as HTMLInputElement;

    expect(input.value).toStrictEqual(value);
  });

  it('should map labels to the form control', () => {
    const labels = {
      'pod-security.kubernetes.io/enforce':         'baseline',
      'pod-security.kubernetes.io/enforce-version': '123'
    };
    const controls = {
      audit: {
        active:  false,
        level:   'privileged',
        version: ''
      },
      enforce: {
        active:  true,
        level:   'baseline',
        version: '123'
      },
      warn: {
        active:  false,
        level:   'privileged',
        version: ''
      },
    };

    const wrapper = mount(PodSecurityAdmission, {
      propsData: {
        mode: 'create',
        labels
      }
    });

    expect(wrapper.vm.controls).toStrictEqual(controls);
  });

  it.each([
    // ['true', 'active'],
    ['baseline', 'level'],
    // ['123', 'version'],
  ])('should map labels to the form, with value %p for input %p', (value, inputId) => {
    const labels = {
      'pod-security.kubernetes.io/enforce':         'baseline',
      'pod-security.kubernetes.io/enforce-version': '123'
    };

    const wrapper = mount(PodSecurityAdmission, {
      propsData: {
        mode: 'create',
        labels
      }
    });

    const input = wrapper.find(`[data-testid="pod-security-admission--0-${ inputId }"]`).find('input').element as HTMLInputElement;

    expect(input.value).toStrictEqual(value);
  });

  it.each([
    // ['true', 'active'],
    // ['privileged', 'level'],
    ['', 'version'],
  ])('should map labels to the form, using default values if none, with value %p for input %p', (value, inputId) => {
    const labels = {
      'pod-security.kubernetes.io/enforce':         '',
      'pod-security.kubernetes.io/enforce-version': ''
    };

    const wrapper = mount(PodSecurityAdmission, {
      propsData: {
        mode: 'create',
        labels
      }
    });

    const input = wrapper.find(`[data-testid="pod-security-admission--0-${ inputId }"]`).find('input').element as HTMLInputElement;

    expect(input.value).toStrictEqual(value);
  });

  describe('changing input values', () => {
    it('should add labels if active', () => {
      const version = '123';
      const newLabels = {
        'pod-security.kubernetes.io/enforce':         'privileged',
        'pod-security.kubernetes.io/enforce-version': version
      };
      const wrapper = mount(PodSecurityAdmission, {
        propsData: {
          mode:   'create',
          labels: {}
        },
        // Unable to toggle the checkbox, so we enforce the data
        data: () => ({
          controls: {
            enforce: {
              active:  true,
              level:   '',
              version: ''
            }
          }
        }),
      });

      // Unable to toggle the checkbox, so we use the input
      wrapper.find(`[data-testid="pod-security-admission--0-version"]`).find('input').setValue(version);

      expect(wrapper.emitted('updateLabels')![0][0]).toStrictEqual(newLabels);
    });

    it('should remove other labels if not active', () => {
      const labels = {
        'pod-security.kubernetes.io/audit':         'privileged',
        'pod-security.kubernetes.io/audit-version': 'latest'
      };
      const newLabels = {
        'pod-security.kubernetes.io/enforce':         'privileged',
        'pod-security.kubernetes.io/enforce-version': 'latest',
      };
      const wrapper = mount(PodSecurityAdmission, {
        propsData: {
          mode: 'create',
          labels
        },
        // Unable to toggle the checkbox, so we enforce the data
        data: () => ({
          controls: {
            enforce: {
              active:  true,
              level:   '',
              version: ''
            }
          }
        }),
      });

      // Unable to toggle the checkbox, so we enforce the data
      wrapper.setData({
        controls: {
          audit: {
            active:  false,
            level:   '',
            version: ''
          }
        }
      });

      // Unable to toggle the checkbox, so we use the input
      wrapper.find(`[data-testid="pod-security-admission--0-version"]`).find('input').setValue('');

      expect(wrapper.emitted('updateLabels')![0][0]).toStrictEqual(newLabels);
    });

    it('should assign default version and level if missing', () => {
      const wrapper = mount(PodSecurityAdmission, {
        propsData: {
          mode:   'create',
          labels: {}
        },
        // Unable to toggle the checkbox, so we enforce the data
        data: () => ({
          controls: {
            enforce: {
              active:  true,
              level:   '',
              version: ''
            }
          }
        }),
      });
      const newLabels = {
        'pod-security.kubernetes.io/enforce':         'privileged',
        'pod-security.kubernetes.io/enforce-version': 'latest'
      };

      // Unable to toggle the checkbox, so we use the input
      wrapper.find(`[data-testid="pod-security-admission--0-version"]`).find('input').setValue('');

      expect(wrapper.emitted('updateLabels')![0][0]).toStrictEqual(newLabels);
    });
  });
});
