<script>
import Wizard from '@/components/Wizard';
import { _CREATE, _EDIT } from '@/config/query-params';
import { mapGetters } from 'vuex';
import Config from '@/edit/auth/ActiveDirectory/Config';
import CustomizeSchema from '@/edit/auth/ActiveDirectory/CustomizeSchema';
import Test from '@/edit/auth/ActiveDirectory/Test';
import AsyncButton from '@/components/AsyncButton';
import Banner from '@/components/Banner';
import ChooseProvider from '@/edit/auth/ChooseProvider';

export default {
  components: {
    Wizard,
    ChooseProvider,
    Config,
    CustomizeSchema,
    Test,
    AsyncButton,
    Banner
  },

  props: {
    mode: {
      type:    String,
      default: _CREATE
    },

    providers: {
      type:     Array,
      required: true
    },

    value: {
      type:     Object,
      default: () => {
        return {};
      }
    }
  },

  data() {
    const t = this.$store.getters['i18n/t'];
    let steps;

    try {
      steps = this.value.wizardSteps(t);
    } catch {
      steps = [
        {
          name:   'choose',
          label:  t('auth.chooseProvider'),
          ready:  false
        },
        {
          name:   'config',
          label:  t('auth.LDAP.steps.config'),
          ready:  false,
        },
        {
          name:   'schema',
          label:  t('auth.LDAP.steps.schema'),
          ready:  true,
        },
        {
          name:   'test',
          label:  t('auth.LDAP.steps.test'),
          ready:  false
        },
      ];
    }

    if (this.mode === _EDIT) {
      steps.forEach((step) => {
        step.ready = true;
      });
      this.activeStep = steps[1];
    }

    return {
      steps, chosenProvider: this.value, error: null
    };
  },

  computed: {
    enabledProvider() {
      return (this.providers.filter(provider => provider.enabled) || [])[0];
    },

    schema() {
      return this.chosenProvider ? this.$store.getters['rancher/schemaFor'](this.chosenProvider.type) : {};
    },

    activeStep() {
      return this.steps[this.$route.query.step - 1] || {};
    },

    ...mapGetters({ t: 'i18n/t' })
  },

  watch: {
    chosenProvider(neu, old) {
      if (neu && neu?.type !== old?.type) {
        // TODO put other provider-specifc steps in models
        this.steps = neu.wizardSteps(this.t);
        this.steps[0].ready = true;
      }
      this.$emit('input', neu);
    }
  },

  methods: {
    async  test(buttonDone) {
      // TODO put other provider-specific test actions in models
      try {
        const res = await this.chosenProvider.test(this.value.username, this.value.password);

        if (res._status === 200) {
          buttonDone(true);
          this.steps[3].ready = true;
        } else {
          this.error = res.message;
          buttonDone(false);
        }
      } catch (e) {
        this.error = e.message;
        buttonDone(false);
      }
    },

    clearError() {
      if (this.error) {
        setTimeout(() => {
          this.error = null;
        }, 3000);
      }
    },

    cancel() {
      this.chosenProvider = null;
      this.steps[0].ready = false;
      this.$emit('canceled');
    },
  },

};
</script>

<template>
  <div @input="clearError">
    <Wizard :key="(chosenProvider||{}).type" ref="wizard" :steps="steps" @cancel="cancel" @finish="$emit('finish')">
      <template #choose>
        <ChooseProvider v-model="chosenProvider" :providers="providers" />
      </template>
      <template #config>
        <Config :value="chosenProvider" :mode="mode" :schema="schema" @ready="e=>steps[1].ready=e" />
      </template>
      <template #schema>
        <CustomizeSchema :schema="schema" :value="chosenProvider" :mode="mode" />
      </template>
      <template #test>
        <Test :value="value" />
      </template>

      <template v-if="activeStep.name==='test' && !activeStep.ready" #finish>
        <AsyncButton :action-label="t('auth.testEnable')" :delay="2000" mode="enable" class="btn role-primary" @click="test" />
      </template>
    </Wizard>

    <Banner v-if="error" color="error" :label="error" />
  </div>
</template>
