import { mount } from '@vue/test-utils';
import PodSecurityAdmission from '@shell/components/PodSecurityAdmission.vue';

describe('component: PodSecurityAdmission', () => {
  it.each([
    ['updateLabels', {
      audit:             'privileged',
      'audit-version':   'latest',
      enforce:           'privileged',
      'enforce-version': 'latest',
      warn:              'privileged',
      'warn-version':    'latest',
    }],
    ['updateExemptions', {
      namespaces: [], runtimeClasses: [], usernames: []
    }]
  ])('should emit %p and exemptions on creation if labels always active', (emission, value) => {
    const wrapper = mount(PodSecurityAdmission, { props: { mode: 'create', labelsAlwaysActive: true } });

    expect(wrapper.emitted(emission)![0][0]).toStrictEqual(value);
  });

  describe('handling labels', () => {
    it.each([
      ['true', 'active'],
      ['', 'level'],
      ['', 'version'],
    ])('should display default value %p for input %p', (value, inputId) => {
      const wrapper = mount(PodSecurityAdmission, { props: { mode: 'edit' } });

      const input = wrapper.find(`[data-testid="pod-security-admission--psaControl-0-${ inputId }"]`);
      let element;

      if (inputId === 'version') {
        element = input.element;
      } else {
        element = input.find('input').element;
      }

      expect(element.value).toStrictEqual(value);
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
          props: {
            mode:         'edit',
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
          props: {
            mode:         'edit',
            labels,
            labelsPrefix: prefix
          }
        });

        const input = wrapper.find(`[data-testid="pod-security-admission--psaControl-0-${ inputId }"]`).element as HTMLInputElement;

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
          props: {
            mode:         'edit',
            labels,
            labelsPrefix: prefix
          }
        });

        const input = wrapper.find(`[data-testid="pod-security-admission--psaControl-0-${ inputId }"]`).element as HTMLInputElement;

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
            props: {
              mode:         'edit',
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
          wrapper.find(`[data-testid="pod-security-admission--psaControl-0-version"]`).setValue(version);

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
            props: {
              mode:         'edit',
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
          wrapper.find(`[data-testid="pod-security-admission--psaControl-0-version"]`).setValue('');

          expect(wrapper.emitted('updateLabels')![0][0]).toStrictEqual(newLabels);
        });

        it('should assign default version and level if missing', () => {
          const wrapper = mount(PodSecurityAdmission, {
            props: {
              mode:         'edit',
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
          wrapper.find(`[data-testid="pod-security-admission--psaControl-0-version"]`).setValue('');

          expect(wrapper.emitted('updateLabels')![0][0]).toStrictEqual(newLabels);
        });
      });
    });

    describe.each(['level', 'version'])('should keep always %p enabled', (inputId) => {
      it('given labelsAlwaysActive true and no labels', () => {
        const wrapper = mount(PodSecurityAdmission, {
          props: {
            mode:               'edit',
            labelsAlwaysActive: true,
            labels:             {}
          },
        });

        const input = wrapper.find(`[data-testid="pod-security-admission--psaControl-0-${ inputId }"]`);
        let element;

        if (inputId === 'version') {
          element = input.element;
        } else {
          element = input.find('input').element;
        }

        expect(element.disabled).toBe(false);
      });

      it('given existing values', () => {
        const wrapper = mount(PodSecurityAdmission, {
          props: {
            mode:   'edit',
            labels: {
              [`enforce`]:         'baseline',
              [`enforce-version`]: '123'
            }
          },
        });

        const input = wrapper.find(`[data-testid="pod-security-admission--psaControl-0-${ inputId }"]`);
        let element;

        if (inputId === 'version') {
          element = input.element;
        } else {
          element = input.find('input').element;
        }

        expect(element.disabled).toBe(false);
      });
    });

    describe.each(['level', 'version'])('should keep always %p disabled', (inputId) => {
      it('given labelsAlwaysActive false and no labels', () => {
        const wrapper = mount(PodSecurityAdmission, {
          props: {
            mode:               'edit',
            labelsAlwaysActive: false,
            labels:             {}
          },
        });

        const input = wrapper.find(`[data-testid="pod-security-admission--psaControl-0-${ inputId }"]`);
        let element;

        if (inputId === 'version') {
          element = input.element;
        } else {
          element = input.find('input').element;
        }

        expect(element.disabled).toBe(true);
      });

      it('given disabled active status', () => {
        const wrapper = mount(PodSecurityAdmission, {
          props: { mode: 'edit' },
          data:  () => ({
            psaControls: {
              enforce: {
                active:  false,
                level:   '',
                version: ''
              }
            }
          }),
        });

        const input = wrapper.find(`[data-testid="pod-security-admission--psaControl-0-${ inputId }"]`);
        let element;

        if (inputId === 'version') {
          element = input.element;
        } else {
          element = input.find('input').element;
        }

        expect(element.disabled).toBe(true);
      });

      it('given view mode and provided labels', () => {
        const wrapper = mount(PodSecurityAdmission, {
          props: {
            mode:   'view',
            labels: {
              [`enforce`]:         'baseline',
              [`enforce-version`]: '123'
            }
          },
        });

        const input = wrapper.find(`[data-testid="pod-security-admission--psaControl-0-${ inputId }"]`);
        let element;

        if (inputId === 'version') {
          element = input.element;
        } else {
          element = input.find('input').element;
        }

        expect(element.disabled).toBe(true);
      });
    });

    it.each([
      [true, false],
    ])('should display the checkbox %p', (value) => {
      const wrapper = mount(PodSecurityAdmission, {
        props: {
          mode:               'edit',
          labelsAlwaysActive: value
        }
      });

      const input = wrapper.find(`[data-testid="pod-security-admission--psaControl-0-active"]`).exists();

      expect(!input).toBe(value);
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
        props: {
          mode: 'edit',
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
        props: {
          mode: 'edit',
          exemptions
        }
      });

      const input = wrapper.find(`[data-testid="pod-security-admission--psaExemptionsControl-0-${ inputId }"]`).element as HTMLInputElement;

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
          props: {
            mode: 'edit',
            exemptions
          },
        });
        // Unable to toggle the checkbox, so we use the input
        const input = wrapper.find(`[data-testid="pod-security-admission--psaExemptionsControl-0-value"]`);

        input.setValue(value);

        expect(wrapper.emitted('updateExemptions')![0][0]).toStrictEqual(exemptions);
      });
    });
  });
});
