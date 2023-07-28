import ComponentPo from '@/cypress/e2e/po/components/component.po';

export default class ToggleSwitchPo extends ComponentPo {
  toggle() {
    return this.self().click();
  }

  value() {
    return this.self().find('span.active').invoke('text');
  }

  set(label: string) {
    return this.value()
      .then((value) => {
        if (value !== label) {
          return this.toggle();
        }
      })
      .then(() => this.value())
      .then((value) => expect(value).equal(label));
  }

  unCheck() {
    return this.self().find('input').uncheck({ force: true });
  }

  check() {
    return this.self().find('input').check({ force: true });
  }
}
