import { AxiosRequestConfig } from 'axios';

// Augment the AxiosRequestConfig type to include the custom __retryCount property
declare module 'axios' {
  interface AxiosRequestConfig {
    __retryCount?: number;
  }
}