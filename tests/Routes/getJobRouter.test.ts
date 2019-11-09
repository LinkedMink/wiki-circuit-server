import { getJobRouter } from '../../src/Routes/getJobRouter'; 
import { Job, JobWork } from '../../src/Shared/Job';

class MockJobWork extends JobWork {
  doWork(job: Job, params: any): void {}
}

const getMockResponse = () => {
  
}

describe('getJobRouter.ts', () => {
  const mockRequest = {
    params: {
      id: 'TEST'
    },
    body: {
      id: 'TEST'
    }
  }

  const mockResponse: any = {
    send: jest.fn(),
    status: jest.fn().mockImplementation(() => { return mockResponse; })
  }

  beforeEach(() => {
    jest.resetAllMocks();
  })

  test('should return router with GET /, POST /, and GET /:id', async () => {
    // Act
    const router = getJobRouter(() => new MockJobWork());

    // Assert
    const getAllRoute = router.stack.filter(function (layer) {
      return layer.route.path === '/' && layer.route.methods.get;
    })[0];

    const getIdRoute = router.stack.filter(function (layer) {
      return layer.route.path === '/:id' && layer.route.methods.get;
    })[0];

    const postIdRoute = router.stack.filter(function (layer) {
      return layer.route.path === '/' && layer.route.methods.post;
    })[0];

    expect(getAllRoute).toBeDefined();
    expect(getIdRoute).toBeDefined();
    expect(postIdRoute).toBeDefined();
  })

  test('should send on execute GET /:id', async () => {
    // Arrange
    const router = getJobRouter(() => new MockJobWork());
    const getIdRoute = router.stack.filter(function (layer) {
      return layer.route.path === '/:id' && layer.route.methods.get;
    })[0];
    const handler = getIdRoute.route.stack[0].handle;

    // Act
    handler(mockRequest, mockResponse);

    // Assert
    expect(mockResponse.send).toHaveBeenCalled();
  })

  test('should send on execute POST /', async () => {
    // Arrange
    const router = getJobRouter(() => new MockJobWork());
    const getAllRoute = router.stack.filter(function (layer) {
      return layer.route.path === '/' && layer.route.methods.get;
    })[0];
    const handler = getAllRoute.route.stack[0].handle;

    // Act
    handler(mockRequest, mockResponse);

    // Assert
    expect(mockResponse.send).toHaveBeenCalled();
  })

  test('should send on execute GET /', async () => {
    // Arrange
    const router = getJobRouter(() => new MockJobWork());
    const postIdRoute = router.stack.filter(function (layer) {
      return layer.route.path === '/' && layer.route.methods.post;
    })[0];
    const handler = postIdRoute.route.stack[0].handle;

    // Act
    handler(mockRequest, mockResponse);

    // Assert
    expect(mockResponse.send).toHaveBeenCalled();
  })
})
