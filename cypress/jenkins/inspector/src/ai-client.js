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

export class AIClient {
  constructor(token) {
    this.token = token;
  }

  async generateFixSuggestions({
    testTitle, suite, errorSummary, stacktrace
  }) {
    if (!this.token) {
      console.warn('  Warning: COPILOT_TOKEN not set — skipping AI fix suggestions');

      return null;
    }

    const truncatedStack = stacktrace ? stacktrace.split('\n').slice(0, STACKTRACE_LINES).join('\n') : null;

    const userPrompt = [
      `Test: ${ testTitle }`,
      `Suite: ${ suite }`,
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
              content: 'You are a CI failure analyst for a Cypress end-to-end test suite. Given a failing test and its error output, provide: 1) A brief explanation of why the test failed. 2) 2-4 likely root causes as bullet points. 3) A concrete code snippet showing a suggested fix where applicable. Be specific to the error shown — avoid generic advice.',
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
