"use strict";(self.webpackChunkrancher_ui_devkit=self.webpackChunkrancher_ui_devkit||[]).push([[7243],{5680:(e,n,t)=>{t.d(n,{xA:()=>c,yg:()=>m});var a=t(6540);function r(e,n,t){return n in e?Object.defineProperty(e,n,{value:t,enumerable:!0,configurable:!0,writable:!0}):e[n]=t,e}function i(e,n){var t=Object.keys(e);if(Object.getOwnPropertySymbols){var a=Object.getOwnPropertySymbols(e);n&&(a=a.filter((function(n){return Object.getOwnPropertyDescriptor(e,n).enumerable}))),t.push.apply(t,a)}return t}function o(e){for(var n=1;n<arguments.length;n++){var t=null!=arguments[n]?arguments[n]:{};n%2?i(Object(t),!0).forEach((function(n){r(e,n,t[n])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(t)):i(Object(t)).forEach((function(n){Object.defineProperty(e,n,Object.getOwnPropertyDescriptor(t,n))}))}return e}function s(e,n){if(null==e)return{};var t,a,r=function(e,n){if(null==e)return{};var t,a,r={},i=Object.keys(e);for(a=0;a<i.length;a++)t=i[a],n.indexOf(t)>=0||(r[t]=e[t]);return r}(e,n);if(Object.getOwnPropertySymbols){var i=Object.getOwnPropertySymbols(e);for(a=0;a<i.length;a++)t=i[a],n.indexOf(t)>=0||Object.prototype.propertyIsEnumerable.call(e,t)&&(r[t]=e[t])}return r}var l=a.createContext({}),p=function(e){var n=a.useContext(l),t=n;return e&&(t="function"==typeof e?e(n):o(o({},n),e)),t},c=function(e){var n=p(e.components);return a.createElement(l.Provider,{value:n},e.children)},g="mdxType",d={inlineCode:"code",wrapper:function(e){var n=e.children;return a.createElement(a.Fragment,{},n)}},y=a.forwardRef((function(e,n){var t=e.components,r=e.mdxType,i=e.originalType,l=e.parentName,c=s(e,["components","mdxType","originalType","parentName"]),g=p(t),y=r,m=g["".concat(l,".").concat(y)]||g[y]||d[y]||i;return t?a.createElement(m,o(o({ref:n},c),{},{components:t})):a.createElement(m,o({ref:n},c))}));function m(e,n){var t=arguments,r=n&&n.mdxType;if("string"==typeof e||r){var i=t.length,o=new Array(i);o[0]=y;var s={};for(var l in n)hasOwnProperty.call(n,l)&&(s[l]=n[l]);s.originalType=e,s[g]="string"==typeof e?e:r,o[1]=s;for(var p=2;p<i;p++)o[p]=t[p];return a.createElement.apply(null,o)}return a.createElement.apply(null,t)}y.displayName="MDXCreateElement"},8352:(e,n,t)=>{t.r(n),t.d(n,{assets:()=>l,contentTitle:()=>o,default:()=>d,frontMatter:()=>i,metadata:()=>s,toc:()=>p});var a=t(8168),r=(t(6540),t(5680));const i={},o="Extensions configuration",s={unversionedId:"extensions/extensions-configuration",id:"extensions/extensions-configuration",title:"Extensions configuration",description:"Follow instructions here to scaffold your extension. This will assist you in the creation of an extension as a top-level product inside Rancher Dashboard.",source:"@site/docs/extensions/extensions-configuration.md",sourceDirName:"extensions",slug:"/extensions/extensions-configuration",permalink:"/dashboard/extensions/extensions-configuration",draft:!1,tags:[],version:"current",lastUpdatedAt:1711357089,formattedLastUpdatedAt:"Mar 25, 2024",frontMatter:{},sidebar:"mainSidebar",previous:{title:"Getting Started",permalink:"/dashboard/extensions/extensions-getting-started"},next:{title:"Extensions API",permalink:"/dashboard/extensions/api/overview"}},l={},p=[{value:"Extension Package Metadata",id:"extension-package-metadata",level:2},{value:"Configurable Annotations",id:"configurable-annotations",level:3},{value:"Example Configuration",id:"example-configuration",level:3}],c={toc:p},g="wrapper";function d(e){let{components:n,...t}=e;return(0,r.yg)(g,(0,a.A)({},c,t,{components:n,mdxType:"MDXLayout"}),(0,r.yg)("h1",{id:"extensions-configuration"},"Extensions configuration"),(0,r.yg)("p",null,"Follow instructions ",(0,r.yg)("a",{parentName:"p",href:"/dashboard/extensions/extensions-getting-started"},"here")," to scaffold your extension. This will assist you in the creation of an extension as a top-level product inside Rancher Dashboard."),(0,r.yg)("p",null,"Once you've done so, there are some initialization steps specific to extensions. Beyond that, extensions largely work the same as the rest of the dashboard. There are a set of top-level folders that can be defined and used as they are in the dashboard: ",(0,r.yg)("inlineCode",{parentName:"p"},"chart"),", ",(0,r.yg)("inlineCode",{parentName:"p"},"cloud-credential"),", ",(0,r.yg)("inlineCode",{parentName:"p"},"content"),", ",(0,r.yg)("inlineCode",{parentName:"p"},"detail"),", ",(0,r.yg)("inlineCode",{parentName:"p"},"edit"),", ",(0,r.yg)("inlineCode",{parentName:"p"},"list"),", ",(0,r.yg)("inlineCode",{parentName:"p"},"machine-config"),", ",(0,r.yg)("inlineCode",{parentName:"p"},"models"),", ",(0,r.yg)("inlineCode",{parentName:"p"},"promptRemove"),", ",(0,r.yg)("inlineCode",{parentName:"p"},"l10n"),", ",(0,r.yg)("inlineCode",{parentName:"p"},"windowComponents"),", ",(0,r.yg)("inlineCode",{parentName:"p"},"dialog"),", and ",(0,r.yg)("inlineCode",{parentName:"p"},"formatters"),". You can read about what each of these folders does ",(0,r.yg)("a",{parentName:"p",href:"/dashboard/code-base-works/directory-structure"},"here"),"."),(0,r.yg)("h2",{id:"extension-package-metadata"},"Extension Package Metadata"),(0,r.yg)("p",null,"Each extension package has the ability to customize certain aspects when it comes to compatibility with Rancher Manager/Kubernetes or displaying extension names. These are determined by the ",(0,r.yg)("inlineCode",{parentName:"p"},"rancher.annotations")," object applied to the ",(0,r.yg)("inlineCode",{parentName:"p"},"package.json")," of an extension package."),(0,r.yg)("p",null,"These annotations allow you to specify compatibility with Kubernetes, Rancher Manager, the Extensions API, and the Rancher UI version by relying on ",(0,r.yg)("a",{parentName:"p",href:"https://www.npmjs.com/package/semver/v/6.3.0#ranges"},"semver ranges"),'. As well as version compatibility, you can also specify a Display Name for the Extension package as it appears on the "Extensions" page within the UI.'),(0,r.yg)("h3",{id:"configurable-annotations"},"Configurable Annotations"),(0,r.yg)("table",null,(0,r.yg)("thead",{parentName:"table"},(0,r.yg)("tr",{parentName:"thead"},(0,r.yg)("th",{parentName:"tr",align:null},"Annotation"),(0,r.yg)("th",{parentName:"tr",align:"center"},"Value"),(0,r.yg)("th",{parentName:"tr",align:null},"Description"))),(0,r.yg)("tbody",{parentName:"table"},(0,r.yg)("tr",{parentName:"tbody"},(0,r.yg)("td",{parentName:"tr",align:null},(0,r.yg)("inlineCode",{parentName:"td"},"catalog.cattle.io/kube-version")),(0,r.yg)("td",{parentName:"tr",align:"center"},(0,r.yg)("inlineCode",{parentName:"td"},"Range")),(0,r.yg)("td",{parentName:"tr",align:null},"Determines if the Kubernetes version that Rancher Manager is utilizing is compatible with the Extension package.")),(0,r.yg)("tr",{parentName:"tbody"},(0,r.yg)("td",{parentName:"tr",align:null},(0,r.yg)("inlineCode",{parentName:"td"},"catalog.cattle.io/rancher-version")),(0,r.yg)("td",{parentName:"tr",align:"center"},(0,r.yg)("inlineCode",{parentName:"td"},"Range")),(0,r.yg)("td",{parentName:"tr",align:null},"Determines the compatibility of the installed Rancher Manager version with the Extension package.")),(0,r.yg)("tr",{parentName:"tbody"},(0,r.yg)("td",{parentName:"tr",align:null},(0,r.yg)("inlineCode",{parentName:"td"},"catalog.cattle.io/ui-extensions-version")),(0,r.yg)("td",{parentName:"tr",align:"center"},(0,r.yg)("inlineCode",{parentName:"td"},"Range")),(0,r.yg)("td",{parentName:"tr",align:null},"Determines the Extensions API version that is compatible with the Extension package.")),(0,r.yg)("tr",{parentName:"tbody"},(0,r.yg)("td",{parentName:"tr",align:null},(0,r.yg)("inlineCode",{parentName:"td"},"catalog.cattle.io/ui-version")),(0,r.yg)("td",{parentName:"tr",align:"center"},(0,r.yg)("inlineCode",{parentName:"td"},"Range")),(0,r.yg)("td",{parentName:"tr",align:null},"Determines the Rancher UI version that is compatible with the Extension package.")),(0,r.yg)("tr",{parentName:"tbody"},(0,r.yg)("td",{parentName:"tr",align:null},(0,r.yg)("inlineCode",{parentName:"td"},"catalog.cattle.io/display-name")),(0,r.yg)("td",{parentName:"tr",align:"center"},(0,r.yg)("inlineCode",{parentName:"td"},"String")),(0,r.yg)("td",{parentName:"tr",align:null},'Specifies the Display Name for an Extension package\'s card on the "Extensions" page.')))),(0,r.yg)("h3",{id:"example-configuration"},"Example Configuration"),(0,r.yg)("p",null,"Here's an example configuration of an extensions ",(0,r.yg)("inlineCode",{parentName:"p"},"package.json"),":"),(0,r.yg)("p",null,(0,r.yg)("strong",{parentName:"p"},(0,r.yg)("em",{parentName:"strong"},(0,r.yg)("inlineCode",{parentName:"em"},"./pkg/my-package/package.json")))),(0,r.yg)("pre",null,(0,r.yg)("code",{parentName:"pre",className:"language-json"},'{\n  "name": "my-package",\n  "description": "my-package plugin description",\n  "version": "0.1.0",\n  "rancher": {\n    "annotations": {\n      "catalog.cattle.io/kube-version": ">= v1.26.0-0 < v1.29.0-0",\n      "catalog.cattle.io/rancher-version": ">= 2.7.7-0 < 2.9.0-0",\n      "catalog.cattle.io/ui-extensions-version": ">= 1.1.0",\n      "catalog.cattle.io/ui-version": ">= 2.7.7-0 < 2.9.0-0",\n      "catalog.cattle.io/display-name": "My Super Great Extension"\n    }\n  },\n  ...\n}\n')))}d.isMDXComponent=!0}}]);