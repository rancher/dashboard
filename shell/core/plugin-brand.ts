import { Brand, BrandTheme } from "@shell/core/types";
import { createCssVars } from '@shell/utils/color';

/**
 * Map of keys in the brand images object to file name.
 * Allows us to use nicer field names in the brand theme configuration
 */
const IMAGE_NAME_MAP: { [key: string]: string } = {
  'logo'        : 'rancher-logo',
  'errorBanner' : 'error-desert-landscape',
  'login'       : 'login-landscape',
};

/**
 * Takes a brand from an extension and:
 * - Injects CSS for the brand to set colors
 * - Adds the images from the brand
 *
 * @param brand Brand to be added
 * @param imageReg Function to register an image
 */
export function createBrand(brand: Brand, imageReg: any): void {
  // Apply dark theme as overrides to light theme
  const darkTheme = {
    ...brand.lightTheme,
    ...brand.darkTheme,
  };

  // Create the css for the theme
  createBrandTheme(brand.name, 'light', brand.lightTheme);
  createBrandTheme(brand.name, 'dark', darkTheme);
  
  // Add the images for the theme
  addBrandImages(imageReg, brand.name, 'light', brand.lightTheme);
  addBrandImages(imageReg, brand.name, 'dark', darkTheme);

  // Register fav icon
  if (brand.favicon) {
    imageReg(`brand/${ brand.name }/favicon`, brand.favicon);
  }
}

function addBrandImages(imageReg: any, name: string, theme: string, brandTheme?: BrandTheme) {
  if (brandTheme?.images) {
    for (const imgName in brandTheme.images) {
      const value = (brandTheme.images as any)[imgName];
      const themeDir = theme === 'light' ? '' : `/${ theme }`;
      const fileName = IMAGE_NAME_MAP[imgName] || imgName;
      const imageName = `brand/${ name }${ themeDir }/${ fileName }`;

      imageReg(imageName, value);
    }
  }
}

function createBrandTheme(name: string, theme: string, brandTheme?: BrandTheme): void {
  let css = `BODY.${ name }.theme-${ theme } {\n`;

  if (brandTheme?.colors) {
    for (const colorName in brandTheme.colors) {
      const value = (brandTheme.colors as any)[colorName];
      const cssVars = createCssVars(value, theme, colorName);

      css += `  /* ${ colorName } */\n`;

      for (const prop in cssVars) {
        css += `  ${ prop.trim() }: ${ cssVars[prop] };\n`;
      }

      css += '\n';
    }
  }

  css += '}';

  const style = document.createElement('style');

  style.textContent = css;

  document.head.append(style);  
}
