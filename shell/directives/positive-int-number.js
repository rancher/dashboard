function mounted(el) {
  el.addEventListener('keypress', (e) => {
    e = e || window.event;
    const charcode = typeof e.charCode === 'number' ? e.charCode : e.keyCode;
    const re = /^\d+$/; // Use regex to match positive numbers

    if (!re.test(String.fromCharCode(charcode)) && charcode > 9 && !e.ctrlKey) {
      if (e.preventDefault) {
        e.preventDefault();
      } else {
        e.returnValue = false;
      }
    }
  });
}

const positiveIntNumberDirective = { mounted };

export default positiveIntNumberDirective;
