import { deriveRepoName } from '@shell/utils/fleet-appco';

describe('fleet-appco utils', () => {
  describe('deriveRepoName', () => {
    it.each([
      ['my-auth-secret', 'my-repo-secret'],
      ['auth-token', 'repo-token'],
      ['some-auth', 'some-repo'],
    ])('should replace "auth" with "repo" in %s', (input, expected) => {
      expect(deriveRepoName(input)).toStrictEqual(expected);
    });

    it('should return empty string for empty input', () => {
      expect(deriveRepoName('')).toStrictEqual('');
    });
  });
});
