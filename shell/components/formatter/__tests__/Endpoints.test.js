import Endpoints from '@shell/components/formatter/Endpoints.vue';

describe('component: Endpoints, computed: parsed', () => {
  it('should be null', () => {
    const localThis = {
      t:     key => key,
      value: '',
      nodes: [],
    };
    const out = Endpoints.computed.parsed.call(localThis);

    expect(out).toBeNull();
  });

  it('should display all the endpoints', () => {
    const localThis = {
      t:     key => key,
      value: '[{"addresses":["172.31.32.10","172.31.37.77","172.31.47.178"],"port":80,"protocol":"TCP","serviceName":"kube-system:traefik","allNodes":false},{"addresses":["172.31.32.10","172.31.37.77","172.31.47.178"],"port":443,"protocol":"TCP","serviceName":"kube-system:test","allNodes":false}]',
      nodes: [],
    };
    const out = Endpoints.computed.parsed.call(localThis);

    expect(out).toHaveLength(6);
    expect(out.filter(item => item.display && item.link && item.protocol)).toHaveLength(6);
  });
});
