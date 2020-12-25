import path from "path";
import { ArticleJobWork } from "../../src/Article/ArticleJobWork";

describe(path.basename(__filename, ".test.ts"), () => {
  test("should return work object", () => {
    // Act
    const work = new ArticleJobWork();

    // Assert
    expect(work).toBeDefined();
  });
});
