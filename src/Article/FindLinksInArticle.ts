import cheerio from "cheerio";

const wikipediaNamespaces = [
  "User:",
  "Wikipedia:",
  "File:",
  "MediaWiki:",
  "Template:",
  "Help:",
  "Category:",
  "Portal:",
  "Book:",
  "Draft:",
  "TimedText:",
  "Module:",

  "User_talk:",
  "Wikipedia_talk:",
  "File_talk:",
  "MediaWiki_talk:",
  "Template_talk:",
  "Help_talk:",
  "Category_talk:",
  "Portal_talk:",
  "Book_talk:",
  "Draft_talk:",
  "TimedText_talk:",
  "Module_talk:",

  "Special:",
];

const testWikipediaNamespaceRegEx = new RegExp(wikipediaNamespaces.join("|"));

const WIKIPEDIA_ARTICLE_PREFIX = "/wiki/";
const WIKIPEDIA_CONTENT_ID = "#mw-content-text";
const WIKIPEDIA_EXCLUDE_CONTENT_BLOCKS = "#Authority_control_files, .reflist";

export const findLinksInArticle = (text: string): { [s: string]: number } => {
  const links: { [s: string]: number } = {};

  const document = cheerio.load(text);
  document(WIKIPEDIA_CONTENT_ID)
    .find(`a[href^='${WIKIPEDIA_ARTICLE_PREFIX}']`)
    .each((index: number, element: cheerio.Element) => {
      if (
        document(element).parents(WIKIPEDIA_EXCLUDE_CONTENT_BLOCKS).length > 0
      ) {
        return;
      }

      const tag = element as cheerio.TagElement;
      const linkName = tag.attribs.href.substring(
        WIKIPEDIA_ARTICLE_PREFIX.length
      );
      if (!testWikipediaNamespaceRegEx.test(linkName)) {
        if (links[linkName] === undefined) {
          links[linkName] = 1;
        } else {
          links[linkName]++;
        }
      }
    });

  return links;
};
