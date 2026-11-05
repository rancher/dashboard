import { readFileSync } from 'fs';
import { resolve } from 'path';
import { mount, VueWrapper } from '@vue/test-utils';
import { compileStyle, parse } from '@vue/compiler-sfc';
import Rule from '@shell/edit/networking.k8s.io.ingress/Rule.vue';
import RulePath from '@shell/edit/networking.k8s.io.ingress/RulePath.vue';

const RULE_SCOPE_ID = 'data-v-rule';

const ingress = {
  showPathType:        true,
  serviceNamePath:     'service.name',
  servicePortPath:     'service.port.number',
  servicePortNamePath: 'service.port.name',
};

const ruleWithServicePort = {
  host: 'example.com',
  http: {
    paths: [{
      path:     '/test',
      pathType: 'Prefix',
      backend:  { service: { name: 'web', port: { number: 80 } } },
    }],
  },
};

const serviceTargets = [{
  label: 'web', value: 'web', ports: [80],
}];

const compileRuleStyles = (): string => {
  const filename = resolve(__dirname, '../Rule.vue');
  const { descriptor } = parse(readFileSync(filename, 'utf8'), { filename });

  return descriptor.styles.map((style) => {
    const { code, errors } = compileStyle({
      id:             RULE_SCOPE_ID,
      filename,
      source:         style.content,
      scoped:         style.scoped,
      preprocessLang: style.lang as 'scss',
    });

    if (errors.length) {
      throw errors[0];
    }

    return code;
  }).join('\n');
};

describe('component: networking.k8s.io.ingress/Rule', () => {
  let styleTag: HTMLStyleElement;
  let wrapper: VueWrapper<any>;

  beforeAll(() => {
    styleTag = document.createElement('style');
    styleTag.textContent = compileRuleStyles();
    document.head.appendChild(styleTag);
  });

  afterAll(() => {
    styleTag.remove();
  });

  beforeEach(() => {
    wrapper = mount(Rule, {
      props: {
        value: ruleWithServicePort, serviceTargets, ingress,
      },
      attachTo: document.body,
    });

    wrapper.findComponent(RulePath).element.setAttribute(RULE_SCOPE_ID, '');
  });

  afterEach(() => {
    wrapper.unmount();
  });

  it.each([
    ['target service', '.col.span-3 .unlabeled-select'],
    ['port', '.col.span-2 .unlabeled-select'],
  ])('lets the path %s select shrink to its column so it cannot cover the remove button', (_, selector) => {
    const select = wrapper.find(`.rule-path ${ selector }`);

    expect(select.exists()).toBe(true);
    expect(window.getComputedStyle(select.element).minWidth).toStrictEqual('0');
  });

  it('does not override the minimum width of the path type select', () => {
    const select = wrapper.find('.rule-path .in-input.unlabeled-select');

    expect(select.exists()).toBe(true);
    expect(window.getComputedStyle(select.element).minWidth).toStrictEqual('');
  });
});
