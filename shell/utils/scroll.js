export function scrollToBottom() {
  const scrollable = document.getElementsByTagName('main')[0];

  if (scrollable) {
    scrollable.scrollTop = scrollable.scrollHeight;
  }
}
