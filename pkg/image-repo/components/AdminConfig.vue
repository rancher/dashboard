<template>
  <div>
    <h3>
      {{ t('harborConfig.access.title') }}
      <!-- <i
        v-clean-tooltip="t('harborConfig.access.subtitle')"
        class="icon icon-info icon-lg"
      /> -->
    </h3>
    <p class="mb-20">
      {{ t('harborConfig.access.subtitle') }}
    </p>
    <div>
      <div class="row mb-20">
        <div class="col span-12">
          <LabeledInput
            v-model.trim="harborConfig.url"
            :mode="mode"
            :label="t('harborConfig.form.address.label')"
            :placeholder="t('harborConfig.form.address.placeholder')"
            required
          />
        </div>
      </div>
      <div class="row mb-20">
        <div class="col span-6">
          <LabeledInput
            v-model.trim="harborConfig.username"
            :mode="mode"
            :label="t('harborConfig.form.username.label')"
            :placeholder="t('harborConfig.form.username.placeholder')"
            required
          />
        </div>
        <div class="col span-6">
          <Password
            v-model="harborConfig.password"
            :mode="mode"
            :label="t('harborConfig.form.pw.label')"
            :placeholder="t('harborConfig.form.pw.placeholder')"
            required
          />
        </div>
      </div>
      <div class="row">
        <div class="col span-6">
          <RadioGroup
            v-model="harborConfig.version"
            name="version"
            :options="['v1', 'v2.0']"
            :label="t('harborConfig.form.version.label')"
            :labels="[
              'V1',
              'V2',
            ]"
            :mode="mode"
          />
        </div>
        <div class="col span-6">
          <Checkbox
            v-model="harborInsecureSkipVerify"
            :mode="mode"
            :label="t('harborConfig.form.harborInsecureSkipVerify')"
          />
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import { LabeledInput } from '@components/Form/LabeledInput';
import AsyncButton from '@shell/components/AsyncButton';
import Password from '@shell/components/form/Password';
import { RadioGroup } from '@components/Form/Radio';
import { Checkbox } from '@components/Form/Checkbox';
import { harborAPI } from '../api/image-repo.js';

export default {
  components: {
    LabeledInput,
    AsyncButton,
    Password,
    RadioGroup,
    Checkbox
  },

  async fetch() {
    const harborAPIRequest = harborAPI({ store: this.$store });

    const versionP = harborAPIRequest.fetchHarborVersion();

    const harborServerP = harborAPIRequest.fetchHarborServerUrl();

    const insecureSkipVerifyP = harborAPIRequest.fetchInsecureSkipVerify();

    const [version, harborServer, insecureSkipVerify] = await Promise.all([versionP, harborServerP, insecureSkipVerifyP]);

    if (harborServer.value) {
      await harborAPIRequest.initAPIRequest(version.value, harborServer.value);
      const harborUser = await harborAPIRequest.fetchHarborUserInfo();

      this.harborConfig.username = harborUser.value;
    }

    this.harborAPIRequest = harborAPIRequest;
    if (version.value) {
      this.harborConfig.version = version.value;
    } else {
      this.harborConfig.version = 'v1';
    }

    this.harborConfig.url = harborServer.value;
    this.harborInsecureSkipVerify = insecureSkipVerify.value === 'true';
  },

  data() {
    return {
      mode:                     'EDIT',
      harborInsecureSkipVerify: false,
      harborConfig:             {
        url:      '',
        username: '',
        password: '',
        version:  ''
      },
      harborAPIRequest: null
    };
  },
};
</script>
