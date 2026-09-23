/* eslint-disable no-console */
/**
 * AI client for CI Failure Inspector.
 * Uses the GitHub Copilot inference API to generate possible causes and fix
 * suggestions for failing tests.
 *
 * Requires: COPILOT_TOKEN — the GHA auto-generated GITHUB_TOKEN with
 *   `copilot-requests: write` declared in the job permissions.
 */

import { sanitizeText } from './fetch-utils.js';

// This model is served from /responses, not /chat/completions, which rejects it
// with `unsupported_api_for_model`.
const COPILOT_API = 'https://api.githubcopilot.com/responses';

// Overridable so a retired model can be swapped via workflow config rather than a code change.
const MODEL = process.env.COPILOT_MODEL || 'gpt-5.6-luna';

// Truncate stacktrace to first N lines — the LLM only needs root cause frames
const STACKTRACE_LINES = 20;

// Split across lines for reviewability — sent as one system message.
const SYSTEM_PROMPT = [
  'You are a CI failure analyst for a Cypress end-to-end test suite that runs against Rancher.',
  'Each environment is listed as "<image tag> (<build type>)", where the build type is the Rancher edition: `community` (Docker Hub images) or `prime` (SUSE registry images).',
  'These editions can differ in bundled chart versions, registry availability, feature gating and branding, so a failure confined to one edition points at a different root cause than one seen on both.',
  'A failing test does not mean the test is wrong. It may have correctly caught a real defect in the Rancher product or UI.',
  'Do not assume the test is at fault, and do not propose a change that would make a failing assertion pass if the product behaviour it asserts is genuinely broken.',
  'Respond with:',
  '1) A verdict — classify the failure as PRODUCT BUG (Rancher behaves incorrectly), TEST ISSUE (the test is wrong, brittle or outdated), or ENVIRONMENT/INFRASTRUCTURE (setup, registry, network or timing outside the product and the test) — state your confidence and say if the evidence is insufficient to tell.',
  '2) A brief explanation of why the test failed.',
  '3) 2-4 likely root causes as bullet points, covering product-side causes as well as test-side ones.',
  '4) A concrete next step: for a product bug, what to verify and where in the product to look, plus what a bug report should record; for a test or environment issue, a code or config snippet showing the fix where applicable.',
  'Be specific to the error shown — avoid generic advice.',
].join(' ');

export class AIClient {
  constructor(token) {
    this.token = token;
  }

  async generateFixSuggestions({
    testTitle, suite, errorSummary, stacktrace, environments
  }) {
    if (!this.token) {
      console.warn('  Warning: COPILOT_TOKEN not set — skipping AI fix suggestions');

      return null;
    }

    const truncatedStack = stacktrace ? stacktrace.split('\n').slice(0, STACKTRACE_LINES).join('\n') : null;
    const failedOn = [...new Set((environments || []).map((e) => `${ e.version } (${ e.env })`))].join(', ');

    const userPrompt = [
      `Test: ${ testTitle }`,
      `Suite: ${ suite }`,
      failedOn ? `Failed on: ${ failedOn }` : '',
      ``,
      `Error:`,
      sanitizeText((errorSummary || '').slice(0, 500)),
      truncatedStack ? `\nStack trace (top frames):\n${ sanitizeText(truncatedStack) }` : '',
    ].filter(Boolean).join('\n');

    try {
      const res = await fetch(COPILOT_API, {
        method:  'POST',
        headers: {
          'Content-Type':           'application/json',
          Authorization:            `Bearer ${ this.token }`,
          'Copilot-Integration-Id': 'copilot-developer-cli',
        },
        body: JSON.stringify({
          model: MODEL,
          input: [
            {
              role:    'system',
              content: SYSTEM_PROMPT,
            },
            {
              role:    'user',
              content: userPrompt,
            },
          ],
        }),
      });

      if (!res.ok) {
        const text = await res.text();

        if (text.includes('model_not_supported') || text.includes('unsupported_api_for_model')) {
          console.warn(`  Warning: model '${ MODEL }' is no longer usable on ${ COPILOT_API } — set the INSPECTOR_COPILOT_MODEL repository variable to a supported model (see https://api.githubcopilot.com/models). Skipping AI suggestions.`);
        } else {
          console.warn(`  Warning: Copilot API returned ${ res.status } — skipping AI suggestions: ${ text.slice(0, 200) }`);
        }

        return null;
      }

      const data = await res.json();

      // Answer text is nested under output[].content[]; `output_text` is not
      // always populated and reasoning items carry no visible text.
      const content = (data?.output || [])
        .filter((item) => item.type === 'message')
        .flatMap((item) => item.content || [])
        .filter((part) => part.type === 'output_text')
        .map((part) => part.text)
        .join('')
        .trim();

      if (!content) {
        console.warn(`  Warning: Copilot API returned no suggestion text (status: ${ data?.status }) — skipping AI suggestions`);

        return null;
      }

      return content;
    } catch (e) {
      console.warn(`  Warning: AI suggestion request failed — ${ e.message }`);

      return null;
    }
  }
}
