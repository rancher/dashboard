import podDetail from '@shell/detail/pod.vue';

const { containers } = podDetail.computed;

describe('view: pod', () => {
  it('should not use 2x icon sizing in init container column', () => {
    const initContainer = { name: 'init', image: 'init:latest' };
    const appContainer = { name: 'app', image: 'app:latest' };

    const rows = containers.call({
      allContainers: [appContainer, initContainer],
      allStatuses:   [{
        name:      'app',
        ready:     true,
        state:     {},
        lastState: {}
      }, {
        name:      'init',
        ready:     false,
        state:     {},
        lastState: {}
      }],
      dateTimeFormat: () => '',
      t:              () => '',
      value:          {
        containerActions:      [],
        containerIsInit:       (container: { name: string }) => container.name === 'init',
        containerStateColor:   () => 'text-success',
        containerStateDisplay: () => 'running',
        openLogs:              jest.fn(),
        openShell:             jest.fn(),
      },
    });

    const initRow = rows.find((row: { name: string }) => row.name === 'init');
    const appRow = rows.find((row: { name: string }) => row.name === 'app');

    expect(initRow.initIcon).toBe('icon-checkmark text-success ml-5');
    expect(appRow.initIcon).toBe('icon-minus text-muted ml-5');
  });
});
