import { CODEMIRROR_PACKAGES, stubSource, stubModules, replacementFor } from '@shell/pkg/shared-codemirror';

/**
 * Evaluates a stub as webpack would, with `require` resolving the bundled copy
 */
function evaluateStub(pkg: string, bundled: object) {
  const module = { exports: {} };
  const require = jest.fn(() => bundled);

  // eslint-disable-next-line no-new-func
  new Function('module', 'require', stubSource(pkg))(module, require);

  return { exports: module.exports, require };
}

describe('shared-codemirror', () => {
  afterEach(() => {
    delete (window as any).__codemirror;
  });

  describe('stubSource', () => {
    it('should export the host copy when the host provides one', () => {
      const host = { EditorView: 'host' };

      (window as any).__codemirror = { '@codemirror/view': host };

      const { exports } = evaluateStub('@codemirror/view', { EditorView: 'bundled' });

      expect(exports).toBe(host);
    });

    it('should not load the bundled copy when the host provides one', () => {
      (window as any).__codemirror = { '@codemirror/view': {} };

      const { require } = evaluateStub('@codemirror/view', {});

      expect(require).not.toHaveBeenCalled();
    });

    it('should export the bundled copy when the host has no shared CodeMirror', () => {
      const bundled = { EditorView: 'bundled' };

      const { exports, require } = evaluateStub('@codemirror/view', bundled);

      expect(exports).toBe(bundled);
      expect(require).toHaveBeenCalledWith('@codemirror/view');
    });

    it('should export the bundled copy when the host does not share the package', () => {
      const bundled = { vim: 'bundled' };

      (window as any).__codemirror = { '@codemirror/view': {} };

      const { exports } = evaluateStub('@replit/codemirror-vim', bundled);

      expect(exports).toBe(bundled);
    });
  });

  describe('replacementFor', () => {
    it.each(CODEMIRROR_PACKAGES)('should replace %p with its stub', (pkg) => {
      expect(Object.keys(stubModules())).toContain(`node_modules/${ replacementFor(pkg) }`);
    });

    it.each([
      '@codemirror/view/dist/index.js',
      '@codemirror/lint',
      '@lezer/highlight',
      'vue',
    ])('should not replace %p', (request) => {
      expect(replacementFor(request)).toBeUndefined();
    });
  });

  it('should not replace requests from a stub', () => {
    expect(replacementFor('@codemirror/view', '/app/node_modules/@rancher/shared-codemirror/@codemirror__view.js')).toBeUndefined();
  });

  describe('stubModules', () => {
    it('should create a stub for every shared package', () => {
      expect(Object.keys(stubModules())).toHaveLength(CODEMIRROR_PACKAGES.length);
    });
  });
});
