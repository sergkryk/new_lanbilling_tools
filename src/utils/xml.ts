import converter from "xml-js";

const xmlDeclaration = {
  _attributes: {
    version: "1.0",
    encoding: "utf-8",
  },
};

const defaultOptions = {
  ignoreComment: true,
  compact: true,
};

export const convertToXml = function (responseBody: {}): string {
  const options = { ...defaultOptions, spaces: 4 };
  const xml = {
    _declaration: xmlDeclaration,
    Response: responseBody,
  };
  return converter.js2xml(xml, options);
};

export const convertToJs = function (text: string) {
  const options = {
    ...defaultOptions,
    alwaysChildren: true,
  };
  return converter.xml2js(text, options);
};
