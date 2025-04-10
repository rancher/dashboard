import GenericPrompt from '@/cypress/e2e/po/prompts/genericPrompt.po';

export function promptModal(): GenericPrompt {
  return new GenericPrompt('.prompt-restore');
}
