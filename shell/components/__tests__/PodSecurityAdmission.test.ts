import { mount } from '@vue/test-utils';
import PodSecurityAdmission from '@shell/components/PodSecurityAdmission.vue';

describe('component: PodSecurityAdmission', () => {
  describe('handling labels', () => {
    it.each([
      ['true', 'active'],
      ['', 'level'],
      ['', 'version'],
    ])('should display default value %p for input %p', (value, inputId) => {
      const wrapper = mount(PodSecurityAdmission, { propsData: { mode: 'create' } });

      const input = wrapper.find(`[data-testid="pod-security-admission--psaControl-0-${ inputId }"]`).find('input').element as HTMLInputElement;

      expect(input.value).toStrictEqual(value);
    });

    describe.each([
      'pod-security.kubernetes.io/',
      ''
    ])('given prefix %p', (prefix) => {
      it('should map labels to the form control', () => {
        const labels = {
          [`${ prefix }enforce`]:         'baseline',
          [`${ prefix }enforce-version`]: '123'
        };
        const psaControls = {
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
            mode:         'create',
            labels,
            labelsPrefix: prefix
          }
        });

        expect(wrapper.vm.psaControls).toStrictEqual(psaControls);
      });

      it.each([
      // ['true', 'active'],
      // ['baseline', 'level'],
        ['123', 'version'],
      ])('should map labels to the form, with value %p for input %p', (value, inputId) => {
        const labels = {
          [`${ prefix }enforce`]:         'baseline',
          [`${ prefix }enforce-version`]: '123'
        };

        const wrapper = mount(PodSecurityAdmission, {
          propsData: {
            mode:         'create',
            labels,
            labelsPrefix: prefix
          }
        });

        const input = wrapper.find(`[data-testid="pod-security-admission--psaControl-0-${ inputId }"]`).find('input').element as HTMLInputElement;

        expect(input.value).toStrictEqual(value);
      });

      it.each([
      // ['true', 'active'],
      // ['privileged', 'level'],
        ['', 'version'],
      ])('should map labels to the form, using default values if none, with value %p for input %p', (value, inputId) => {
        const labels = {
          [`${ prefix }enforce`]:         '',
          [`${ prefix }enforce-version`]: ''
        };

        const wrapper = mount(PodSecurityAdmission, {
          propsData: {
            mode:         'create',
            labels,
            labelsPrefix: prefix
          }
        });

        const input = wrapper.find(`[data-testid="pod-security-admission--psaControl-0-${ inputId }"]`).find('input').element as HTMLInputElement;

        expect(input.value).toStrictEqual(value);
      });

      describe('changing input values', () => {
        it('should add labels if active', () => {
          const version = '123';
          const newLabels = {
            [`${ prefix }enforce`]:         'privileged',
            [`${ prefix }enforce-version`]: version
          };
          const wrapper = mount(PodSecurityAdmission, {
            propsData: {
              mode:         'create',
              labels:       {},
              labelsPrefix: prefix
            },
            // Unable to toggle the checkbox, so we enforce the data
            data: () => ({
              psaControls: {
                enforce: {
                  active:  true,
                  level:   '',
                  version: ''
                }
              }
            }),
          });

          // Unable to toggle the checkbox, so we use the input
          wrapper.find(`[data-testid="pod-security-admission--psaControl-0-version"]`).find('input').setValue(version);

          expect(wrapper.emitted('updateLabels')![0][0]).toStrictEqual(newLabels);
        });

        it('should remove other labels if not active', () => {
          const labels = {
            [`${ prefix }audit`]:         'privileged',
            [`${ prefix }audit-version`]: 'latest'
          };
          const newLabels = {
            [`${ prefix }enforce`]:         'privileged',
            [`${ prefix }enforce-version`]: 'latest',
          };
          const wrapper = mount(PodSecurityAdmission, {
            propsData: {
              mode:         'create',
              labels,
              labelsPrefix: prefix
            },
            // Unable to toggle the checkbox, so we enforce the data
            data: () => ({
              psaControls: {
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
            psaControls: {
              audit: {
                active:  false,
                level:   '',
                version: ''
              }
            }
          });

          // Unable to toggle the checkbox, so we use the input
          wrapper.find(`[data-testid="pod-security-admission--psaControl-0-version"]`).find('input').setValue('');

          expect(wrapper.emitted('updateLabels')![0][0]).toStrictEqual(newLabels);
        });

        it('should assign default version and level if missing', () => {
          const wrapper = mount(PodSecurityAdmission, {
            propsData: {
              mode:         'create',
              labels:       {},
              labelsPrefix: prefix
            },
            // Unable to toggle the checkbox, so we enforce the data
            data: () => ({
              psaControls: {
                enforce: {
                  active:  true,
                  level:   '',
                  version: ''
                }
              }
            }),
          });
          const newLabels = {
            [`${ prefix }enforce`]:         'privileged',
            [`${ prefix }enforce-version`]: 'latest'
          };

          // Unable to toggle the checkbox, so we use the input
          wrapper.find(`[data-testid="pod-security-admission--psaControl-0-version"]`).find('input').setValue('');

          expect(wrapper.emitted('updateLabels')![0][0]).toStrictEqual(newLabels);
        });
      });
    });
  });

  describe('handling exemptions', () => {
    it.each([
      [['namespace1', 'namespace2'], 'namespace1,namespace2'],
    ])('should map %p to the form control as %p', (exemption, control) => {
      const exemptions = { namespaces: exemption };
      const result = {
        namespaces: {
          active: true,
          value:  control
        },
        runtimeClasses: {
          active: false,
          value:  ''
        },
        usernames: {
          active: false,
          value:  ''
        },
      };

      const wrapper = mount(PodSecurityAdmission, {
        propsData: {
          mode: 'create',
          exemptions,
        }
      });

      expect(wrapper.vm.psaExemptionsControls).toStrictEqual(result);
    });

    it.each([
      // ['true', 'active'],
      ['username', 'value'],
    ])('should map to the form, with value %p for input %p', (value, inputId) => {
      const exemptions = { usernames: [value] };
      const wrapper = mount(PodSecurityAdmission, {
        propsData: {
          mode: 'create',
          exemptions
        }
      });

      const input = wrapper.find(`[data-testid="pod-security-admission--psaExemptionsControl-0-${ inputId }"]`).find('input').element as HTMLInputElement;

      expect(input.value).toStrictEqual(value);
    });

    describe('changing input values', () => {
      it.each([
        ['username1', ['username1']],
        ['username1, username2', ['username1', 'username2']],
        ['username1,username2', ['username1', 'username2']],
      ])('should emit exemption input value %p as %p', (value, exemption) => {
        const exemptions = {
          usernames:      exemption,
          namespaces:     [],
          runtimeClasses: []
        };
        const wrapper = mount(PodSecurityAdmission, {
          propsData: {
            mode: 'create',
            exemptions
          },
        });
        // Unable to toggle the checkbox, so we use the input
        const input = wrapper.find(`[data-testid="pod-security-admission--psaExemptionsControl-0-value"]`).find('input');

        input.setValue(value);

        expect(wrapper.emitted('updateExemptions')![0][0]).toStrictEqual(exemptions);
      });
    });
  });
});
