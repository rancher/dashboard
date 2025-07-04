<script>
import LabeledSelect from '@shell/components/form/LabeledSelect';
import { LabeledInput } from '@components/Form/LabeledInput';
import { Checkbox } from '@components/Form/Checkbox';
import FormValidation from '@shell/mixins/form-validation';
import { _CREATE } from '@shell/config/query-params';
import { getGKEImageFamilies, getGKEFamiliesFromProject } from '@shell/components/google/util/gcp';
import debounce from 'lodash/debounce';
import { mapGetters } from 'vuex';

const DEFAULT_PROJECTS = 'suse-cloud, ubuntu-os-cloud';

export default {
  emits: ['update:value', 'error', 'validationChanged'],

  components: {
    Checkbox,
    LabeledInput,
    LabeledSelect,
  },

  mixins: [FormValidation],

  props: {
    value: {
      type:     String,
      required: true
    },
    credentialId: {
      type:     String,
      required: true,
    },
    projectId: {
      type:    String,
      default: null,
    },
    mode: {
      type:    String,
      default: _CREATE,
    },
    location: {
      type:     Object,
      required: true
    }
  },

  async fetch() {
    if ( !this.credentialId ) {
      return;
    }
    await this.getFamilies();
  },
  data() {
    return {
      showDeprecated:  false,
      families:        {},
      machineImages:   [],
      imageProjects:   DEFAULT_PROJECTS,
      defaultProjects: DEFAULT_PROJECTS,
      family:          null,
      loadingFamilies: false,
      loadingImages:   false,
      fvFormRuleSets:  [
        {
          path: 'imageProjects', rootObject: this, rules: ['required', 'projects']
        },
        {
          path: 'family', rootObject: this, rules: ['required']
        },
        {
          path: 'machineImage', rootObject: this, rules: ['required']
        }]
    };
  },
  created() {
    this.debouncedLoadFamilies = debounce(this.getFamilies, 500);
    if (this.mode !== _CREATE) {
      this.imageProjects = `${ this.getProjectFromImage() }`;
    } else {
      this.$emit('validationChanged', false);
    }
  },
  watch: {
    fvFormIsValid(newValue) {
      this.$emit('validationChanged', !!newValue);
    },
    family(neu) {
      this.getImages(neu);
    },

    'imageProjects'() {
      this.debouncedLoadFamilies();
    },
    showDeprecated() {
      this.getFamilies();
    },
  },
  computed: {
    ...mapGetters({ t: 'i18n/t' }),
    fvExtraRules() {
      return {
        projects: (val) => {
          return val && !val.match(/^[a-zA-Z0-9 ,.-]*$/) ? this.t('cluster.machineConfig.gce.error.projects') : undefined;
        }

      };
    },
    project() {
      return this.value.project;
    },
    machineImage: {
      get() {
        return this.value ? this.getImageNameFromImage() : '';
      },
      set(neu) {
        this.setMachineImage(neu);
        this.diskSize = neu?.diskSize ? neu.diskSize : 10;
      }
    },
    familyOptions() {
      const out = [];

      Object.keys(this.families).forEach((groupLabel) => {
        const instances = this.families[groupLabel];

        const groupOption = { label: groupLabel, kind: 'group' };
        const familyOptions = instances.map((instance) => {
          return {
            value: { family: instance, project: groupLabel },
            label: instance,
            group: groupLabel
          };
        });

        out.push(groupOption);
        out.push(...familyOptions);
      });

      return out;
    },
    imageOptions() {
      let out = [];

      if (!this.showDeprecated) {
        out = this.machineImages.map((image) => {
          const value = {
            name:     image.name,
            selfLink: image.selfLink,
            diskSize: image.diskSizeGb
          };
          const deprecated = !!image?.deprecated;

          return {
            value,
            label: !deprecated ? this.t('cluster.machineConfig.gce.machineImage.option', { name: image.name, description: image.description }) : this.t('cluster.machineConfig.gce.machineImage.deprecatedOption', { name: image.name, description: image.description }),
          };
        });
      } else {
        const deprecatedImages = [];
        const activeImages = [];

        this.machineImages.forEach((image) => {
          const value = {
            name:     image.name,
            selfLink: image.selfLink,
            diskSize: image.diskSizeGb
          };
          const deprecated = !!image?.deprecated;

          if (!deprecated) {
            activeImages.push({
              value,
              label: !deprecated ? this.t('cluster.machineConfig.gce.machineImage.option', { name: image.name, description: image.description }) : this.t('cluster.machineConfig.gce.machineImage.deprecatedOption', { name: image.name, description: image.description }),
            });
          } else {
            deprecatedImages.push({
              value,
              label: !deprecated ? this.t('cluster.machineConfig.gce.machineImage.option', { name: image.name, description: image.description }) : this.t('cluster.machineConfig.gce.machineImage.deprecatedOption', { name: image.name, description: image.description }),
            });
          }
          out = [...activeImages, ...deprecatedImages];
        });
      }

      return out;
    },
  },
  methods: {
    async getFamilies() {
      this.loadingFamilies = true;
      let out = {};

      if (this.imageProjects) {
        try {
          let projects = this.imageProjects.replace(/ /g, '');

          if (projects.endsWith(',')) {
            projects = projects.substring(0, projects.length - 1 );
          }

          if (!!projects) {
            out = await getGKEFamiliesFromProject(this.$store, this.credentialId, this.projectId, this.location, projects, false) || {};

            if (!!this.showDeprecated) {
              const deprecatedResponse = await getGKEFamiliesFromProject(this.$store, this.credentialId, this.projectId, this.location, projects, true);

              Object.keys(deprecatedResponse).forEach((family) => {
                if ( !out[family]) {
                  out[family] = family;
                } else {
                  out[family] = [...new Set([...out[family], ...deprecatedResponse[family]])];
                }
              });
            }
          }
        } catch (e) {
          // This fails often if user mistypes, so it's better to swallow the error instead of spamming with errors
          return '';
        }
      }
      this.families = out;

      // When editing existing cluster, we need to find corresponding family
      if (!!this.value) {
        let found = false;

        const project = this.getProjectFromImage();
        const families = out[project] || [];
        const imageName = this.getImageNameFromImage();

        let count = 0;

        while (!found && count < families.length) {
          const images = await this.getImagesInProject({ family: families[count], project }, true );
          const filtered = images.filter((image) => image.name === imageName);

          if (filtered.length > 0) {
            found = true;
            this.family = { family: filtered[0].family, project };
          }
          count += 1;
        }
      }
      // If we had to reload list of families, we need to reset selected family if it is no longer in the list
      if ( !!this.family?.project && !this.families[this.family.project]) {
        this.family = null;
      }

      this.loadingFamilies = false;
    },
    getProjectFromImage() {
      if (!!this.value) {
        return this.value.split('/')[0];
      }
    },
    getImageNameFromImage() {
      if (!!this.value) {
        return this.value.split('/')[3];
      }
    },

    async getImagesInProject(val, showDeprecated) {
      let imagesInProject = [];

      try {
        if (val?.family) {
          imagesInProject = await getGKEImageFamilies(this.$store, this.credentialId, this.projectId, location, val.family, val.project, showDeprecated);
        }
      } catch (e) {
        this.$emit('error', e.data);
      }

      return imagesInProject;
    },

    async getImages(val) {
      this.loadingImages = true;
      try {
        this.machineImages = await this.getImagesInProject(val, this.showDeprecated);
        // If we had to reload list of images, we need to reset selected image if it is no longer in the list
        if ( !!this.machineImage && this.machineImages.filter((image) => image.name === this.machineImage).length === 0) {
          this.machineImage = '';
        }
      } catch (e) {
        this.$emit('error', e.data);
      }

      this.loadingImages = false;
    },
    formatMachineImage(image) {
      if (!image) {
        return '';
      }
      const index = image?.indexOf('/projects/');

      if (index === -1 ) {
        return '';
      }

      return image?.substring(index + '/projects/'.length);
    },
    setMachineImage(neu) {
      const formattedImage = this.formatMachineImage(neu?.selfLink);

      this.$emit('update:value', formattedImage);
    },
  }

};
</script>

