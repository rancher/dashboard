// Added by Verrazzano

import { get, isEmpty } from '@shell/utils/object';
import { randomStr } from '@shell/utils/string';
import debounce from 'lodash/debounce';
import CreateEditView from '@shell/mixins/create-edit-view';

export default {
  inject: ['selectTab'],
  mixins: [CreateEditView],

  data() {
    let list;
    let dynamicListHelperRootType;
    const valueType = typeof this.value;

    if ((valueType === 'object' || valueType === 'undefined') && typeof this.getDynamicListRootFieldName === 'function') {
      const rootFieldName = this.getDynamicListRootFieldName();

      // rootFieldName may be a dot-demarcated path...
      list = get(this.value, rootFieldName) || [];
      dynamicListHelperRootType = 'object';
    } else if (Array.isArray(this.value) || (valueType === 'undefined' && typeof this.getDynamicListRootFieldName === 'undefined')) {
      list = this.value || [];
      dynamicListHelperRootType = 'array';
    } else {
      // eslint-disable-next-line no-console
      console.error('dynamic-list-helper could not find the list for value: ', JSON.stringify(this.value));
      throw new Error(`dynamic-list-helper could not find the list for value: ${ JSON.stringify(this.value) }`);
    }

    // create a copy of the config list with an ID in each element
    const dynamicListChildren = list.map((child) => {
      const newChild = this.clone(child);

      newChild._id = randomStr(4);

      return newChild;
    });

    return {
      dynamicListChildren,
      dynamicListHelperRootType,
    };
  },
  methods: {
    update() {
      // create a config list from the local copy, removing the ID from each

      const children = [];

      this.dynamicListChildren.forEach((child) => {
        const newChild = this.clone(child);

        delete newChild._id;

        children.push(newChild);
      });

      if (this.dynamicListHelperRootType === 'object') {
        const rootFieldName = this.getDynamicListRootFieldName();

        this.setFieldIfNotEmpty(rootFieldName, children);
      } else {
        this.$emit('input', children);
      }
    },
    dynamicListAddChild(child = {}) {
      this.dynamicListChildren.push({ _id: randomStr(4), ...child });

      if (!isEmpty(child)) {
        this.queueUpdate();
      }

      if (typeof this.getDynamicListTabName === 'function') {
        this.selectTab(this.getDynamicListTabName(child));
      }
    },
    dynamicListDeleteChild(childToDelete) {
      const index = this.dynamicListChildren.findIndex(child => child._id === childToDelete._id);

      if (index !== -1) {
        this.dynamicListChildren.splice(index, 1);
        this.queueUpdate();
      }

      if (typeof this.getDynamicListTabName === 'function') {
        this.selectTab(this.getDynamicListTabName());
      }
    },
    dynamicListDeleteChildByIndex(index) {
      this.dynamicListChildren.splice(index, 1);
      this.queueUpdate();

      if (typeof this.getDynamicListTabName === 'function') {
        this.selectTab(this.getDynamicListTabName());
      }
    },
    dynamicListClearChildrenList() {
      this.dynamicListChildren.splice(0, this.dynamicListChildren.length);
      this.queueUpdate();
    },
    // Useful for ArrayListGrouped component using dynamic lists.
    dynamicListShowRemoveButton() {
      return !this.isView && this.dynamicListChildren.length > 0;
    },
    dynamicListShowEmptyListMessage() {
      return this.dynamicListChildren.length === 0;
    },
    dynamicListUpdate() {
      this.queueUpdate();
    },
  },

  created() {
    this.queueUpdate = debounce(this.update, 500);
  }
};
