import { getResponseObject, ResponseStatus } from "../../src/Shared/response";

describe("Request.ts", () => {
  test("getMessageObject should return standard empty response interface", () => {
    // Act
    const response = getResponseObject();

    // Assert
    expect(response.status).toEqual(ResponseStatus.Success);
    expect(response.message).toEqual("");
    expect(response.data).toEqual(null);
  });
});
