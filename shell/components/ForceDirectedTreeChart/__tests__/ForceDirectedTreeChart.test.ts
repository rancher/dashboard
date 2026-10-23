import { shallowMount } from '@vue/test-utils';
import ForceDirectedTreeChart from '@shell/components/ForceDirectedTreeChart/index.vue';
import * as reveal from '@components/utils/reveal';

// d3 ships as ESM only, which jest does not transform. select() is the only call these tests rely on;
// it wraps the real DOM node so zoomFit can measure it, and chains anything else
jest.mock('d3', () => {
  const chain = (el: Element | null = null): Record<string, unknown> => new Proxy({}, { get: (_, prop) => (prop === 'node' ? () => el : () => chain(el)) });

  return {
    select:       (selector: string) => chain(document.querySelector(selector)),
    zoomIdentity: chain(),
  };
});

type ChartVm = { zoomFit: () => void; isZoomFitPending: boolean };

describe('component: ForceDirectedTreeChart', () => {
  let observeReveal: jest.SpyInstance;
  let stopObservingReveal: jest.Mock;

  const fdcConfig = {
    chartWidth: 800, chartHeight: 600, watcherProp: 'data', checkSchemaPermissions: () => Promise.resolve(false)
  };

  const mountChart = () => shallowMount(ForceDirectedTreeChart, { props: { data: [], fdcConfig } });

  const onReveal = () => observeReveal.mock.calls[0][1] as () => void;

  /** zoomFit reads the chart's drawn size from the page's .root-node */
  const addRootNode = (width: number, height: number) => {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    const node = document.createElementNS('http://www.w3.org/2000/svg', 'g');

    node.setAttribute('class', 'root-node');
    node.getBoundingClientRect = () => ({ width, height } as DOMRect);
    (node as unknown as { getBBox: () => DOMRect }).getBBox = () => ({ x: 0, y: 0 } as DOMRect);
    svg.appendChild(node);
    document.body.appendChild(svg);

    return svg;
  };

  beforeEach(() => {
    stopObservingReveal = jest.fn();
    observeReveal = jest.spyOn(reveal, 'observeReveal').mockReturnValue(stopObservingReveal);
  });

  afterEach(() => {
    observeReveal.mockRestore();
    document.body.innerHTML = '';
  });

  it('should watch the chart for being shown', () => {
    const wrapper = mountChart();

    expect(observeReveal).toHaveBeenCalledWith(wrapper.element, expect.any(Function));
  });

  it('should leave the zoom fit pending when the chart has no size to fit', () => {
    const wrapper = mountChart();
    const vm = wrapper.vm as unknown as ChartVm;

    addRootNode(0, 0);
    vm.zoomFit();

    expect(vm.isZoomFitPending).toBe(true);
  });

  it('should fit the zoom when shown with a fit pending', () => {
    const wrapper = mountChart();
    const vm = wrapper.vm as unknown as ChartVm;
    const zoomFit = jest.spyOn(vm, 'zoomFit').mockImplementation(() => {});

    vm.isZoomFitPending = true;
    onReveal()();

    expect(zoomFit).toHaveBeenCalledWith();
  });

  it('should not fit the zoom again when shown with no fit pending, keeping the zoom the user chose', () => {
    const wrapper = mountChart();
    const vm = wrapper.vm as unknown as ChartVm;
    const zoomFit = jest.spyOn(vm, 'zoomFit').mockImplementation(() => {});

    vm.isZoomFitPending = false;
    onReveal()();

    expect(zoomFit).not.toHaveBeenCalledWith();
  });

  it('should stop watching when unmounted', () => {
    const wrapper = mountChart();

    wrapper.unmount();

    expect(stopObservingReveal).toHaveBeenCalledWith();
  });
});
