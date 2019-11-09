import { ArticleJobWork } from '../../src/Article/ArticleJobWork';

describe('ArticleJobWork.ts', () => {
  test('should return work object', async () => {
    // Arrange
    const testId = 'TEST';

    // Act
    const work = new ArticleJobWork();

    // Assert
    expect(work).toBeDefined();
  })

  test.skip('should download article on doWork()', async () => {
    // Arrange
    const testId = 'TEST';

    // Act
    const work = new ArticleJobWork();

    // Assert
    expect(work).toBeDefined();
  })

  test.skip('should fault on HTTP error', async () => {
    // Arrange
    const testId = 'TEST';

    // Act
    const work = new ArticleJobWork();

    // Assert
    expect(work).toBeDefined();
  })

  test.skip('should recursively download from initial article', async () => {
    // Arrange
    const testId = 'TEST';

    // Act
    const work = new ArticleJobWork();

    // Assert
    expect(work).toBeDefined();
  })

})
