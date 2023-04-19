import HomePagePo from '~/cypress/e2e/po/pages/home.po';
import UserMenuPo from  '@/cypress/e2e/po/side-bars/user-menu.po';
import PreferencesPagePo from '@/cypress/e2e/po/pages/preferences.po';
import PagePo from '~/cypress/e2e/po/pages/page.po';
import ClusterRepoListPo from '~/cypress/e2e/po/lists/catalog.cattle.io.clusterrepo.po';
import BannersPo from '~/cypress/e2e/po/components/banners.po';

const endpoint = '/prefs'
const userMenu = new UserMenuPo();
const prefPage = new PreferencesPagePo();
const repoList = new ClusterRepoListPo('tr');

describe('Standard user can update their preferences', () => {
    beforeEach(() => {
        cy.login();
    });

    it('Can navigate to Preferences Page', () => {
        /*
        Open user menu and navigate to Preferences page
        Verify url includes endpoint '/prefs'
        Verify preference page title
        */
        HomePagePo.goTo();
        userMenu.open();
        userMenu.checkOpen();
        userMenu.clickMenuLink('Preferences');
        userMenu.checkClosed();
        cy.url().should('include', endpoint);
        prefPage.title();
    });

    it('Can select a language', () => {
        /*
        Select language and verify its preserved after page reload 
        */
        const languages = {
            '简体中文': '[lang="zh-hans"]', 
            'English': '[lang="en-us"]'
        }

        PagePo.goTo(endpoint);
        for(const [key, value] of Object.entries(languages)) {
            prefPage.dropdownMenu().open(0);
            prefPage.listBox().isOpened();
            prefPage.listBox().getListBoxItems().should('have.length', 2)
            prefPage.listBox().set(key);
            prefPage.dropdownMenu().checkOptionSelected(0, key);
            prefPage.listBox().isClosed();
            prefPage.checkLangDomElement(value);
            cy.reload();
            prefPage.dropdownMenu().checkOptionSelected(0, key);
            prefPage.checkLangDomElement(value);
        }        
    });

    it('Can select a theme', () => {
        /*
        Select theme and verify that its highlighted
        Verify selection and mode ('Light' or 'Dark') is preserved after logout/login
        */
        const themeOptions = {
            'Light': 'theme-light',
            'Dark': 'theme-dark', 
            'Auto': ''
        }
        //Set theme for 'Auto' mode based on time of day
        const hour = new Date().getHours();
        for (const key in themeOptions) {
            (key === 'Auto' && hour < 7 || hour >= 18) ? themeOptions['Auto'] = 'theme-dark' : themeOptions['Auto'] = 'theme-light'
        }
        
        PagePo.goTo(endpoint);
        for (const [key, value] of Object.entries(themeOptions)) {
            PagePo.goTo(endpoint);
            prefPage.button(key).set();
            prefPage.button(key).isSelected();
            prefPage.checkThemeDomElement(value);
            userMenu.open();
            userMenu.checkOpen();
            userMenu.clickMenuLink('Log Out');
            cy.login();
            PagePo.goTo(endpoint)
            prefPage.button(key).isSelected();  
            prefPage.checkThemeDomElement(value);
        }     
    });

    it('Can select login landing page', () => {
        /*
        Select each radio button and verify its highlighted
        Verify user is landing on correct page after login
        Verify selection is preserved after logout/login
        */
        const landingPageOptions: {[key: number]: string} = {
            0: '/home',
            1: 'c/_/manager/provisioning.cattle.io.cluster',
            // 2: '/explore' // TODO this option only works when there is an existing cluster (not for standard user)
        }

        for(const [key, value] of Object.entries(landingPageOptions)) {
            PagePo.goTo(endpoint);
            prefPage.radioButton().set(key)
            prefPage.radioButton().isChecked(key)

            // if key is 1, navigate to cluster manager page and then do validations, else just do validations
            if (key == 1) {
                cy.intercept('GET', '/v3/clusters').as('clusters')
                PagePo.goTo('c/_/manager/provisioning.cattle.io.cluster')
                cy.wait('@clusters').its('response.statusCode').should('eq', 200)
            }
            
            userMenu.open();
            userMenu.checkOpen();
            userMenu.clickMenuLink('Log Out');
            cy.login();
            cy.visit(Cypress.config().baseUrl);         
            cy.url().should('include', value);  
            PagePo.goTo(endpoint);  
            prefPage.radioButton().isChecked(key);        
        }      
    });

    it('Can select date format', () => {
          /* 
        Select each option
        Get values of options available and compare them to Regex
        */
        const dropBoxIndex = 2
        PagePo.goTo(endpoint)
        prefPage.dropdownMenu().open(dropBoxIndex);
        prefPage.listBox().isOpened();
        prefPage.listBox().getListBoxItems().should('have.length', 5).then(($els) => {
            const map = Cypress.$.map($els, (el) => el.innerText.trim())
            for (let i in map) {
                // expect(map[i]).to.match(/([0-9]+(:[0-9]+)+)/)
                prefPage.listBox().set(map[i]);
                prefPage.listBox().isClosed();
                prefPage.dropdownMenu().open(dropBoxIndex)
                prefPage.listBox().isOpened();
            }     
        })
    });

    it('Can select time format', () => {
        /* 
        Select each option
        Get values of options available and compare them to Regex
        */
        const dropBoxIndex = 3
        PagePo.goTo(endpoint)
        prefPage.dropdownMenu().open(dropBoxIndex)
        prefPage.listBox().isOpened();
        prefPage.listBox().getListBoxItems().should('have.length', 2).then(($els) => {
            const map = Cypress.$.map($els, (el) => el.innerText.trim())
            for (let i in map) {
                expect(map[i]).to.match(/([0-9]+(:[0-9]+)+)/)
                prefPage.listBox().set(map[i]);
                prefPage.listBox().isClosed();
                prefPage.dropdownMenu().open(dropBoxIndex)
                prefPage.listBox().isOpened();
            }     
        })
    });

    it('Can select Table Rows per Page', () => {
        /* 
        Select each option
        Get values of options available and compare them to 'options' list
        */
        const dropBoxIndex = 4
        const options = ['10', '25', '50', '100']
        PagePo.goTo(endpoint)
        for (const i in options) {
            prefPage.dropdownMenu().open(dropBoxIndex);
            prefPage.listBox().isOpened();
            prefPage.listBox().getListBoxItems().should('have.length', 4)
            prefPage.listBox().set(options[i]);
            prefPage.dropdownMenu().checkOptionSelected(dropBoxIndex, options[i]).then(selectedOption => {
                const map = Cypress.$.map(selectedOption, (text) => text.innerText.trim())
                for (const v in map) {
                    expect(map[v]).to.eq(options[i])
                }
            })
            prefPage.listBox().isClosed();
        }
    });

    it('Can select Number of clusters to show in side menu ', () => { 
        /* 
        Select each option
        Get values of options available and compare them to 'options' list
        */
        const dropBoxIndex = 5
        const options = ['2', '3', '4', '5', '6', '7', '8', '9', '10']
        PagePo.goTo(endpoint)
        for (const i in options) {
            prefPage.dropdownMenu().open(dropBoxIndex);
            prefPage.listBox().isOpened();
            prefPage.listBox().getListBoxItems().should('have.length', 9)
            prefPage.listBox().set(options[i]);
            prefPage.dropdownMenu().checkOptionSelected(dropBoxIndex, options[i]).then(selectedOption => {
                const map = Cypress.$.map(selectedOption, (text) => text.innerText.trim())
                for (const v in map) {
                    expect(map[v]).to.eq(options[i])
                }
            })
            prefPage.listBox().isClosed();
        }
    });

    it('Can select Confirmation Setting', () => {
        /*
        Select the checkbox and verify state is preserved after logout/login
        */
        const checkboxLabel = 'Do not ask for confirmation when scaling down node pools.'
        PagePo.goTo(endpoint)
        prefPage.checkbox(checkboxLabel).set();
        prefPage.checkbox(checkboxLabel).isChecked();
        userMenu.open();
        userMenu.checkOpen();
        userMenu.clickMenuLink('Log Out');
        cy.login();
        PagePo.goTo(endpoint);
        prefPage.checkbox(checkboxLabel).set();
        prefPage.checkbox(checkboxLabel).isUnchecked();

    });

    it('Can select Enable "View in API"', () => {
        /*
        Select the checkbox and verify 'View in API' is enabled
        Deselect the checkbox and verify 'View in API' is hidden
        */
        const clusterRepoEndpoint = 'c/_/manager/catalog.cattle.io.clusterrepo'
        PagePo.goTo(endpoint)
        const checkboxLabel = 'Enable "View in API"'
        prefPage.checkbox(checkboxLabel).set();
        prefPage.checkbox(checkboxLabel).isChecked();

        cy.intercept('GET', '/v1/catalog.cattle.io.clusterrepos').as('clusterRepos')
        PagePo.goTo(clusterRepoEndpoint)
        cy.wait('@clusterRepos').its('response.statusCode').should('eq', 200)
        repoList.actionMenu('Partners').getMenuItem('View in API').should('exist');

        PagePo.goTo(endpoint)
        prefPage.checkbox(checkboxLabel).set();
        prefPage.checkbox(checkboxLabel).isUnchecked();

        PagePo.goTo(clusterRepoEndpoint)
        cy.wait('@clusterRepos').its('response.statusCode').should('eq', 200)
        repoList.actionMenu('Partners').getMenuItem('View in API').should('not.exist');
    });

    it('Can select Show system Namespaces managed by Rancher (not intended for editing or deletion)', () => {
        /*
        Select checkbox option and verify state is preserved after logout/login
        */
        PagePo.goTo(endpoint)
        const checkboxLabel = 'Show system Namespaces managed by Rancher (not intended for editing or deletion)'
        prefPage.checkbox(checkboxLabel).set();
        prefPage.checkbox(checkboxLabel).isChecked();
        userMenu.open();
        userMenu.checkOpen();
        userMenu.clickMenuLink('Log Out');
        cy.login();
        PagePo.goTo(endpoint);
        prefPage.checkbox(checkboxLabel).isChecked();
        prefPage.checkbox(checkboxLabel).set();
        prefPage.checkbox(checkboxLabel).isUnchecked();
    });

    it('Can select Enable Dark/Light Theme keyboard shortcut toggle (shift+T)', () => {
        /*
        Select checkbox option and verify state is preserved after logout/login
        */
        PagePo.goTo(endpoint)
        const checkboxLabel = 'Enable Dark/Light Theme keyboard shortcut toggle (shift+T)'
        prefPage.checkbox(checkboxLabel).set();
        prefPage.checkbox(checkboxLabel).isChecked();
        userMenu.open();
        userMenu.checkOpen();
        userMenu.clickMenuLink('Log Out');
        cy.login();
        PagePo.goTo(endpoint);
        prefPage.checkbox(checkboxLabel).isChecked();
        prefPage.checkbox(checkboxLabel).set();
        prefPage.checkbox(checkboxLabel).isUnchecked();
    });

    it('Can select Hide All Type Description Boxes', () => {
        /*
        Select the checkbox and verify description banner hidden
        Deselect the checkbox and verify description banner displays
        */
        const banners = new BannersPo();
        const clusterRepoEndpoint = 'c/_/manager/catalog.cattle.io.clusterrepo'
        const checkboxLabel = 'Hide All Type Descriptions'
        PagePo.goTo(endpoint)
        prefPage.checkbox(checkboxLabel).set();
        prefPage.checkbox(checkboxLabel).isChecked();

        cy.intercept('GET', '/v1/catalog.cattle.io.clusterrepos').as('clusterRepos')
        PagePo.goTo(clusterRepoEndpoint)
        cy.wait('@clusterRepos').its('response.statusCode').should('eq', 200)
        banners.banner().should('not.exist');

        PagePo.goTo(endpoint)
        prefPage.checkbox(checkboxLabel).set();
        prefPage.checkbox(checkboxLabel).isUnchecked();

        PagePo.goTo(clusterRepoEndpoint)
        cy.wait('@clusterRepos').its('response.statusCode').should('eq', 200)
        banners.banner().should('exist');
    });

    it('Can select a YAML Editor Key Mapping option', () => {        
        /*
        Select key mapping option and verify state is preserved after logout/login
        */
        const buttonOptions = ['Emacs', 'Vim', 'Normal human']
        PagePo.goTo(endpoint);
        for (let i in buttonOptions) {
            prefPage.button(buttonOptions[i]).set();
            prefPage.button(buttonOptions[i]).isSelected();
            userMenu.open();
            userMenu.checkOpen();
            userMenu.clickMenuLink('Log Out');
            cy.login();
            PagePo.goTo(endpoint);
            prefPage.button(buttonOptions[i]).isSelected();
        }
    });
    
    it('Can select a Helm Charts option', () => {        
        /*
        Select Helm Charts mapping option and verify state is preserved after logout/login
        */
       const buttonOptions = ['Include Prerelease Versions', 'Show Releases Only']
       for(const i in buttonOptions) {
           PagePo.goTo(endpoint);
           prefPage.button(buttonOptions[i]).set();
           prefPage.button(buttonOptions[i]).isSelected();
           userMenu.open();
           userMenu.checkOpen();
           userMenu.clickMenuLink('Log Out');
           cy.login();
           PagePo.goTo(endpoint);
           prefPage.button(buttonOptions[i]).isSelected();
        }
    });
})