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

      const input = wrapper.find(`[data-testid="pod-security-admission--control-0-${ inputId }"]`).find('input').element as HTMLInputElement;

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
            mode:         'create',
            labels,
            labelsPrefix: prefix
          }
        });

        expect(wrapper.vm.controls).toStrictEqual(controls);
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

        const input = wrapper.find(`[data-testid="pod-security-admission--control-0-${ inputId }"]`).find('input').element as HTMLInputElement;

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

        const input = wrapper.find(`[data-testid="pod-security-admission--control-0-${ inputId }"]`).find('input').element as HTMLInputElement;

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
          wrapper.find(`[data-testid="pod-security-admission--control-0-version"]`).find('input').setValue(version);

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
          wrapper.find(`[data-testid="pod-security-admission--control-0-version"]`).find('input').setValue('');

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
            [`${ prefix }enforce`]:         'privileged',
            [`${ prefix }enforce-version`]: 'latest'
          };

          // Unable to toggle the checkbox, so we use the input
          wrapper.find(`[data-testid="pod-security-admission--control-0-version"]`).find('input').setValue('');

          expect(wrapper.emitted('updateLabels')![0][0]).toStrictEqual(newLabels);
        });
      });
    });
  });

  describe('handling exceptions', () => {
    it('should map exemptions to the form exceptions', () => {
      const exemptions = { runtimeClasses: ['123'] };
      const exceptions = {
        usernames: {
          active: false,
          value:  ''
        },
        runtimeClasses: {
          active: true,
          value:  '123'
        },
        namespaces: {
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

      expect(wrapper.vm.exceptions).toStrictEqual(exceptions);
    });

    it.each([
      // ['true', 'active'],
      ['123', 'value'],
    ])('should map exemption to the form, with value %p for input %p', (value, inputId) => {
      const exemptions = { usernames: [value] };
      const wrapper = mount(PodSecurityAdmission, {
        propsData: {
          mode: 'create',
          exemptions
        }
      });

      const input = wrapper.find(`[data-testid="pod-security-admission--exception-0-${ inputId }"]`).find('input').element as HTMLInputElement;

      expect(input.value).toStrictEqual(value);
    });

    describe('changing input values', () => {
      it.each([
        ['123', ['123']],
        ['123, 456', ['123', '456']],
        ['', []],
      ])('should update exemption value', (value, exemption) => {
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
        wrapper.find(`[data-testid="pod-security-admission--exception-0-value"]`).find('input').setValue(value);

        expect(wrapper.emitted('updateExemptions')![0][0]).toStrictEqual(exemptions);
      });
    });
  });
});
