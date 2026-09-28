## Agentic Workflows

## Labels

Agentic workflows may update github issue and pull requests labels. In addition to any they manage they should also adhere to the following

- When an agentic workflow creates a github issue or pull request it should add a label in the following format: `bot/<bot name>`
  - e.g. bot name is `issue grooming`, label is `bot/issue-grooming`
- An agentic workflow can receive instructions or state from itself or other sources via github issue or pull request labels with the following format: `bot/<bot name>/<instruction>`
  - e.g. bot name is `issue grooming`, instruction is `ready for triage`, label is `bot/issue-grooming/ready-for-triage`
