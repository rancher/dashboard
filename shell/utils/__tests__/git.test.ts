import { GitUtils, Commit } from '@shell/utils/git';

describe('git utils', () => {
  describe('gitUtils.github.normalize.repo', () => {
    it('maps owner fields from GitHub API response', () => {
      const data = {
        owner: {
          login:      'octocat',
          html_url:   'https://github.com/octocat',
          avatar_url: 'https://avatars.githubusercontent.com/u/1?v=4'
        },
        description: 'Hello World',
        created_at:  '2021-01-01T00:00:00Z',
        updated_at:  '2021-06-01T00:00:00Z',
        html_url:    'https://github.com/octocat/hello-world',
        name:        'hello-world'
      };

      const result = GitUtils.github.normalize.repo(data);

      expect(result.owner).toStrictEqual({
        name:      'octocat',
        htmlUrl:   'https://github.com/octocat',
        avatarUrl: 'https://avatars.githubusercontent.com/u/1?v=4'
      });
    });

    it('maps repo-level fields from GitHub API response', () => {
      const data = {
        owner: {
          login: 'octocat', html_url: '', avatar_url: ''
        },
        description: 'A repository description',
        created_at:  '2021-01-01T00:00:00Z',
        updated_at:  '2022-03-15T12:00:00Z',
        html_url:    'https://github.com/octocat/repo',
        name:        'my-repo'
      };

      const result = GitUtils.github.normalize.repo(data);

      expect(result.description).toStrictEqual('A repository description');
      expect(result.created_at).toStrictEqual('2021-01-01T00:00:00Z');
      expect(result.updated_at).toStrictEqual('2022-03-15T12:00:00Z');
      expect(result.htmlUrl).toStrictEqual('https://github.com/octocat/repo');
      expect(result.name).toStrictEqual('my-repo');
    });

    it('handles missing owner gracefully', () => {
      const data = {
        owner:       undefined,
        description: 'No owner',
        created_at:  '2021-01-01T00:00:00Z',
        updated_at:  '2021-01-01T00:00:00Z',
        html_url:    'https://github.com/no/owner',
        name:        'no-owner'
      };

      const result = GitUtils.github.normalize.repo(data);

      expect(result.owner).toStrictEqual({
        name:      undefined,
        htmlUrl:   undefined,
        avatarUrl: undefined
      });
    });
  });

  describe('gitUtils.github.normalize.commit', () => {
    it('maps commit fields from GitHub API response', () => {
      const data = {
        commit: {
          message:   'fix: resolve issue',
          committer: { date: '2022-01-15T10:30:00Z' }
        },
        html_url: 'https://github.com/octocat/repo/commit/abc1234567890',
        sha:      'abc1234567890abcdef',
        author:   {
          login:      'octocat',
          avatar_url: 'https://avatars.githubusercontent.com/u/1?v=4',
          htmlUrl:    'https://github.com/octocat'
        }
      };

      const result = GitUtils.github.normalize.commit(data);

      expect(result.message).toStrictEqual('fix: resolve issue');
      expect(result.htmlUrl).toStrictEqual('https://github.com/octocat/repo/commit/abc1234567890');
      expect(result.sha).toStrictEqual('abc1234');
      expect(result.commitId).toStrictEqual('abc1234567890abcdef');
      expect(result.date).toStrictEqual('2022-01-15T10:30:00Z');
      expect(result.isChecked).toStrictEqual(false);
    });

    it('truncates sha to 7 characters', () => {
      const data = {
        commit:   { message: 'chore: update deps', committer: { date: '2022-01-01T00:00:00Z' } },
        html_url: 'https://github.com/octocat/repo/commit/1234567890',
        sha:      '1234567890abcdef1234',
        author:   {
          login: 'user', avatar_url: '', htmlUrl: ''
        }
      };

      const result = GitUtils.github.normalize.commit(data);

      expect(result.sha).toStrictEqual('1234567');
    });

    it('returns undefined sha when sha is empty string', () => {
      const data = {
        commit:   { message: 'fix: bug', committer: { date: '2022-01-01T00:00:00Z' } },
        html_url: 'https://github.com/octocat/repo/commit/x',
        sha:      '',
        author:   {
          login: 'user', avatar_url: '', htmlUrl: ''
        }
      };

      const result: Commit = GitUtils.github.normalize.commit(data);

      expect(result.sha).toBeUndefined();
    });

    it('maps author fields from GitHub API response', () => {
      const data = {
        commit:   { message: 'feat: new feature', committer: { date: '2022-01-01T00:00:00Z' } },
        html_url: 'https://github.com/octocat/repo/commit/abc',
        sha:      'abcdef1234567890',
        author:   {
          login:      'contributor',
          avatar_url: 'https://avatars.githubusercontent.com/u/2?v=4',
          htmlUrl:    'https://github.com/contributor'
        }
      };

      const result = GitUtils.github.normalize.commit(data);

      expect(result.author).toStrictEqual({
        name:      'contributor',
        avatarUrl: 'https://avatars.githubusercontent.com/u/2?v=4',
        htmlUrl:   'https://github.com/contributor'
      });
    });
  });

  describe('gitUtils.gitlab.normalize.repo', () => {
    it('maps owner fields from GitLab API response', () => {
      const data = {
        namespace: {
          name:       'my-group',
          web_url:    'https://gitlab.com/my-group',
          avatar_url: 'https://gitlab.com/uploads/group.png'
        },
        description:      'GitLab repo description',
        created_at:       '2021-02-01T00:00:00Z',
        last_activity_at: '2022-07-20T00:00:00Z',
        web_url:          'https://gitlab.com/my-group/project',
        name:             'project'
      };

      const result = GitUtils.gitlab.normalize.repo(data);

      expect(result.owner).toStrictEqual({
        name:      'my-group',
        htmlUrl:   'https://gitlab.com/my-group',
        avatarUrl: 'https://gitlab.com/uploads/group.png'
      });
    });

    it('maps repo-level fields from GitLab API response', () => {
      const data = {
        namespace: {
          name: 'ns', web_url: '', avatar_url: ''
        },
        description:      'My GitLab project',
        created_at:       '2020-05-01T00:00:00Z',
        last_activity_at: '2023-01-10T00:00:00Z',
        web_url:          'https://gitlab.com/ns/myproject',
        name:             'myproject'
      };

      const result = GitUtils.gitlab.normalize.repo(data);

      expect(result.description).toStrictEqual('My GitLab project');
      expect(result.created_at).toStrictEqual('2020-05-01T00:00:00Z');
      expect(result.updated_at).toStrictEqual('2023-01-10T00:00:00Z');
      expect(result.htmlUrl).toStrictEqual('https://gitlab.com/ns/myproject');
      expect(result.name).toStrictEqual('myproject');
    });

    it('maps updated_at from last_activity_at (not updated_at)', () => {
      const data = {
        namespace: {
          name: 'ns', web_url: '', avatar_url: ''
        },
        description:      '',
        created_at:       '2020-01-01T00:00:00Z',
        last_activity_at: '2023-06-15T08:00:00Z',
        updated_at:       'should-be-ignored',
        web_url:          'https://gitlab.com/ns/proj',
        name:             'proj'
      };

      const result = GitUtils.gitlab.normalize.repo(data);

      expect(result.updated_at).toStrictEqual('2023-06-15T08:00:00Z');
    });
  });

  describe('gitUtils.gitlab.normalize.commit', () => {
    it('maps commit fields from GitLab API response', () => {
      const data = {
        message:        'refactor: clean up code',
        web_url:        'https://gitlab.com/ns/proj/-/commit/abc1234',
        short_id:       'abc1234',
        id:             'abc1234567890abcdef',
        author_name:    'Jane Doe',
        avatar_url:     'https://gitlab.com/uploads/jane.png',
        committed_date: '2022-03-10T14:00:00Z'
      };

      const result = GitUtils.gitlab.normalize.commit(data);

      expect(result.message).toStrictEqual('refactor: clean up code');
      expect(result.htmlUrl).toStrictEqual('https://gitlab.com/ns/proj/-/commit/abc1234');
      expect(result.sha).toStrictEqual('abc1234');
      expect(result.commitId).toStrictEqual('abc1234567890abcdef');
      expect(result.date).toStrictEqual('2022-03-10T14:00:00Z');
      expect(result.isChecked).toStrictEqual(false);
    });

    it('maps author fields from GitLab API response', () => {
      const data = {
        message:        'feat: add feature',
        web_url:        'https://gitlab.com/ns/proj/-/commit/xyz',
        short_id:       'xyz',
        id:             'xyzabcdef',
        author_name:    'John Smith',
        avatar_url:     'https://gitlab.com/uploads/john.png',
        committed_date: '2022-04-01T00:00:00Z'
      };

      const result = GitUtils.gitlab.normalize.commit(data);

      expect(result.author).toStrictEqual({
        name:      'John Smith',
        avatarUrl: 'https://gitlab.com/uploads/john.png',
        htmlUrl:   'https://gitlab.com/ns/proj/-/commit/xyz'
      });
    });

    it('uses web_url for both htmlUrl and author.htmlUrl', () => {
      const data = {
        message:        'fix: something',
        web_url:        'https://gitlab.com/ns/proj/-/commit/def456',
        short_id:       'def456',
        id:             'def456abc',
        author_name:    'Dev',
        avatar_url:     '',
        committed_date: '2022-01-01T00:00:00Z'
      };

      const result = GitUtils.gitlab.normalize.commit(data);

      expect(result.htmlUrl).toStrictEqual('https://gitlab.com/ns/proj/-/commit/def456');
      expect((result.author as any).htmlUrl).toStrictEqual('https://gitlab.com/ns/proj/-/commit/def456');
    });
  });
});
