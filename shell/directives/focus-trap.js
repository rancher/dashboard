import { createFocusTrap } from 'focus-trap';

let trap;

const createTrap = (element) => {
  trap = createFocusTrap(element, {
    escapeDeactivates: true,
    allowOutsideClick: true,
  });
};

const focusTrap = {
  updated(element, binding) {
    if (!trap && binding.value) {
      const focusTrapElement = binding.arg ? [element, ...binding.arg] : element;

      createTrap(focusTrapElement);

      setTimeout(() => {
        trap.activate();
      });
    } else if (trap && !binding.value) {
      trap.deactivate();
    }
  },
};

export default focusTrap;
