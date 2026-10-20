import { mount } from '@vue/test-utils';
import TableSparkLine from '@shell/components/TableSparkLine.vue';
import * as reveal from '@components/utils/reveal';

// d3 ships as ESM only, which jest does not transform; the sparkline only needs a linear scale and a line path
jest.mock('d3', () => {
  const scaleLinear = () => {
    let domain = [0, 1];
    let range = [0, 1];
    const scale = (v: number) => range[0] + ((v - domain[0]) / (domain[1] - domain[0])) * (range[1] - range[0]);

    scale.domain = (d: number[]) => {
      domain = d;

      return scale;
    };
    scale.range = (r: number[]) => {
      range = r;

      return scale;
    };

    return scale;
  };

  const line = () => {
    let x = (d: number, i: number) => i;
    let y = (d: number) => d;
    const path = (data: number[]) => `M${ data.map((d, i) => `${ x(d, i) },${ y(d) }`).join('L') }`;

    path.x = (fn: typeof x) => {
      x = fn;

      return path;
    };
    path.y = (fn: typeof y) => {
      y = fn;

      return path;
    };

    return path;
  };

  return { scaleLinear, line };
});

describe('component: TableSparkLine', () => {
  let observeReveal: jest.SpyInstance;
  let stopObservingReveal: jest.Mock;

  // jsdom has no layout, so give the container a size to measure
  const setSize = (wrapper: ReturnType<typeof mount>, width: number, height: number) => {
    (wrapper.element as HTMLElement).getBoundingClientRect = () => ({ width, height } as DOMRect);
  };

  const svgSize = (wrapper: ReturnType<typeof mount>) => {
    const svg = wrapper.find('svg');

    return { width: svg.attributes('width'), height: svg.attributes('height') };
  };

  beforeEach(() => {
    stopObservingReveal = jest.fn();
    observeReveal = jest.spyOn(reveal, 'observeReveal').mockReturnValue(stopObservingReveal);
  });

  afterEach(() => {
    observeReveal.mockRestore();
  });

  it('should use at least the given size when the container measures smaller', async() => {
    const wrapper = mount(TableSparkLine, { props: { width: 100, height: 20 } });

    await wrapper.vm.$nextTick();

    expect(svgSize(wrapper)).toStrictEqual({ width: '100', height: '20' });
  });

  it('should watch its container for being shown', () => {
    const wrapper = mount(TableSparkLine);

    expect(observeReveal).toHaveBeenCalledWith(wrapper.element, expect.any(Function));
  });

  it('should measure again when shown after mounting hidden', async() => {
    const wrapper = mount(TableSparkLine, { props: { width: 100, height: 20 } });

    setSize(wrapper, 250, 40);
    (observeReveal.mock.calls[0][1] as () => void)();
    await wrapper.vm.$nextTick();

    expect(svgSize(wrapper)).toStrictEqual({ width: '250', height: '40' });
  });

  it('should measure its own container rather than the first one on the page', async() => {
    const other = document.createElement('div');

    other.className = 'graphContainer';
    other.getBoundingClientRect = () => ({ width: 999, height: 999 } as DOMRect);
    document.body.appendChild(other);

    const wrapper = mount(TableSparkLine, { props: { width: 100, height: 20 }, attachTo: document.body });

    await wrapper.vm.$nextTick();

    expect(svgSize(wrapper)).toStrictEqual({ width: '100', height: '20' });

    wrapper.unmount();
    other.remove();
  });

  it('should stop watching when unmounted', () => {
    const wrapper = mount(TableSparkLine);

    wrapper.unmount();

    expect(stopObservingReveal).toHaveBeenCalledWith();
  });
});
