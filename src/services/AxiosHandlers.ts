import { AxiosError, AxiosRequestConfig, AxiosResponse, isAxiosError } from "axios";

export const onErrorResponse = (error: AxiosError | Error): Promise<AxiosError> => {
    let errorMessage ='';
    if (isAxiosError(error)) {
        const { message } = error;
        const { method, url } = error.config as AxiosRequestConfig;
        const { statusText, status, data } = error.response as AxiosResponse ?? {};

        console.error(
            `[IdentityNowClient] ${method?.toUpperCase()} ${url} | Error ${status} ${message}`, error
        );

        if ('error' in data) {
			errorMessage =  data.error;
		} else if ('message' in data) {
			errorMessage =  data.message;
		} else if ('messages' in data) {
			errorMessage =  data.messages[0].text;
		} else {
            errorMessage = message;
        }

    } else {
        const caller = (new Error()).stack?.split("\n")[2].trim().split(" ")[1];
        console.error(`[IdentityNowClient] ${caller?.toUpperCase()} ${error.message}`, error);
        errorMessage = error.message;
    }

    return Promise.reject(new Error(errorMessage));
};