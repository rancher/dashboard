import ComponentPo from '@/cypress/e2e/po/components/component.po';

export default class CruResourcePo extends ComponentPo {
  selectSubType(groupIndex: number, itemIndex: number) {
    return this.self().find('.subtypes-container > div')
      .eq(groupIndex).find('.item')
      .eq(itemIndex);
  }
}
