import path from "path";
import express from "express";
import { Router } from "express";
import expressWs from "express-ws";
import { IAgingCache } from "@linkedmink/multilevel-aging-cache";

import { getJobRouter } from "../../src/Routes/GetJobRouter";
import { IJobWork, IJob } from "../../src/Shared/JobInterfaces";
import { ResponseStatus } from "../../src/Models/IResponseData";

// jest.mock('../../src/Shared/AgingCache');

const app = express();
expressWs(app);

class MockJobWork implements IJobWork {
  doWork = jest.fn();
  stop = jest.fn().mockResolvedValue(undefined);
}

class MockAgingCache implements IAgingCache<string, IJob> {
  get = jest.fn().mockResolvedValue(null);
  set = jest.fn().mockResolvedValue(true);
  delete = jest.fn().mockResolvedValue(true);
  keys = jest.fn().mockResolvedValue([]);
  purge = jest.fn().mockResolvedValue(undefined);
}

describe(path.basename(__filename, ".test.ts"), () => {
  let router: Router | null;

  const getMockRequestResponse = (): any => {
    const mockResponse: any = {
      send: jest.fn(),
      status: jest.fn().mockImplementation(() => mockResponse),
    };

    const mockWebSocket: any = {
      send: jest.fn(),
      on: jest.fn(),
    };

    return {
      request: {
        ws: mockWebSocket,
        params: { id: "" },
        body: { id: "" },
      },
      response: mockResponse,
    };
  };

  const getRouteHandler = (path: string, method: string): any => {
    if (router === null) {
      router = getJobRouter(new MockAgingCache(), () => new MockJobWork());
    }

    const routeLayer = router.stack.filter(layer => {
      return layer.route.path === path && layer.route.methods[method];
    })[0];

    return routeLayer.route.stack[0].handle;
  };

  beforeEach(() => {
    jest.resetAllMocks();
    router = null;
  });

  test("should send 400 on GET /:id when empty ID sent", () => {
    // Arrange
    const getIdHandler = getRouteHandler("/:id", "get");
    const mockHttp = getMockRequestResponse();

    // Act
    getIdHandler(mockHttp.request, mockHttp.response);

    // Assert
    expect(mockHttp.response.status).toHaveBeenCalledWith(400);
  });

  test.skip("should send 404 on GET /:id when cache missing entry", () => {
    // Arrange
    const getIdHandler = getRouteHandler("/:id", "get");
    const mockHttp = getMockRequestResponse();
    mockHttp.request.params.id = "TEST_MISSING";

    // Act
    getIdHandler(mockHttp.request, mockHttp.response);

    // Assert
    expect(mockHttp.response.status).toHaveBeenCalledWith(404);
  });

  test.skip("should send job object on GET /:id when cache entry exist", () => {
    // Arrange
    const getIdHandler = getRouteHandler("/:id", "get");
    const mockHttp = getMockRequestResponse();
    mockHttp.request.params.id = "TEST_MISSING";

    // Act
    getIdHandler(mockHttp.request, mockHttp.response);

    // Assert
    expect(mockHttp.response.status).toHaveBeenCalledWith(200);
  });

  test("should send 400 on POST / when empty ID sent", () => {
    // Arrange
    const getAllHandler = getRouteHandler("/", "post");
    const mockHttp = getMockRequestResponse();
    mockHttp.request.body.id = undefined;

    // Act
    getAllHandler(mockHttp.request, mockHttp.response);

    // Assert
    expect(mockHttp.response.status).toHaveBeenCalledWith(400);
  });

  test.skip("should send 400 on POST / when job is complete", () => {
    // Arrange
    const getAllHandler = getRouteHandler("/", "post");
    const mockHttp = getMockRequestResponse();

    // Act
    getAllHandler(mockHttp.request, mockHttp.response);

    // Assert
    expect(mockHttp.response.status).toHaveBeenCalledWith(400);
  });

  test.skip("should send 400 on POST / when job already running", () => {
    // Arrange
    const getAllHandler = getRouteHandler("/", "post");
    const mockHttp = getMockRequestResponse();

    // Act
    getAllHandler(mockHttp.request, mockHttp.response);

    // Assert
    expect(mockHttp.response.status).toHaveBeenCalledWith(400);
  });

  test.skip("should send success on POST / when ID valid", () => {
    // Arrange
    const getAllHandler = getRouteHandler("/", "post");
    const mockHttp = getMockRequestResponse();
    mockHttp.request.body.id = "TEST_ID";

    // Act
    getAllHandler(mockHttp.request, mockHttp.response);

    // Assert
    expect(mockHttp.response.send).toHaveBeenCalledWith({
      status: ResponseStatus.Success,
      message: `Job started: ${mockHttp.request.body.id}`,
      data: null,
    });
  });

  test.skip("should send list of jobs on execute GET /", () => {
    // Arrange
    const postIdHandler = getRouteHandler("/", "get");
    const mockHttp = getMockRequestResponse();

    // Act
    postIdHandler(mockHttp.request, mockHttp.response);

    // Assert
    expect(mockHttp.response.send).toHaveBeenCalledWith({
      status: ResponseStatus.Success,
      message: "",
      data: [],
    });
  });

  test("should handle connection ", () => {
    // Arrange
    const getProgressHandler = getRouteHandler(
      "/job/progress/.websocket",
      "get"
    );
    const mockHttp = getMockRequestResponse();

    // Act
    getProgressHandler(mockHttp.request, mockHttp.response, jest.fn());

    // Assert
    expect(mockHttp.request.ws.on).toHaveBeenCalled();
  });
});
