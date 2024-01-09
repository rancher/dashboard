<template>
  <div class="project">
    <div class="header">
      <h1>{{ t('nav.imageRepo.projects') }}</h1>
      <div class="right-buttons">
        <button
          class="btn role-primary"
          @click="showDialog"
        >
          {{ t('harborConfig.btn.createProject') }}
        </button>
      </div>
    </div>
    <HarborTable
      ref="harborTableRef"
      rowSelection
      search
      paging
      :loading="loading"
      :rows="rows"
      :columns="columns"
      :totalCount="totalCount"
      :defaultSelectOption="defaultSelectOption"
      @action="action"
      @page-change="pageChange"
      @input-search="inputSearch"
      @bulk-remove="bulkRemove"
      @sort-change="sortChange"
    >
      <template
        v-slot:name="{ row }"
      >
        <nuxt-link
          :to="row.to"
        >
          {{ row.name }}
        </nuxt-link>
      </template>
    </HarborTable>
    <Dialog
      :title="t('harborConfig.newProject')"
      :show="newProjectVisible"
      :loading="createProjectLoading"
      @close="closeDialog"
      @create="createProject"
    >
      <div>
        <LabeledInput
          v-model.trim="form.name"
          :label="t('harborConfig.form.projectName.label')"
          required
        />
        <div class="harbor-project-unit">
          <InputWithSelect
            :text-value="form.size"
            :select-before-text="false"
            :options="form.operation"
            :select-value="form.storageUnitValue"
            :text-label="t('harborConfig.form.storage.label')"
            type="number"
          />
        </div>
        <SwitchCheckbox
          :checked="form.checked"
          @toggle-change="toggleAccessChange"
        />
        <div class="acc-label">
          {{ t('harborConfig.form.accessLevel.info') }}
        </div>
        <Banner
          v-for="(err, i) in errors"
          :key="i"
          color="error"
          :label="err"
        />
      </div>
    </Dialog>
  </div>
</template>
<script>
import HarborTable from '@pkg/image-repo/components/table/HarborTable.vue';
import Dialog from '@pkg/image-repo/components/Dialog.vue';
import SwitchCheckbox from '@pkg/image-repo/components/form/SwitchCheckbox.vue';
import { LabeledInput } from '@components/Form/LabeledInput';
import InputWithSelect from '@shell/components/form/InputWithSelect';
import { Banner } from '@components/Banner';
import util from '../mixins/util.js';
import { mapGetters } from 'vuex';
import { PRODUCT_NAME } from '../config/image-repo.js';
import Schema from 'async-validator';

