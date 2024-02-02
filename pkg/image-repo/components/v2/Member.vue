<template>
  <div
    v-loading="loading"
    class="member"
  >
    <div class="member-add">
      <button
        class="btn role-primary"
        @click="showAddModal"
      >
        <t k="harborConfig.table.addUser" />
      </button>
    </div>
    <HarborTable
      ref="harborTableRef"
      rowSelection
      search
      paging
      hideSelect
      :loading="loading"
      :rows="rows"
      :columns="columns"
      :totalCount="totalCount"
      :disableActionButton="disabled"
      :subtractHeight="320"
      @page-change="pageChange"
      @input-search="inputSearch"
      @bulk-remove="bulkRemove"
      @sort-change="sortChange"
      @checkbox-change="selectChange"
    >
      <template #options>
        <DropDownMenu
          :options="options"
          :propVisible="dropDownMenuVisible"
          @custom-event="bulkAction"
          @visible-change="visibleChange"
        >
          <button
            type="button"
            class="bulk-action btn bg-primary"
            :disabled="disabled"
            @click="showDropDownMenu"
          >
            <i
              class="icon icon-play icon-rotate-90 eased mr-5"
              data-testid="card-collapse-icon-right"
            />
            {{ t('harborConfig.table.otherOperation.setRole') }}
          </button>
        </DropDownMenu>
      </template>
    </HarborTable>
    <Dialog
      :title="t('harborConfig.form.addMember.title')"
      :show="addDialogVisible"
      @close="addDialogVisible = false"
    >
      <template>
        <div class="label">
          <div class="mt-20">
            <LabeledInput
              v-model.trim="form.name"
              :label="t('harborConfig.form.addMember.username.label')"
              :placeholder="t('harborConfig.form.addMember.username.placeholder')"
              required
            />
          </div>
          <div class="mt-20">
            <LabeledSelect
              v-model="form.role"
              :label="t('harborConfig.form.addMember.role.label')"
              :options="options"
            />
          </div>
          <div class="mt-20">
            <Banner
              v-for="(err, i) in errors"
              :key="i"
              color="error"
              :label="err"
            />
          </div>
        </div>
      </template>
      <template #createButton>
        <button
          v-loading="saveUserLoading"
          :disabled="saveUserLoading"
          type="button"
          class="btn bg-primary"
          @click="saveUser"
        >
          {{ t('generic.save') }}
        </button>
      </template>
    </Dialog>
  </div>
</template>
<script>
import { mapGetters } from 'vuex';
import HarborTable from '@pkg/image-repo/components/table/HarborTable.vue';
import DropDownMenu from '@pkg/image-repo/components/DropDownMenu.vue';
import Dialog from '@pkg/image-repo/components/Dialog.vue';
import { LabeledInput } from '@components/Form/LabeledInput';
import { Banner } from '@components/Banner';
import util from '../../mixins/util.js';
import LabeledSelect from '@shell/components/form/LabeledSelect.vue';
import Schema from 'async-validator';

