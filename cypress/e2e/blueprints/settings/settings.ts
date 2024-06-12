const settingTemplate = {
  type:       'management.cattle.io.setting',
  apiVersion: 'management.cattle.io/v3',
  kind:       'Setting',
  metadata:   { name: 'setting' },
  value:      ''
};

export type BooleanString = 'true' | 'false';

export type Banner = {
  background?: string;
  color?: string;
  textAlignment?: string;
  fontWeight?: string;
  fontStyle?: string;
  fontSize?: string;
  textDecoration?: string;
  text?: string;
};

export type Banners = {
  bannerHeader?: Banner;
  bannerFooter?: Banner;
  bannerConsent?: Banner;
  showFooter: BooleanString;
  showHeader: BooleanString;
  showConsent: BooleanString;
};

export function makeSetting(name: string, obj: Banner): any {
  const setting = { ...settingTemplate };

  setting.metadata.name = name;
  setting.value = JSON.stringify(obj);

  return setting;
}