export default {
  components: {
    HarborTable,
    LabeledInput,
    Dialog,
    Banner,
    InputWithSelect,
    SwitchCheckbox
  },
  mixins: [util],
  props:  {
    apiRequest: {
      type:     Object,
      required: true
    }
  },
  async fetch() {
    await this.getProject();
  },
  data() {
    const nameReg = /^[a-z0-9]+(?:[._-][a-z0-9]+)*$/;

    const descriptor = {
      name: [
        {
          type:     'string',
          required: true,
          message:  () => this.t('harborConfig.validate.projectNameReq')
        },
        {
          validator: (rule, value, callback, source, options) => {
            const errors = [];

            if (!nameReg.test(value)) {
              errors.push(this.t('harborConfig.validate.projectNameFormatError'));
            }

            return errors;
          }
        }
      ],
    };

    return {
      descriptor,
      loading:              false,
      page_size:            10,
      mainRowSearchKey:     'artifact_count',
      totalCount:           0,
      page:                 1,
      inputFilter:          [],
      newProjectVisible:    false,
      createProjectLoading: false,
      projects:             [],
      columns:              [
        {
          field:    'name',
          title:    'Project name',
          sortable: true,
          search:   'name',
          slot:     true,
        },
        {
          field: 'access',
          title: 'Access Level',
        },
        {
          field: 'role',
          title: 'Role',
        },
        {
          field: 'repo_count',
          title: 'Number of image store',
          width: 200,
        },
        {
          field:    'creation',
          title:    'Created',
          sortable: true,
        },
        {
          field:  'action',
          title:  '',
          width:  50,
          action: {
            options: [
              {
                action: 'delete',
                label:  'Delete',
                icon:   'icon-trash',
              },
            ],
          }
        },
      ],
      form: {
        name:             '',
        size:             -1,
        storageUnitValue: 'mb',
        checked:          false,
        operation:        [
          {
            label: 'MB',
            value: 'mb'
          },
          {
            label: 'GB',
            value: 'gb'
          },
          {
            label: 'TB',
            value: 'tb'
          }
        ]
      },
      errors:    [],
      sortValue: '',
    };
  },
  computed: {
    ...mapGetters({ t: 'i18n/t' }),
    defaultSelectOption() {
      return [
        {
          label: this.t('harborConfig.form.image.all'),
          value: '',
        },
        {
          label: this.t('harborConfig.form.image.public'),
          value: 1,
        },
        {
          label: this.t('harborConfig.form.image.private'),
          value: 0,
        },
      ];
    },
    rows() {
      return this.projects.map((project) => {
        const to = {
          name:   `${ PRODUCT_NAME }-c-cluster-manager-project-detail-v2`,
          params: { id: project.project_id }
        };

        return {
          role:     this.getRole(project),
          access:   project?.metadata?.public === 'true' ? this.t('harborConfig.table.storeStatus.public') : this.t('harborConfig.table.storeStatus.private'),
          creation: this.liveUpdate(project.creation_time),
          to,
          ...project
        };
      });
    }
  },
  methods: {
    async getProject() {
      const params = {};

      if (this.inputFilter?.length > 0 ) {
        this.inputFilter.forEach((item) => {
          params[item.field] = item.value;
        });
      }
      if (this.sortValue !== '') {
        params.sort = this.sortValue;
      }
      try {
        this.loading = true;
        const projects = await this.apiRequest.fetchProjects({
          page_size: this.page_size,
          page:      this.page,
          ...params,
        });

        this.totalCount = this.getTotalCount(projects) || 0;
        this.projects = projects;
        this.loading = false;
      } catch (err) {
        this.loading = false;
      }
    },
    validate() {
      const validator = new Schema(this.descriptor);

      return validator.validate(this.form);
    },
    action(action, record) {
      if (action.action === 'delete' && record.project_id) {
        this.removeProjects([record.project_id]);
      }
    },
    toggleAccessChange() {
      this.form.checked = !this.form.checked;
    },
    pageChange(record) {
      this.page = record;
      this.getProject();
    },
    inputSearch(record) {
      this.page = 1;
      this.inputFilter = record;
      this.getProject();
    },
    sortChange({ field, order }) {
      if (order) {
        if (field === 'creation') {
          field = 'creation_time';
        }
        if (order === 'desc') {
          field = `-${ field }`;
        }
        this.sortValue = field;
      } else {
        this.sortValue = '';
      }
      this.getProject();
    },
    bulkRemove(record) {
      const projectIDs = record.map((project) => {
        return project.project_id;
      });

      this.removeProjects(projectIDs);
    },
    removeProjects(projectIDs) {
      this.loading = true;
      this.apiRequest.removeProjects(projectIDs).then(() => {
        this.getProject();
      }).catch(() => {
        this.loading = false;
        this.getProject();
      });
    },
    showDialog() {
      this.newProjectVisible = true;
    },
    closeDialog() {
      this.clearForm();
      this.newProjectVisible = false;
    },
    async createProject() {
      this.createProjectLoading = true;
      try {
        await this.validate();
      } catch (err) {
        this.errors = err.errors.map((e) => e.message);
        this.createProjectLoading = false;
      }
      const size = parseInt(this.form.size, 10) !== -1 ? this.changeToBytes(this.form.size, this.form.storageUnitValue) : -1;
      const data = {
        project_name:  this.form.name,
        storage_limit: size,
        metadata:      { public: this.form.checked ? 'true' : 'false' }
      };

      try {
        await this.apiRequest.createProject(data);
        this.createProjectLoading = false;
        this.clearForm();
        this.newProjectVisible = false;
        this.clearSelect();
        this.getProject();
      } catch (err) {
        if (err?.message) {
          this.errors = [err?.message];
        } else {
          this.errors = [this.t('harborConfig.validate.unknownError')];
        }
        this.createProjectLoading = false;
      }
    },
    getRole(project) {
      let roleText;

      switch (project.current_user_role_id) {
      case 0:
        roleText = '';
        break;
      case 1:
        roleText = this.t('harborConfig.table.roleItem.admin');
        break;
      case 2:
        roleText = this.t('harborConfig.table.roleItem.developer');
        break;
      case 3:
        roleText = this.t('harborConfig.table.roleItem.visitor');
        break;
      case 4:
        roleText = this.t('harborConfig.table.roleItem.master');
        break;
      case 5:
        roleText = this.t('harborConfig.table.roleItem.limitedGuest');
        break;
      default:
        roleText = '';
      }

      return roleText;
    },
    clearForm() {
      this.form.name = '';
      this.form.size = -1;
      this.form.storageUnitValue = 'mb';
      this.form.checked = false;
    },
    clearSelect() {
      this.$refs.harborTableRef?.clearSearch();
    }
  }
};
</script>
<style lang="scss" scoped>
.project {
  .header {
    display: grid;
    grid-template-areas:
        "type-banner type-banner"
        "title actions"
        "state-banner state-banner";
    grid-template-columns: auto auto;
    margin-bottom: 20px;
    min-height: 48px;
    align-items: center;
    padding-top: 20px;
    .right-buttons {
      justify-content: flex-end;
      align-self: center;
      text-align: right;
    }
  }
  A {
    display: flex;
    justify-content: left;
    align-items: center;
  }
  .harbor-project-unit {
    margin: 10px 0px;
  }
  .acc-label {
    color: #4a4b52;
    padding-bottom: 5px;
    font-size: .85em;
    margin-top: 10px;
  }
}
</style>
