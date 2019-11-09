import { Router } from 'express';

import { getJobRouter } from '../../src/Routes/getJobRouter'; 
import { Job, JobWork } from '../../src/Shared/Job';
import { ResponseStatus } from '../../src/Shared/Request';
//import { AgingCache } from '../../src/Shared/AgingCache'

//jest.mock('../../src/Shared/AgingCache');

class MockJobWork extends JobWork {
  doWork(job: Job, params: any): void {}
}

describe('getJobRouter.ts', () => {
  let router: Router | null;

  const getMockRequestResponse = () => {
    const mockResponse: any = {
      send: jest.fn(),
      status: jest.fn().mockImplementation(() => { return mockResponse; })
    }

    return {
      request: {
        params: { id: '' },
        body: { id: '' }
      },
      response: mockResponse
    }
  }

  const getRouteHandler = (path: string, method: string) => {
    if (router === null) {
      router = getJobRouter(() => new MockJobWork());
    }

    const routeLayer = router.stack.filter(function (layer) {
      return layer.route.path === path && layer.route.methods[method];
    })[0];

    return routeLayer.route.stack[0].handle;
  }

  beforeEach(() => {
    jest.resetAllMocks();
    router = null;
  })

  test('should send 400 on GET /:id when empty ID sent', async () => {
    // Arrange
    const getIdHandler = getRouteHandler('/:id', 'get');
    const mockHttp = getMockRequestResponse();

    // Act
    getIdHandler(mockHttp.request, mockHttp.response);

    // Assert
    expect(mockHttp.response.status).toHaveBeenCalledWith(400);
  })

  test('should send 404 on GET /:id when cache missing entry', async () => {
    // Arrange
    const getIdHandler = getRouteHandler('/:id', 'get');
    const mockHttp = getMockRequestResponse();
    mockHttp.request.params.id = "TEST_MISSING";

    // Act
    getIdHandler(mockHttp.request, mockHttp.response);

    // Assert
    expect(mockHttp.response.status).toHaveBeenCalledWith(404);
  })

  test.skip('should send job object on GET /:id when cache entry exist', async () => {
    // Arrange
    const getIdHandler = getRouteHandler('/:id', 'get');
    const mockHttp = getMockRequestResponse();
    mockHttp.request.params.id = "TEST_MISSING";
    
    // Act
    getIdHandler(mockHttp.request, mockHttp.response);

    // Assert
    expect(mockHttp.response.status).toHaveBeenCalledWith(200);
  })

  test('should send 400 on POST / when empty ID sent', async () => {
    // Arrange
    const getAllHandler = getRouteHandler('/', 'post');
    const mockHttp = getMockRequestResponse();

    // Act
    getAllHandler(mockHttp.request, mockHttp.response);

    // Assert
    expect(mockHttp.response.status).toHaveBeenCalledWith(400);
  })

  test.skip('should send 400 on POST / when job is complete', async () => {
    // Arrange
    const getAllHandler = getRouteHandler('/', 'post');
    const mockHttp = getMockRequestResponse();

    // Act
    getAllHandler(mockHttp.request, mockHttp.response);

    // Assert
    expect(mockHttp.response.status).toHaveBeenCalledWith(400);
  })

  test.skip('should send 400 on POST / when job already running', async () => {
    // Arrange
    const getAllHandler = getRouteHandler('/', 'post');
    const mockHttp = getMockRequestResponse();

    // Act
    getAllHandler(mockHttp.request, mockHttp.response);

    // Assert
    expect(mockHttp.response.status).toHaveBeenCalledWith(400);
  })

  test('should send success on POST / when ID valid', async () => {
    // Arrange
    const getAllHandler = getRouteHandler('/', 'post');
    const mockHttp = getMockRequestResponse();
    mockHttp.request.body.id = "TEST_ID"

    // Act
    getAllHandler(mockHttp.request, mockHttp.response);

    // Assert
    expect(mockHttp.response.send).toHaveBeenCalledWith({
      status: ResponseStatus.Success,
      message: `Job started: ${mockHttp.request.body.id}`,
      data: null
    });
  })

  test('should send list of jobs on execute GET /', async () => {
    // Arrange
    const postIdHandler = getRouteHandler('/', 'get');
    const mockHttp = getMockRequestResponse();

    // Act
    postIdHandler(mockHttp.request, mockHttp.response);

    // Assert
    expect(mockHttp.response.send).toHaveBeenCalledWith({
      status: ResponseStatus.Success,
      message: '',
      data: []
    });
  })
})
