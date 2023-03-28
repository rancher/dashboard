import { decodeHtml } from '@shell/utils/string';

describe('fx: decodeHtml', () => {
  it('should decode HTML values from escaped string into valid markup', () => {
    const text = '&lt;i&gt;whatever&lt;/i&gt;';
    const expectation = `<i>whatever</i>`;

    const result = decodeHtml(text);

    expect(result).toStrictEqual(expectation);
  });
});
