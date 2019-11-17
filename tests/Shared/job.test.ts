import { Job } from "../../src/Shared/job";
import { IProgress, JobStatus, JobWork } from "../../src/Shared/jobInterfaces";

class MockJobWork extends JobWork {
  public doWork = jest.fn();
}

describe("Job.ts", () => {
  test("should return job object in ready state", async () => {
    // Arrange
    const testId = "TEST";
    const mockJobWork = new MockJobWork();

    // Act
    const job = new Job(testId, mockJobWork);
    const jobStatus = job.status;

    // Assert
    expect(jobStatus.id).toEqual(testId);
    expect(jobStatus.status).toEqual(JobStatus.Ready);
  });

  test("start() should set state to running and mark start time", async () => {
    // Arrange
    const testId = "TEST";
    const mockJobWork = new MockJobWork();

    // Act
    const job = new Job(testId, mockJobWork);
    job.start({});
    const jobStatus = job.status;

    // Assert
    expect(mockJobWork.doWork).toHaveBeenCalled();
    expect(jobStatus.startTime).not.toEqual(0);
    expect(jobStatus.endTime).toEqual(0);
    expect(jobStatus.runTime).toEqual(0);
    expect(jobStatus.status).toEqual(JobStatus.Running);
    expect(jobStatus.result).toBeNull();
  });

  test("complete() should set state to complete, end times, and result", async () => {
    // Arrange
    const testResult = { TEST: "TEST_RESULT" };
    const testId = "TEST";
    const mockJobWork = new MockJobWork();

    // Act
    const job = new Job(testId, mockJobWork);
    job.start({});
    job.complete(testResult);
    const jobStatus = job.status;

    // Assert
    expect(jobStatus.endTime).not.toEqual(0);
    expect(jobStatus.status).toEqual(JobStatus.Complete);
    expect(jobStatus.result).toEqual(testResult);
    expect(job.result).toEqual(testResult);
  });

  test("fault() should set state to faulted and set error message", async () => {
    // Arrange
    const testFault = "TEST_FAULT";
    const testId = "TEST";
    const mockJobWork = new MockJobWork();

    // Act
    const job = new Job(testId, mockJobWork);
    job.start({});
    job.fault(testFault);
    const jobStatus = job.status;

    // Assert
    expect(jobStatus.endTime).not.toEqual(0);
    expect(jobStatus.status).toEqual(JobStatus.Faulted);
    expect(jobStatus.progress.message).toEqual(testFault);
  });

  test("fault() should allow faulting with an error object", async () => {
    // Arrange
    const testFault = new Error("TEST_FAULT");
    const testId = "TEST";
    const mockJobWork = new MockJobWork();

    // Act
    const job = new Job(testId, mockJobWork);
    job.start({});
    job.fault(testFault);
    const jobStatus = job.status;

    // Assert
    expect(jobStatus.progress.message).toEqual(testFault.message);
  });

  test("progress should set progress object", async () => {
    // Arrange
    const testProgress: IProgress = {
      completed: 0.5,
      message: "Half",
      data: {},
    };
    const testId = "TEST";
    const mockJobWork = new MockJobWork();

    // Act
    const job = new Job(testId, mockJobWork);
    job.start({});
    job.progress = testProgress;
    const jobStatus = job.status;

    // Assert
    expect(jobStatus.progress).toEqual(testProgress);
  });
});
