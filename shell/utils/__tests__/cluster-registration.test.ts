import { importCommands, isServerUrlMissing, SERVER_URL_PLACEHOLDER } from '@shell/utils/cluster-registration';

describe('utils: cluster-registration', () => {
  const blankSetting = { value: '' };
  const populatedSetting = { value: 'https://rancher.example.com' };

  const populatedToken = {
    clusterId:       'c-m-abc123',
    token:           'tok123',
    command:         'kubectl apply -f https://rancher.example.com/v3/import/tok123_c-m-abc123.yaml',
    insecureCommand: 'curl --insecure -sfL https://rancher.example.com/v3/import/tok123_c-m-abc123.yaml | kubectl apply -f -',
  };

  const tokenWithoutCommands = {
    clusterId:       'c-m-abc123',
    token:           'tok123',
    command:         '',
    insecureCommand: '',
  };

  describe('isServerUrlMissing', () => {
    it.each([
      ['a blank setting and a token without commands', blankSetting, tokenWithoutCommands, true],
      ['a setting without a value and a token with undefined commands', {}, { clusterId: 'c-m-abc123', token: 'tok123' }, true],
      ['a blank setting and a token with commands', blankSetting, populatedToken, false],
      ['a blank setting and a token without a token value', blankSetting, { ...tokenWithoutCommands, token: '' }, false],
      ['a blank setting and an empty token', blankSetting, {}, false],
      ['a blank setting and a null token', blankSetting, null, false],
      ['a blank setting and an undefined token', blankSetting, undefined, false],
      ['a populated setting and a token that has no commands yet', populatedSetting, tokenWithoutCommands, false],
      ['an unreadable setting and a token without commands', undefined, tokenWithoutCommands, false],
      ['a null setting and a token without commands', null, tokenWithoutCommands, false],
    ])('should return the right value for %s', (_, setting, clusterToken, expected) => {
      expect(isServerUrlMissing(setting, clusterToken)).toStrictEqual(expected);
    });
  });

  describe('importCommands', () => {
    it('should return the commands from the token when they are populated', () => {
      expect(importCommands(populatedSetting, populatedToken)).toStrictEqual({
        command:         populatedToken.command,
        insecureCommand: populatedToken.insecureCommand,
      });
    });

    it('should build the commands with a server URL placeholder when server-url is blank', () => {
      const url = `${ SERVER_URL_PLACEHOLDER }/v3/import/tok123_c-m-abc123.yaml`;

      expect(importCommands(blankSetting, tokenWithoutCommands)).toStrictEqual({
        command:         `kubectl apply -f ${ url }`,
        insecureCommand: `curl --insecure -sfL ${ url } | kubectl apply -f -`,
      });
    });

    it.each([
      ['a populated setting and a token that has no commands yet', populatedSetting, tokenWithoutCommands],
      ['an unreadable setting and a token without commands', undefined, tokenWithoutCommands],
      ['a blank setting and a token without a token value', blankSetting, { ...tokenWithoutCommands, token: '' }],
      ['a blank setting and an empty token', blankSetting, {}],
      ['a blank setting and a null token', blankSetting, null],
      ['a blank setting and an undefined token', blankSetting, undefined],
    ])('should return empty commands for %s', (_, setting, clusterToken) => {
      expect(importCommands(setting, clusterToken)).toStrictEqual({ command: '', insecureCommand: '' });
    });
  });
});
