import { filterBy } from '@/utils/array';
import debounce from 'lodash/debounce';

export default {

  data() {
    return {
      bulkActionsId:            'bulk',
      bulkActionClass:          'bulk-action',
      bulkActionsDropdownId:    'bulk-actions-dropdown',
      bulkActionAvailabilityId: 'bulk-action-availability',

      hiddenActions: [],
    };
  },

  created() {
    window.addEventListener('resize', this.updateHiddenBulkActions);
  },
  destroyed() {
    window.removeEventListener('resize', this.updateHiddenBulkActions);
  },
  mounted() {
    this.updateHiddenBulkActions();
  },

  watch: {
    actionAvailability() {
      this.updateHiddenBulkActions();
    }
  },

  computed: {
    availableActions() {
      return this.$store.getters[`${ this.storeName }/forTable`].filter(act => !act.external);
    },

    hasExternalActions() {
      return filterBy(this.$store.getters[`${ this.storeName }/forTable`], 'external', true).length > 0;
    },

    actionAvailability() {
      if (!this.tableSelected || this.tableSelected.length === 0) {
        return null;
      }

      const runnableTotal = this.tableSelected.filter(this.canRunBulkActionOfInterest).length;
      const selectionTotal = this.tableSelected.length;
      const tableTotal = this.arrangedRows.length;
      const allOfSelectionIsActionable = runnableTotal === selectionTotal;
      const useTableTotal = !this.actionOfInterest || allOfSelectionIsActionable;

      const input = {
        actionable: this.actionOfInterest ? runnableTotal : selectionTotal,
        total:      useTableTotal ? tableTotal : selectionTotal,
      };

      const someActionable = this.actionOfInterest && !allOfSelectionIsActionable;
      const key = someActionable ? 'sortableTable.actionAvailability.some' : 'sortableTable.actionAvailability.selected';

      return this.t(key, input);
    },

  },

  methods: {
    /**
     * Determine if any actions wrap over to a new line, if so group them into a dropdown instead
     */
    updateHiddenBulkActions: debounce(function() {
      const actionsContainer = document.getElementById(this.bulkActionsId);

      if (!actionsContainer) {
        return;
      }

      // First determine if any actions will be hidden and the actions drop down needs to be shown
      // To do this temporarily display affected elements (buttons and if applicable '<x> selected' text) to
      // determine their size then cumulate those up until the width of the row is hit

      const actionsContainerWidth = actionsContainer.offsetWidth;

      const actionsHTMLCollection = document.getElementsByClassName(this.bulkActionClass);
      const actions = Array.from(actionsHTMLCollection || []);

      const actionAvailability = document.getElementById(this.bulkActionAvailabilityId);
      let actionAvailabilityWidth = 0;

      if (this.actionAvailability && actionAvailability) {
        actionAvailability.style.display = 'inline-block';
        actionAvailabilityWidth = actionAvailability.offsetWidth;
      }

      let cumulativeWidth = 0;
      let showActionsDropdown = false;
      let totalAvailableWidth = actionsContainerWidth - actionAvailabilityWidth;

      for (const ba of actions) {
        ba.style.display = 'inline-block';
        const width = ba.offsetWidth + 10;

        cumulativeWidth += width + 10;
        if (cumulativeWidth >= totalAvailableWidth) {
          showActionsDropdown = true;
          break;
        }
      }

      // Now that we know the actions drop down will be shown or not, do the same as above however taking into account the
      // visibility of the drop down (which can consume space, thus pushing more actions into the drop down)
      // Once done all buttons that don't fit in the row will not be visible and instead be listed in `hiddenActions`

      const actionsDropdown = document.getElementById(this.bulkActionsDropdownId);
      let actionsDropdownWidth = 0;

      if (actionsDropdown) {
        if (showActionsDropdown) {
          actionsDropdown.style.display = 'inline-block';
          actionsDropdownWidth = actionsDropdown.offsetWidth;
        } else {
          actionsDropdown.style.display = 'none';
        }
      }

      cumulativeWidth = 0;
      totalAvailableWidth = actionsContainerWidth - actionsDropdownWidth - actionAvailabilityWidth;

      this.hiddenActions = [];

      for (const ba of actions) {
        const id = ba.attributes.getNamedItem('id').value;
        const action = this.availableActions.find(aa => aa.action === id);
        const width = ba.offsetWidth + 10;

        cumulativeWidth += width + 10;
        if (cumulativeWidth >= totalAvailableWidth) {
          this.hiddenActions.push(action);
          ba.style.display = 'none';
        } else {
          ba.style.display = 'inline-block';
        }
      }
    }, 10)
  }
};
