import { ISerializer } from "@linkedmink/multilevel-aging-cache";

import { IJob, IJobStatus, JobData } from "./JobInterfaces";

export class JobSerializer implements ISerializer<IJob> {
  serialize(data: IJob): string {
    return JSON.stringify(data.status());
  }

  deserialize(data: string): IJob {
    const dataObject = JSON.parse(data) as IJobStatus;
    return new JobData(dataObject);
  }
}
