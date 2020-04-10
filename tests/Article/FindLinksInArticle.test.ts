import fs from "fs";

import { findLinksInArticle } from "../../src/Article/FindLinksInArticle";

describe("findLinksInArticle.ts", () => {
  test("should return no links if not an HTML page", () => {
    // Act
    const links = findLinksInArticle("");

    // Assert
    expect(Object.keys(links).length).toEqual(0);
  });

  test.skip("should return links if is a Wikipedia article", () => {
    // Arrange
    const articleBuffer = fs.readFileSync("./tests/Article/SampleArticle.html");
    const articleData = articleBuffer.toString();

    // Act
    const links = findLinksInArticle(articleData);

    // Assert
    expect(Object.keys(links).length).toBeGreaterThan(0);
  });
});
