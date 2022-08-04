const blankPt = {
  apiVersion: 'harvesterhci.io.github.com/v1beta1',
  kind:       'PCIPassthroughRequest',
  metadata:   { },
  status:     { passthroughEnabled: false }
};

export const mockBlankPt = () => {
  return { ...blankPt };
};