<template>
  <div class="row mt-20">
    <div class="col span-6 mr-10">
      <LabeledInput
        v-model:value="imageProjects"
        :mode="mode"
        label-key="cluster.machineConfig.gce.imageProjects.label"
        :placeholder="defaultProjects"
        data-testid="gce-image-project-select"
        required
        :rules="fvGetAndReportPathRules('imageProjects')"
      />
    </div>
    <div>
      <Checkbox
        v-model:value="showDeprecated"
        :mode="mode"
        :label="t('cluster.machineConfig.gce.showDeprecated.label')"
        class="mt-20"
      />
    </div>
  </div>
  <div class="row mt-20">
    <LabeledSelect
      v-model:value="family"
      label-key="cluster.machineConfig.gce.family.label"
      :mode="mode"
      :options="familyOptions"
      option-key="value"
      option-label="label"
      :loading="loadingFamilies"
      data-testid="gce-image-family-select"
      class="span-3 mr-10"
      :rules="fvGetAndReportPathRules('family')"
    />

    <LabeledSelect
      v-model:value="machineImage"
      label-key="cluster.machineConfig.gce.machineImage.label"
      :mode="mode"
      :options="imageOptions"
      option-key="value"
      option-label="label"
      :loading="loadingImages"
      data-testid="gce-image-image-select"
      class="span-3"
      :tooltip="t('cluster.machineConfig.gce.machineImage.tooltip')"
      required
      :rules="fvGetAndReportPathRules('machineImage')"
    />
  </div>
</template>
