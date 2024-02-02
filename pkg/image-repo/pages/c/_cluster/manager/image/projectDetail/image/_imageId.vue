<template>
  <div>
    <div id="tooltip-container" />
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
      :subtractHeight="190"
      @action="action"
      @page-change="pageChange"
      @input-search="inputSearch"
      @bulk-remove="bulkRemove"
      @sort-change="sortChange"
      @checkbox-change="selectChange"
    >
      <template #pullCommand="{row}">
        <v-popover
          trigger="hover"
          placement="top"
        >
          <i
            style="cursor: pointer"
            class="icon icon-copy icon-lg guideLink"
            @click="copy(row.pullCommand)"
          />
          <template slot="popover">
            <div>
              Copy to Clipboard
            </div>
          </template>
        </v-popover>
      </template>
      <template #tags="{row}">
        <v-popover
          trigger="click"
          placement="top"
        >
          <slot name="default">
            <div>
              <a
                className="guideLink"
                style="cursor: pointer"
              >
                {{ row.tags }}
              </a>
            </div>
          </slot>
          <template slot="popover">
            <table
              class="sortable-table"
            >
              <thead>
                <tr style="border-bottom: 1px solid #fff">
                  <td>
                    {{ t('harborConfig.table.tags') }}
                  </td>
                  <td>
                    {{ t('harborConfig.table.pullTime') }}
                  </td>
                  <td>
                    {{ t('harborConfig.table.pushTime') }}
                  </td>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="tt in row.tagsTooltipModel"
                  :key="tt.name"
                >
                  <td>{{ tt.name }}</td>
                  <td>{{ tt.pullTime }}</td>
                  <td>{{ tt.pushTime }}</td>
                </tr>
              </tbody>
            </table>
          </template>
        </v-popover>
      </template>
      <template #labels="{row}">
        <div
          v-if="row.formartLables"
        >
          <div
            v-for="label in row.formartLables"
            :key="label.name"
            :style="label.cssStyle"
          >
            {{ label?.iconCssStyle?.overflow }}
            <img
              :src="iconSrc"
              width="10"
              height="10"
              :style="label.iconCssStyle"
            >
            <span style="word-break: break-all">{{ label.name }}</span>
          </div>
        </div>
      </template>
    </harbortable>
    <Dialog
      :title="t('imageRepoSection.tagPage.copyDigest')"
      :show="copyDigestDialog"
      @close="copyDigestDialog = false"
    >
      <div class="digest-container">
        {{ currentRow.digest }}
      </div>
      <template #createButton>
        <button
          type="button"
          class="btn bg-primary"
          @click="copyDigest"
        >
          {{ t('imageRepoSection.tagPage.copy') }}
        </button>
      </template>
    </Dialog>
    <Dialog
      :title="t('imageRepoSection.tagPage.addLabel')"
      :show="addLabelDialog"
      @close="addLabelDialog = false"
    >
      <div>
        <LabelCheckbox
          :items="labels"
          :selected="currentRow.labels ? currentRow.labels : []"
          @itemSelected="labelSelect"
        />
      </div>
      <template #createButton>
        <button
          v-loading="saveLabelLoading"
          :disabled="saveLabelLoading"
          type="button"
          class="btn bg-primary"
          @click="saveLabels"
        >
          {{ t('imageRepoSection.adminConfigPage.saveHarborConfig') }}
        </button>
      </template>
    </Dialog>
  </div>
</template>
<script>
import apiRequest from '@pkg/image-repo/mixins/apiRequest.js';
import HarborTable from '@pkg/image-repo/components/table/HarborTable.vue';
import util from '@pkg/image-repo/mixins/util.js';
import Dialog from '@pkg/image-repo/components/Dialog.vue';
import LabelCheckbox from '@pkg/image-repo/components/form/LabelCheckbox.vue';
import { mapGetters } from 'vuex';
import { concat } from 'lodash';

