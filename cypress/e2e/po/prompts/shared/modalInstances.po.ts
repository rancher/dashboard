import GenericPrompt from '@/cypress/e2e/po/prompts/genericPrompt.po';
import GenericDialog from '@/cypress/e2e/po/prompts/genericDialog.po';

export function promptModal(): GenericPrompt {
  return new GenericPrompt('.modal-container');
}

export function dialogModal(): GenericDialog {
  return new GenericDialog();
}