export default {
  components: {
    HarborTable,
    DropDownMenu,
    Dialog,
    LabeledInput,
    Banner,
    LabeledSelect
  },
  mixins: [util],
  props:  {
    apiRequest: {
      type:     Object,
      required: true
    },
    project: {
      type:     Object,
      required: true
    },
    currentUser: {
      type:     Object,
      required: true
    },
    harborSysntemInfo: {
      type:     Object,
      required: true
    }
  },
  data() {
    const descriptor = { name: { required: true, message: () => 'The Name cannot be empty' } };

    return {
      descriptor,
      loading:             false,
      saveUserLoading:     false,
      page:                1,
      page_size:           10,
      totalCount:          0,
      inputFilter:         [],
      members:             [],
      selectedRows:        [],
      sortValue:           '',
      dropDownMenuVisible: false,
      addDialogVisible:    false,
      form:                {
        name: '',
        role: '1',
      },
      errors: [],
    };
  },
  watch: {
    project: {
      immediate: true,
      async handler() {
        await this.fetchMember();
      }
    }
  },
  computed: {
    ...mapGetters({ t: 'i18n/t' }),
    rows() {
      return this.members.map((member) => {
        const obj = {
          u:            this.t('harborConfig.table.roleItem.user'),
          guest:        this.t('harborConfig.table.roleItem.visitor'),
          developer:    this.t('harborConfig.table.roleItem.developer'),
          projectAdmin: this.t('harborConfig.table.roleItem.admin'),
          master:       this.t('harborConfig.table.roleItem.master'),
          limitedGuest: this.t('harborConfig.table.roleItem.limitedGuest'),
          maintainer:   this.t('harborConfig.table.roleItem.maintainer'),
        };

        return {
          memberType: obj[member.entity_type],
          memberRole: obj[member.role_name],
          ...member
        };
      });
    },
    columns() {
      return [
        {
          field:  'entity_name',
          title:  this.t('harborConfig.table.entityName'),
          search: 'entityname',
        },
        {
          field: 'memberType',
          title: this.t('harborConfig.table.entityType'),
        },
        {
          field: 'memberRole',
          title: this.t('harborConfig.table.role'),
        },
      ];
    },
    options() {
      const arr = [
        {
          value: '1',
          label: this.t('harborConfig.table.roleItem.admin')
        },
        {
          value: '2',
          label: this.t('harborConfig.table.roleItem.developer')
        },
        {
          value: '3',
          label: this.t('harborConfig.table.roleItem.visitor')
        }
      ];

      if (this.harborSysntemInfo.supportRoleMaster) {
        arr.push({
          value: '4',
          label: this.t('harborConfig.table.roleItem.master')
        });
      }

      if (this.harborSysntemInfo.supportRoleLimitedGuest) {
        arr.push({
          value: '5',
          label: this.t('harborConfig.table.roleItem.limitedGuest')
        });
      }

      return arr;
    },
    selectedMembersWithoutSelf() {
      const currentUserId = this.currentUser.user_id;
      const members = this.selectedRows.filter((item) => item.entity_id !== currentUserId);

      return members || [];
    },
    disabled() {
      return this.selectedMembersWithoutSelf.length === 0;
    }
  },
  methods: {
    async fetchMember() {
      const params = {};

      if (this.project?.project_id) {
        if (this.inputFilter?.length > 0 ) {
          this.inputFilter.forEach((item) => {
            params[item.field] = item.value;
          });
        }
        if (this.sortValue !== '') {
          params.sort = this.sortValue;
        }
        this.loading = true;
        try {
          const members = await this.apiRequest.fetchProjectMembersList(this.project?.project_id, {
            page_size: this.page_size,
            page:      this.page,
            ...params
          });

          this.members = members;
          this.totalCount = this.getTotalCount(members) || 0;
          this.loading = false;
        } catch (e) {
          this.loading = false;
        }
      }
    },
    removeMember(records) {
      this.loading = true;
      const members = records?.map((ele) => ele.id);

      if (this.project?.project_id) {
        this.apiRequest.projectDeleteMemberRole(this.project?.project_id, members).then(() => {
          this.fetchMember();
        }).catch(() => {
          this.loading = false;
          this.fetchMember();
        });
      }
    },
    pageChange(record) {
      this.page = record;
      this.fetchMember();
    },
    inputSearch(record) {
      this.page = 1;
      this.inputFilter = record;
      this.fetchMember();
    },
    bulkRemove(records) {
      records?.length > 0 && this.removeMember(records);
    },
    sortChange({ field, order }) {
      if (order) {
        if (order === 'desc') {
          field = `-${ field }`;
        }
        this.sortValue = field;
      } else {
        this.sortValue = '';
      }
      this.fetchMember();
    },
    async bulkAction(record) {
      const members = this.selectedMembersWithoutSelf.map((ele) => ele.id);

      if (members.length === 0) {
        return;
      }
      this.dropDownMenuVisible = false;
      await this.apiRequest.projectChangeRole(this.project.project_id, members, { role_id: parseInt(record.value, 10) });
      this.selectedRows = [];
      this.fetchMember();
    },
    showDropDownMenu() {
      this.dropDownMenuVisible = true;
    },
    visibleChange(record) {
      this.dropDownMenuVisible = record;
    },
    selectChange(record) {
      this.selectedRows = record;
    },
    showAddModal() {
      this.errors = [];
      this.addDialogVisible = true;
      this.saveUserLoading = false;
      this.form = {
        name: '',
        role: '1',
      };
    },
    validate(form) {
      const validator = new Schema(this.descriptor);

      return validator.validate(form);
    },
    async saveUser() {
      this.saveUserLoading = true;
      this.errors = [];
      try {
        await this.validate(this.form);
      } catch (err) {
        this.errors = err.errors.map((e) => e.message);
        this.saveUserLoading = false;

        return;
      }
      try {
        await this.apiRequest.fetchProjectMembers(this.project?.project_id, this.form.name).then((resp) => {
          if (resp?.length > 0 && resp[0].entity_name === this.form.name) {
            this.errors.push(this.t('harborConfig.form.addMember.error'));
            this.saveUserLoading = false;
          }
        });
      } catch (err) {
        this.errors = [JSON.stringify(err)];
      }
      if (this.errors.length > 0 ) {
        return;
      }
      const params = {
        member_user: { username: this.form.name },
        role_id:     parseInt(this.form.role, 10)
      };

      try {
        await this.apiRequest.addProjectUser(params, this.project?.project_id).then((resp) => {
          this.form = {
            name: '',
            role: '1',
          };
          this.addDialogVisible = false;
        });
      } catch (err) {
        this.errors = [JSON.stringify(err)];
      }
      this.saveUserLoading = false;
      await this.fetchMember();
    }
  }
};
</script>
<style lang="scss" scoped>
  .member {
    position: relative;
    .member-add {
      position: absolute;
      top: -75px;
      right: 0px;
    }
  }
</style>
