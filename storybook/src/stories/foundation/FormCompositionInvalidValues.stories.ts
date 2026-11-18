import type { Meta, StoryObj } from '@storybook/vue3';
import { ref } from 'vue';
import LabeledInput from '@/pkg/rancher-components/src/components/Form/LabeledInput/LabeledInput.vue';
import { useFormValidation } from '@shell/composables/useFormValidation';

const meta: Meta = {};

export default meta;
type Story = StoryObj;

let storeT: any; // This seems to be a Storybook bug not allowing hooks

export const Default: Story = {
  render: () => ({
    components: { LabeledInput },
    setup() {
      // Rules are resolved when the template renders, after `created` has set storeT
      const t = (key: string, args?: any) => storeT(key, args);
      const {
        getRules, isFormValid, validateForm, veeErrors
      } = useFormValidation(t, [
        {
          path: 'name', rules: ['required', 'subDomain'], translationKey: 'nameNsDescription.name.label'
        },
        {
          path: 'certificate', rules: ['required', 'pemCertificate'], translationKey: 'secret.certificate.certificate'
        },
      ]);

      return {
        name:        ref(''),
        certificate: ref(''),
        submitted:   ref(false),
        getRules,
        isFormValid,
        validateForm,
        veeErrors,
      };
    },
    created() {
      storeT = this.$store.getters['i18n/t']; // This seems to be a Storybook bug not allowing hooks
    },
    methods: {
      async submit() {
        const { valid } = await this.validateForm();

        this.submitted = valid;
      }
    },
    template: `
      <LabeledInput
        v-model:value="name"
        name="name"
        label="Name"
        placeholder="e.g. my-secret"
        required
        :rules="getRules('name')"
      />
      <br />
      <LabeledInput
        v-model:value="certificate"
        name="certificate"
        type="multiline"
        label="Certificate"
        placeholder="Paste a certificate starting with -----BEGIN CERTIFICATE-----"
        required
        :rules="getRules('certificate')"
      />
      <br />
      <button
        class="btn role-primary"
        type="button"
        data-testid="form-create"
        :disabled="!isFormValid"
        @click="submit"
      >
        Create
      </button>
      <span v-if="submitted" class="ml-10 text-success">Submitted</span>
      <br />
      <br />
      <details open>
        <summary>Errors</summary>
        <pre>{{ veeErrors }}</pre>
      </details>
    `,
  }),
};
