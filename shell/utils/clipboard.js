import * as Clipboard from 'clipboard-polyfill';

export async function copyTextToClipboard(text) {
  await Clipboard.writeText(text);
}

export async function readTextFromClipboard() {
  return await Clipboard.readText();
}
