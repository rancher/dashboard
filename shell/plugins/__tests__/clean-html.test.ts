import { purifyHTML, addLinkInterceptor, removeLinkInterceptor, processLink } from '@shell/plugins/clean-html';

describe('purifyHTML', () => {
  it.each([
    {
      desc:     'strips disallowed script tags including their content',
      input:    '<script>alert(1)</script><p>hello</p>',
      expected: '<p>hello</p>',
    },
    {
      desc:     'strips disallowed tags but keeps their text content',
      input:    '<marquee>alert(1)</marquee><p>hello</p>',
      expected: 'alert(1)<p>hello</p>',
    },
    {
      desc:     'keeps allowed tags from the default ALLOWED_TAGS list',
      input:    '<div><strong>bold</strong><em>em</em></div>',
      expected: '<div><strong>bold</strong><em>em</em></div>',
    },
    {
      desc:     'strips disallowed attributes like onclick',
      input:    '<p onclick="alert(1)">text</p>',
      expected: '<p>text</p>',
    },
  ])('$desc', ({ input, expected }) => {
    expect(purifyHTML(input)).toStrictEqual(expected);
  });

  it('respects a custom options object overriding ALLOWED_TAGS', () => {
    const out = purifyHTML('<center>x</center><p>y</p>', { ALLOWED_TAGS: ['p'] });

    expect(out).toStrictEqual('x<p>y</p>');
  });

  it('keeps target="_blank" on anchor tags and adds safe rel values', () => {
    const out = purifyHTML('<a href="https://example.com" target="_blank">link</a>');

    expect(out).toStrictEqual('<a href="https://example.com" target="_blank" rel="noopener noreferrer nofollow">link</a>');
  });

  it('merges existing rel values with the forced safe values without duplicating them', () => {
    const out = purifyHTML('<a href="https://example.com" target="_blank" rel="noopener external">link</a>');

    expect(out).toStrictEqual('<a href="https://example.com" target="_blank" rel="noopener noreferrer nofollow external">link</a>');
  });

  it('does not add rel attributes to anchors without target="_blank"', () => {
    const out = purifyHTML('<a href="https://example.com">link</a>');

    expect(out).toStrictEqual('<a href="https://example.com">link</a>');
  });
});

describe('link interceptors', () => {
  afterEach(() => {
    // processLink has no public way to clear the module-level array directly, so remove every
    // interceptor this suite might have registered to avoid leaking into other tests.
    [firstInterceptor, secondInterceptor, noopInterceptor].forEach((fn) => removeLinkInterceptor(fn));
  });

  const firstInterceptor = (link: string) => link.replace('http://', 'https://');
  const secondInterceptor = (link: string) => `${ link }?tracked=1`;
  const noopInterceptor = () => undefined;

  it('logs an error via console.error when registering a non-function interceptor', () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    addLinkInterceptor(null as any, 'my-interceptor');

    expect(errorSpy).toHaveBeenCalledWith('Invalid link interceptor function for my-interceptor');
    errorSpy.mockRestore();
  });

  it('logs a generic console.error when registering a non-function interceptor without a name', () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    addLinkInterceptor(undefined as any);

    expect(errorSpy).toHaveBeenCalledWith('Invalid link interceptor function');
    errorSpy.mockRestore();
  });

  it('passes a link through each registered interceptor in registration order', () => {
    addLinkInterceptor(firstInterceptor);
    addLinkInterceptor(secondInterceptor);

    expect(processLink('http://example.com')).toStrictEqual('https://example.com?tracked=1');
  });

  it('keeps the original link when an interceptor returns a falsy value', () => {
    addLinkInterceptor(noopInterceptor);

    expect(processLink('https://example.com')).toStrictEqual('https://example.com');
  });

  it('removes a previously registered interceptor so it no longer modifies links', () => {
    addLinkInterceptor(firstInterceptor);
    removeLinkInterceptor(firstInterceptor);

    expect(processLink('http://example.com')).toStrictEqual('http://example.com');
  });

  it('rewrites anchor hrefs via purifyHTML when interceptors are registered', () => {
    addLinkInterceptor(firstInterceptor);

    const out = purifyHTML('<a href="http://example.com">link</a>');

    expect(out).toStrictEqual('<a href="https://example.com/">link</a>');
  });
});
