<template>
  <div
    v-loading="loading"
    class="image"
  >
    <HarborTable
      ref="harborTableRef"
      rowSelection
      search
      paging
      :loading="loading"
      :rows="rows"
      :columns="columns"
      :totalCount="totalCount"
      :subtractHeight="320"
      :disableActionButton="disableActionButton"
      @action="action"
      @page-change="pageChange"
      @input-search="inputSearch"
      @bulk-remove="bulkRemove"
      @sort-change="sortChange"
    >
      <template>
        <v-popover
          :placement="placement"
          popoverBaseClass="drop-down-menu-cn tooltip popover"
        >
          <template name="default">
            <div class="push-image-trigger">
              <span>{{ t('harborConfig.table.pushImg.btn') }}</span>
              <span class="icon">
                <i class="icon icon-play icon-rotate-90" />
              </span>
            </div>
          </template>
          <template slot="popover">
            <div class="push-image-content">
              <div style="padding:8px 5px; font-size:18px">
                {{ t('harborConfig.table.pushImg.title') }}
              </div>
              <div style="padding:5px">
                {{ t('harborConfig.table.pushImg.markedImg') }}:
              </div>
              <div class="push-image-command">
                {{ tag }}
                <span style="margin-left:10px">
                  <i
                    class="icon icon-copy icon-lg"
                    @click="copy(tag)"
                  />
                </span>
              </div>
              <div style="padding:5px">
                {{ t('harborConfig.table.pushImg.pushImgToProject') }}:
              </div>
              <div class="push-image-command">
                {{ push }}
                <span style="margin-left:10px">
                  <i
                    class="icon icon-copy icon-lg"
                    @click="copy(push)"
                  />
                </span>
              </div>
            </div>
          </template>
        </v-popover>
      </template>
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
  </div>
</template>
<script>
import HarborTable from '@pkg/image-repo/components/table/HarborTable.vue';
import { PRODUCT_NAME } from '../../config/image-repo.js';
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
  },
  data() {
    return {
      loading:     false,
      page:        1,
      page_size:   10,
      totalCount:  0,
      inputFilter: [],
      images:      [],
      sortValue:   '',
      placement:   'bottom',
    };
  },
  computed: {
    columns() {
      return [
        {
          field:    'name',
          title:    this.t('harborConfig.table.name'),
          sortable: true,
          search:   'name',
          slot:     true,
        },
        {
          field: 'artifact_count',
          title: this.t('harborConfig.table.artifacts'),
        },
        {
          field: 'pull_count',
          title: this.t('harborConfig.table.downCount'),
        },
        {
          field:  'action',
          title:  '',
          width:  50,
          action: {
            options: [
              {
                action:         'delete',
                label:          this.t('action.remove'),
                icon:           'icon-trash',
                disableActions: () => {
                  return parseInt(this.project?.current_user_role_id, 10) !== 1 && !this?.currentUser?.sysadmin_flag;
                }
              },
            ],
          }
        },
      ];
    },
    rows() {
      return this.images.map((image) => {
        const to = {
          name:   `${ PRODUCT_NAME }-c-cluster-manager-project-detail-image-v2`,
          params: {
            id:        this.project.project_id,
            roleId:    this.project.current_user_role_id,
            imageName: image.name.replace(`${ this.project.name }/`, ''),
          }
        };

        return {
          to,
          ...image
        };
      });
    },
    tag() {
      return `docker tag SOURCE_IMAGE[:TAG] ${ this.apiRequest.getHarborServerIp() }/${ this.project?.name }/IMAGE[:TAG]`;
    },
    push() {
      return `docker push ${ this.apiRequest.getHarborServerIp() }/${ this.project?.name }/IMAGE[:TAG]`;
    },
    disableActionButton() {
      return parseInt(this?.project?.current_user_role_id, 10) !== 1 && !this?.currentUser?.sysadmin_flag;
    },
  },
  watch: {
    project: {
      immediate: true,
      async handler() {
        await this.fetchImage();
      }
    }
  },
  methods: {
    async fetchImage() {
      const params = { project_id: this.project?.project_id };

      if (this.project?.project_id) {
        if (this.inputFilter?.length > 0 ) {
          this.inputFilter.forEach((item) => {
            params.q = encodeURIComponent(`${ item.field }%3D~${ item.value }`);
          });
        }
        if (this.sortValue !== '') {
          params.sort = this.sortValue;
        }
        this.loading = true;
        try {
          const images = await this.apiRequest.fetchProjectImages({
            page_size: this.page_size,
            page:      this.page,
            ...params
          });

          this.images = images;
          this.totalCount = this.getTotalCount(images) || 0;
          this.loading = false;
        } catch (e) {
          this.loading = false;
        }
      }
    },
    removeImages(names) {
      this.loading = true;
      this.apiRequest.deleteRepos(names).then(() => {
        this.fetchImage();
      }).catch(() => {
        this.loading = false;
        this.fetchImage();
      });
    },
    action(action, record) {
      if (action.action === 'delete' && record.name) {
        this.$customConfrim({
          type:           'Image Store',
          resources:      [record],
          propKey:        'name',
          store:          this.$store,
          removeCallback: async() => {
            await this.removeImages([record.name]);
          }
        });
      }
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
      this.$customConfrim({
        type:           'Image Store',
        resources:      record,
        propKey:        'name',
        store:          this.$store,
        removeCallback: async() => {
          await this.removeImages(record.map((image) => {
            return image.name;
          }));
        }
      });
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
    copy(value) {
      const input = document.createElement('input');

      input.value = value;
      document.body.appendChild(input);
      input.select();
      document.execCommand('Copy');
      document.body.removeChild(input);
    },
  }
};
</script>
<style lang="scss" scoped>
  .image {
    cursor: pointer;
    .push-image-trigger {
      height: 40px;
      display:flex;
      justify-content:center;
      align-items:center;
      margin-right:15px;
      >span {
        min-width: 60px;
      }
      span {
        margin-left:14px
      }
      .icon {
        margin-top: 2px;
        margin-left:5px
      }
    }
  }
  .push-image-content {
    padding:10px 20px;
    border: 1px solid #ccc;
    box-shadow: 0 1px 0.125rem rgba(115,115,115,.25);
    z-index: 10;
  }
  .push-image-command {
    display: flex;
    padding: 5px;
    white-space: nowrap;
    & i {
      margin-top: 2px;
      cursor: pointer;
    }
  }
</style>
