import { ISerializer } from "./serializer";
import { IJob, JobData } from "./jobInterfaces";

export class JobSerializer implements ISerializer<IJob> {
  serialize(data: IJob): string {
    return JSON.stringify(data.status());
  }  
  
  deserialize(data: string): IJob {
    const dataObject = JSON.parse(data);
    return new JobData(dataObject);
  }
}
