function mounted(el) {
  el.addEventListener('keypress', (e) => {
    e = e || window.event;
    const charcode = typeof e.charCode === 'number' ? e.charCode : e.keyCode;
    const inputChar = String.fromCharCode(charcode);

    // Allow digits, minus sign at the beginning, and Ctrl key combinations
    const re = /^-?\d*$/;

    if (!re.test(inputChar) && charcode > 9 && !e.ctrlKey) {
      if (e.preventDefault) {
        e.preventDefault();
      } else {
        e.returnValue = false;
      }
    }
  });
}
const intNumberDirective = { mounted };

export default intNumberDirective;
