export interface MessageHandlerData<T>  {
  requestId?: string;
  error?: any;
  data?: T;
  command: string;
  payload: T;
}