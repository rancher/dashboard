<template>
  <div
    v-loading="loading || innerLoading"
    class="member"
  >
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
      @page-change="pageChange"
      @input-search="inputSearch"
      @bulk-remove="bulkRemove"
      @sort-change="sortChange"
    />
  </div>
</template>
<script>
import HarborTable from '@pkg/image-repo/components/table/HarborTable.vue';
import util from '../../mixins/util.js';

export default {
  components: { HarborTable },
  mixins:     [util],
  props:      {
    apiRequest: {
      type:     Object,
      required: true
    },
    project: {
      type:     Object,
      required: true
    },
    loading: {
      type:     Boolean,
      required: true
    }
  },
  async mounted() {
    await this.fetchMember();
  },
  data() {
    return {
      innerLoading: false,
      page:         1,
      page_size:    10,
      totalCount:   0,
      inputFilter:  [],
      members:      [],
      sortValue:    '',
    };
  },
  computed: {
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
          field:    'entity_name',
          title:    this.t('harborConfig.table.entityName'),
          sortable: true,
          search:   'entityname',
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
    }
  },
  watch: {
    async project() {
      await this.fetchMember();
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
        this.innerLoading = true;
        try {
          const members = await this.apiRequest.fetchProjectMembersList(this.project?.project_id, {
            page_size: this.page_size,
            page:      this.page,
            ...params
          });

          this.members = members;
          this.totalCount = this.getTotalCount(members) || 0;
          this.innerLoading = false;
        } catch (e) {
          this.innerLoading = false;
        }
      }
    },
    removeMember(names) {
      this.innerLoading = true;
      this.apiRequest.deleteRepos(names).then(() => {
        this.fetchImage();
      }).catch(() => {
        this.innerLoading = false;
        this.fetchImage();
      });
    },
    pageChange(record) {
      this.page = record;
      this.fetchImage();
    },
    inputSearch(record) {
      this.page = 1;
      this.inputFilter = record;
      this.fetchImage();
    },
    bulkRemove(record) {
      this.removeImages(record.map((image) => {
        return image.name;
      }));
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
      this.fetchImage();
    },
  }
};
</script>
<style lang="scss" scoped>

</style>
