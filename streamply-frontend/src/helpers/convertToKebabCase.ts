export const toKebabCase = (text: string) =>
  text
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_:]+/g, '-')
    .toLowerCase();
