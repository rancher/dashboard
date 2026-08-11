/* eslint-disable no-console */
/**
 * AI client for CI Failure Inspector.
 * Uses the GitHub Copilot inference API (OpenAI-compatible) to generate
 * possible causes and fix suggestions for failing tests.
 *
 * Requires: COPILOT_TOKEN — the GHA auto-generated GITHUB_TOKEN with
 *   `copilot-requests: write` declared in the job permissions.
 */

import { sanitizeText } from './fetch-utils.js';

const COPILOT_API = 'https://api.githubcopilot.com/chat/completions';
const MODEL = 'gpt-4o';

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
          model:    MODEL,
          messages: [
            {
              role:    'system',
              content: 'You are a CI failure analyst for a Cypress end-to-end test suite. Given a failing test and its error output, provide: 1) A brief explanation of why the test failed. 2) 2-4 likely root causes as bullet points. 3) A concrete code snippet showing a suggested fix where applicable. Be specific to the error shown — avoid generic advice.',
            },
            {
              role:    'user',
              content: userPrompt,
            },
          ],
          max_tokens:  600,
          temperature: 0.3,
        }),
      });

      if (!res.ok) {
        const text = await res.text();

        console.warn(`  Warning: Copilot API returned ${ res.status } — skipping AI suggestions: ${ text.slice(0, 200) }`);

        return null;
      }

      const data = await res.json();
      const content = data?.choices?.[0]?.message?.content?.trim();

      return content || null;
    } catch (e) {
      console.warn(`  Warning: AI suggestion request failed — ${ e.message }`);

      return null;
    }
  }
}