export default {
  components: {
    HarborTable,
    Dialog,
    LabelCheckbox
  },
  mixins: [
    apiRequest,
    util
  ],
  data() {
    return {
      loading:              false,
      saveLabelLoading:     false,
      project:              {},
      currentUser:          {},
      currentRow:           {},
      imageTags:            [],
      page:                 1,
      page_size:            10,
      totalCount:           0,
      inputFilter:          [],
      sortValue:            '',
      projectId:            this?.$route?.params?.id,
      imageName:            this?.$route?.params?.imageName,
      currentUserRoleId:    this?.$route?.params?.roleId,
      harborServerSettings: {},
      currentDigest:        '',
      time:                 '0001-01-01T00:00:00.000Z',
      copyDigestDialog:     false,
      addLabelDialog:       false,
      labels:               [],
      selectedLabels:       [],
      labelColors:          [
        {
          color:     '#000000',
          textColor: 'white'
        }, {
          color:     '#61717D',
          textColor: 'white'
        },
        {
          color:     '#737373',
          textColor: 'white'
        }, {
          color:     '#80746D',
          textColor: 'white'
        },
        {
          color:     '#FFFFFF',
          textColor: 'black'
        }, {
          color:     '#A9B6BE',
          textColor: 'black'
        },
        {
          color:     '#DDDDDD',
          textColor: 'black'
        }, {
          color:     '#BBB3A9',
          textColor: 'black'
        },
        {
          color:     '#0065AB',
          textColor: 'white'
        }, {
          color:     '#343DAC',
          textColor: 'white'
        },
        {
          color:     '#781DA0',
          textColor: 'white'
        }, {
          color:     '#9B0D54',
          textColor: 'white'
        },
        {
          color:     '#0095D3',
          textColor: 'black'
        }, {
          color:     '#9DA3DB',
          textColor: 'black'
        },
        {
          color:     '#BE90D6',
          textColor: 'black'
        }, {
          color:     '#F1428A',
          textColor: 'black'
        },
        {
          color:     '#1D5100',
          textColor: 'white'
        }, {
          color:     '#006668',
          textColor: 'white'
        },
        {
          color:     '#006690',
          textColor: 'white'
        }, {
          color:     '#004A70',
          textColor: 'white'
        },
        {
          color:     '#48960C',
          textColor: 'black'
        }, {
          color:     '#00AB9A',
          textColor: 'black'
        },
        {
          color:     '#00B7D6',
          textColor: 'black'
        }, {
          color:     '#0081A7',
          textColor: 'black'
        },
        {
          color:     '#C92100',
          textColor: 'white'
        }, {
          color:     '#CD3517',
          textColor: 'white'
        },
        {
          color:     '#C25400',
          textColor: 'white'
        }, {
          color:     '#D28F00',
          textColor: 'white'
        },
        {
          color:     '#F52F52',
          textColor: 'black'
        }, {
          color:     '#FF5501',
          textColor: 'black'
        },
        {
          color:     '#F57600',
          textColor: 'black'
        }, {
          color:     '#FFDC0B',
          textColor: 'black'
        },
      ],
      iconSrc: require('@pkg/image-repo/assets/image/harbor-icon.svg'),
    };
  },
  watch: {
    harborServerSetting: {
      async handler(value) {
        if (value) {
          await this.init();
          await this.fetchLabels();
          await this.fetchImage();
        }
      },
      deep: true
    },
  },
  methods: {
    async init() {
      const maxRetries = 3;
      let retries = 0;

      this.loading = true;
      const harborServerSettings = await this.harborAPIRequest.fetchHarborServerUrl() || {};

      this.harborServerSettings = harborServerSettings;
      while (retries < maxRetries) {
        try {
          const project = await this.harborAPIRequest.getProjectDetail(this.projectId);

          this.project = project;
          break;
        } catch (e) {
          retries++;
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }
      retries = 0;
      while (retries < maxRetries) {
        try {
          const currentUser = await this.harborAPIRequest.fetchCurrentHarborUser();

          this.currentUser = currentUser;
          break;
        } catch (e) {
          retries++;
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }
    },
    async fetchImage() {
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
        const imageTags = await this.harborAPIRequest.fetchImageTags(this.project.name, this.imageName, {
          page_size: this.page_size,
          page:      this.page,
          ...params,
        });

        this.totalCount = this.getTotalCount(imageTags) || 0;
        this.imageTags = imageTags;
        this.loading = false;
      } catch (e) {
        this.loading = false;
      }
    },
    async fetchLabels() {
      this.labels = [];
      const params = { scope: 'g' };
      const labels = await this.harborAPIRequest.fetchLabels(params);

      params.scope = 'p';
      params.project_id = this.project.project_id;
      const projectLabels = await this.harborAPIRequest.fetchLabels(params);

      if (labels?.length > 0) {
        this.labels = concat(this.labels, labels);
      }
      if (projectLabels?.length > 0) {
        this.labels = concat(this.labels, projectLabels);
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
      // console.log(record);
    },
    action(record, row) {
      this.currentRow = row;
      switch (record.action) {
      case 'copyDigest':
        this.copyDigestDialog = true;

        return;
      case 'addLabel':
        this.addLabelDialog = true;

      // case 'remove':
      //   console.log('remove');
      }
    },
    copyDigest() {
      this.copyDigestDialog = false;
      this.copy(this.currentDigest);
    },
    selectChange(record) {
      this.selectedRows = record;
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
    sizeTransform(tagSize) {
      const size = Number.parseInt(tagSize);

      if (Math.pow(1024, 1) <= size && size < Math.pow(1024, 2)) {
        return `${ (size / Math.pow(1024, 1)).toFixed(2) }KB`;
      } else if (Math.pow(1024, 2) <= size && size < Math.pow(1024, 3)) {
        return `${ (size / Math.pow(1024, 2)).toFixed(2) }MB`;
      } else if (Math.pow(1024, 3) <= size && size < Math.pow(1024, 4)) {
        return `${ (size / Math.pow(1024, 3)).toFixed(2) }GB`;
      } else {
        return `${ size }B`;
      }
    },
    pullCommand(digest) {
      const harborServer = this.harborServerSettings.value || '';
      const endpoint = harborServer.indexOf('://') > -1 ? harborServer.substr(harborServer.indexOf('://') + 3).replace(/\/+$/, '') : harborServer.replace(/\/+$/, '');
      const url = `${ endpoint }/${ this.project?.name }/${ this.imageName }${ digest ? `@${ digest }` : '' }`;

      return `docker pull ${ url }`;
    },
    formatLabels(labels) {
      return labels ? labels.map((label) => {
        const color = label.color || '#FFFFFF';
        const font = this.labelColors.find((c) => c.color === color);

        return {
          cssStyle: {
            overflow:        'hidden',
            maxWidth:        '300px',
            fontSize:        '12px',
            display:         'inline-block',
            padding:         '0 6px',
            border:          '1px solid rgb(161, 161, 161)',
            borderRadius:    '2px',
            backgroundColor: color,
            color:           font && font.textColor
          },
          iconCssStyle: {
            marginRight: '10px',
            position:    'relative',
            top:         '3360px',
            filter:      `drop-shadow(${ font && font.textColor } 0px -3358px)`
          },
          name:       label.name,
          classNames: label.scope === 'g' ? 'icon icon-user' : 'icon icon-tag',
        };
      }) : null;
    },
    tagsTooltipModelFunc(tags) {
      return tags && tags.length > 0 ? tags?.map((item) => {
        return {
          name:     item.name,
          pullTime: item.pull_time !== this.time ? this.liveUpdate(item.pull_time) : '',
          pushTime: item.push_time !== this.time ? this.liveUpdate(item.push_time) : '',
        };
      }) : [];
    },
    copy(value) {
      const input = document.createElement('input');

      input.value = value;
      document.body.appendChild(input);
      input.select();
      document.execCommand('Copy');
      document.body.removeChild(input);
    },
    labelSelect(record) {
      this.selectedLabels = record;
    },
    async saveLabels() {
      this.saveLabelLoading = true;
      if (this.currentRow?.labels) {
        await Promise.all(
          this.currentRow?.labels
            .filter((item) => !this.selectedLabels.some((ele) => ele.id === item.id))
            .map(async(item) => {
              await this.harborAPIRequest.removeTagLabelsV2(this.project.name, this.imageName, this.currentRow.digest, [item.id]);
            })
        );
      }

      await Promise.all(
        this.selectedLabels
          .filter((item) => !this.currentRow?.labels?.some((ele) => ele.id === item.id))
          .map(async(item) => {
            await this.harborAPIRequest.addTagLabelsV2(this.project.name, this.imageName, this.currentRow.digest, [item]);
          })
      );

      this.saveLabelLoading = false;
      this.addLabelDialog = false;
      await this.fetchImage();
    }
  },
  computed: {
    ...mapGetters({ t: 'i18n/t' }),
    columns() {
      const developerRoleOrAbove = `${ this.currentUserRoleId }` === '2' || `${ this.currentUserRoleId }` === '1' || this.currentUser.sysadmin_flag;
      const hasProjectAdminRole = `${ this.currentUserRoleId }` === '1' || this.currentUser.sysadmin_flag;
      const hasProjectMasterRole = `${ this.currentUserRoleId }` === '4' || this.currentUser.sysadmin_flag;

      const options = [
        {
          label:  this.t('imageRepoSection.tagPage.action.copyDigest'),
          icon:   'icon icon-copy',
          action: 'copyDigest'
        }
      ];

      if (developerRoleOrAbove || hasProjectMasterRole) {
        options.push({
          label:  this.t('imageRepoSection.tagPage.action.addLabel'),
          icon:   'icon icon-plus',
          action: 'addLabel'
        });
      }
      if (hasProjectAdminRole || hasProjectMasterRole) {
        options.push({
          label:  this.t('action.remove'),
          icon:   'icon icon-trash',
          action: 'remove'
        });
      }

      return [
        {
          field: 'artifacts',
          title: this.t('harborConfig.table.artifacts'),
        },
        {
          field: 'pullCommand',
          slot:  true,
          title: this.t('harborConfig.table.pullCommand'),
        },
        {
          field:  'formartTags',
          slot:   true,
          title:  this.t('harborConfig.table.tags'),
          search: 'tags',
        },
        {
          field: 'size',
          title: this.t('harborConfig.table.size'),
        },
        {
          field: 'labels',
          slot:  true,
          title: this.t('harborConfig.table.labels'),
        },
        {
          field: 'annotations',
          title: this.t('harborConfig.table.annotations'),
        },
        {
          field: 'pushTime',
          title: this.t('harborConfig.table.pushTime'),
        },
        {
          field: 'pullTime',
          title: this.t('harborConfig.table.pullTime'),
        },
        {
          field:  'action',
          title:  '',
          width:  50,
          action: { options }
        },
      ];
    },
    rows() {
      return this.imageTags?.map((tag) => {
        const digest = tag.digest ? tag.digest.slice(0, 15) : '';
        const pullCommand = this.pullCommand(tag.digest);
        const tagsTooltipModel = this.tagsTooltipModelFunc(tag.tags);
        const formartLables = this.formatLabels(tag.labels);
        let formartTags = '';

        tag.pull_time === this.time ? tag.pull_time = '' : tag.pull_time = this.liveUpdate(tag.pull_time);
        tag.push_time === this.time ? tag.push_time = '' : tag.push_time = this.liveUpdate(tag.push_time);
        if (tag?.tags?.length > 0) {
          formartTags = `${ tag.tags[0].name } (${ tag.tags.length })`;
        }
        tag.size = this.sizeTransform(tag.size);

        return {
          pullCommand,
          artifacts: digest,
          tagsTooltipModel,
          pushTime:  tag.push_time,
          pullTime:  tag.pull_time,
          formartLables,
          formartTags,
          ...tag,
        };
      });
    },
  }
};

</script>
<style lang="scss" scoped>
  .digest-container {
    display: block;
    box-sizing: border-box;
    border-width: 1.25px;
    border-color: #cdd0dd;
    border-radius: 0;
    border-style: solid;
    padding: 5px 10px;
    font-size: 15px;
    line-height: 24px;
    width: 100%;
    padding: 30px;
    word-wrap: break-word;
  }
</style>
