export interface ISerializer<T> {
  serialize(data: T): string;
  deserialize(data: string): T;
}

export class JsonSerializer<T extends object> implements ISerializer<T> {
  serialize(data: T): string {
    return JSON.stringify(data);
  }  
  
  deserialize(data: string): T {
    return JSON.parse(data);
  }
}
