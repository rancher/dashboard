import { useGetConfigMapDataTabProps } from '@shell/components/Resource/Detail/ResourceTabs/ConfigMapDataTab/composables';
import { base64Encode } from '@shell/utils/crypto';

describe('composables: ConfigMapDataTab', () => {
  const textData = 'This is textData';
  const asciiBinaryData = 'This is binaryData';
  const asciiBinaryBase64 = base64Encode(asciiBinaryData);
  const nonAsciiBinaryBase64 = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).toString('base64');

  it('should handle no data', () => {
    const props = useGetConfigMapDataTabProps({});

    expect(props.rows).toHaveLength(0);
  });

  it('should show ascii-decodable binaryData as decoded text', () => {
    const data = { text: textData };
    const bData = { binary: asciiBinaryBase64 };

    const props = useGetConfigMapDataTabProps({ data, binaryData: bData });

    expect(props.rows[0].key).toStrictEqual('text');
    expect(props.rows[0].value).toStrictEqual(textData);
    expect(props.rows[0].binary).toStrictEqual(false);

    expect(props.rows[1].key).toStrictEqual('binary');
    expect(props.rows[1].value).toStrictEqual(asciiBinaryData);
    expect(props.rows[1].binary).toStrictEqual(false);
  });

  it('should flag non-ascii binaryData as binary and keep the base64 value', () => {
    const bData = { image: nonAsciiBinaryBase64 };

    const props = useGetConfigMapDataTabProps({ binaryData: bData });

    expect(props.rows[0].key).toStrictEqual('image');
    expect(props.rows[0].value).toStrictEqual(nonAsciiBinaryBase64);
    expect(props.rows[0].binary).toStrictEqual(true);
  });
});
