import { ref } from 'vue';
import { useCompactInput } from './useCompactInput';

describe('useCompactInput', () => {
  it('should compute isCompact correctly when compact is explicitly set', () => {
    const props = ref({
      compact:  true,
      label:    'Test Label',
      labelKey: 'testLabel',
    });

    const { isCompact } = useCompactInput(props.value);

    expect(isCompact.value).toBe(true);

    // When compact is explicitly set to false, isCompact should be false
    props.value.compact = false;
    expect(isCompact.value).toBe(false);
  });

  it('should compute isCompact correctly when compact is not explicitly set', () => {
    const props = ref({
      label:    '',
      labelKey: '',
    });

    const { isCompact } = useCompactInput(props.value);

    // When there is no label and labelKey is also not present, isCompact should be true
    expect(isCompact.value).toBe(true);

    // When label is present, isCompact should be false
    props.value.label = 'Updated Label';
    expect(isCompact.value).toBe(false);
  });
});
