import { ArticleJobWork } from "../../src/Article/articleJobWork";

describe("ArticleJobWork.ts", () => {
  test("should return work object", () => {
    // Act
    const work = new ArticleJobWork();

    // Assert
    expect(work).toBeDefined();
  });
});
