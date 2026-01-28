## Milestone guidance

- All issues must first be resolved in the `master` branch
- If backports are needed they can be made via the backport bot
  - github issue
    - `/backport <target milestone>` e.g `/backport v2.12.2`
  - pull requests
    - `/backport <target milestone> <target branch>` e.g. `/backport v2.12.2 release-2.12`
    - All backported pull requests must link to a backported issue


## Creating a branch

### To resolve an issue
- Checkout the branch matching the milestone of the issue `git checkout ${targetMilestoneBranch}`. Replace `${targetMilestoneBranch}` with the target milestone of the issue. For example
  - `master` for the latest unreleased minor version
  - `release-X` for release minor versions
    - `release-2.14`
    - `release-2.13`
    - `release-2.12`
- Ensure you have the latest of that branch `git pull --rebase`
- Checkout the branch to commit the changes to `git checkout issue-${issueNumber}`. Replace `${issueNumber}` with the issue number.

## Creating a commit

- Follow the [Chris Beams](http://chris.beams.io/posts/git-commit/) 'seven rules of a great Git commit message'  for commit messages.

## Creating a Pull Request

- Pull requests must come from forks
- Description should always reference the issue that the PR resolves e.g. `Fixes #1234`.
- Pull Requests that update code in `shell/` should update existing or add new unit tests to cover the change in functionality
- A Pull Request will only be merged once
  - The pull request checklist has been completed
  - ALL CI gates have passed
  - At least one rancher/dashboard team member reviews and approves the PR
