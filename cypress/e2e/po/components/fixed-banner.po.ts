import ComponentPo from '@/cypress/e2e/po/components/component.po';

export default class FixedBannerPo extends ComponentPo {
  // The banner content is in a div with the class 'banner'
  // The text is in a P element within that

  banners() {
    return this.self().find('.banner');
  }

  text(index = 0) {
    return this.self().find('.banner').eq(index).invoke('text')
      .then((text) => text.trim());
  }

  backgroundColor() {
    return this.self().find('.banner').first().should('have.css', 'background-color');
  }

  color() {
    return this.self().find('.banner').first().should('have.css', 'color');
  }

  close() {
    return this.self().find('[data-testid="banner-close"]').first().click();
  }
}
