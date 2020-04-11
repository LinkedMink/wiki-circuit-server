import { getResponseObject, ResponseStatus } from "../../src/Models/IResponseData";

describe("IResponseData.ts", () => {
  test("getMessageObject should return standard empty response interface", () => {
    // Act
    const response = getResponseObject();

    // Assert
    expect(response.status).toEqual(ResponseStatus.Success);
    expect(response.data).toEqual(null);
  });
});
