// custom-axios.d.ts (or axios.d.ts in your project)
import { AxiosRequestConfig } from 'axios';

// Augment the AxiosRequestConfig type to include custom properties
declare module 'axios' {
  interface AxiosRequestConfig {
    // Add a custom property (for example, __retryCount)
    __retryCount?: number;
  }
}