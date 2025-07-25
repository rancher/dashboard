import { useGetConfigMapDataTabProps } from '@shell/components/Resource/Detail/ResourceTabs/ConfigMapDataTab/composables';
import { base64Encode } from '@shell/utils/crypto';

describe('composables: ConfigMapDataTab', () => {
  const textData = 'This is textData';
  const binaryData = 'This is binaryData';
  const binaryDataBase64 = base64Encode(binaryData);

  it('should handle no data', () => {
    const props = useGetConfigMapDataTabProps({});

    expect(props.rows).toHaveLength(0);
  });

  it('should handle text and binary data at the same time', () => {
    const data = { text: textData };
    const bData = { binary: binaryDataBase64 };

    const props = useGetConfigMapDataTabProps({ data, binaryData: bData });

    expect(props.rows[0].key).toStrictEqual('text');
    expect(props.rows[0].value).toStrictEqual(textData);
    expect(props.rows[0].binary).toStrictEqual(false);

    expect(props.rows[1].key).toStrictEqual('binary');
    expect(props.rows[1].value).toStrictEqual(binaryData);
    expect(props.rows[1].binary).toStrictEqual(false);
  });
});
