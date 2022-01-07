import debounce from 'lodash/debounce';

// Use a visible display type to reduce flickering
const displayType = 'inline-block';

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
      const actionsDropdown = document.getElementById(this.bulkActionsDropdownId);

      if (!actionsContainer || !actionsDropdown) {
        return;
      }

      const actionsContainerWidth = actionsContainer.offsetWidth;
      const actionsHTMLCollection = document.getElementsByClassName(this.bulkActionClass);
      const actions = Array.from(actionsHTMLCollection || []);

      // Determine if the 'x selected' label should show and it's size
      const actionAvailability = document.getElementById(this.bulkActionAvailabilityId);
      let actionAvailabilityWidth = 0;

      if (this.actionAvailability) {
        if (actionAvailability) {
          actionAvailability.style.display = displayType;
          actionAvailabilityWidth = actionAvailability.offsetWidth;
        } else {
          actionAvailability.style.display = 'none;';
        }
      }

      this.hiddenActions = [];

      let cumulativeWidth = 0;
      let showActionsDropdown = false;
      let totalAvailableWidth = actionsContainerWidth - actionAvailabilityWidth;

      // Loop through all actions to determine if some exceed the available space in the row, if so hide them and instead show in a dropdown
      for (let i = 0; i < actions.length; i++) {
        const ba = actions[i];

        ba.style.display = displayType;
        const actionWidth = ba.offsetWidth;

        cumulativeWidth += actionWidth + 15;
        if (cumulativeWidth >= totalAvailableWidth) {
          // There are too many actions so the drop down will be visible.
          if (!showActionsDropdown) {
            // If we haven't previously enabled the drop down...
            actionsDropdown.style.display = displayType;
            // By showing the drop down some previously visible actions may now be hidden, so start the process again
            // ... except taking into account the width of drop down width in the available space
            i = -1;
            cumulativeWidth = 0;
            showActionsDropdown = true;
            totalAvailableWidth = actionsContainerWidth - actionsDropdown.offsetWidth - actionAvailabilityWidth;
          } else {
            // Collate the actions in an array and hide in the normal row
            const id = ba.attributes.getNamedItem('id').value;

            this.hiddenActions.push(this.availableActions.find(aa => aa.action === id));
            ba.style.display = 'none';
          }
        }
      }

      if (!showActionsDropdown) {
        actionsDropdown.style.display = 'none';
      }
    }, 10)
  }
};
