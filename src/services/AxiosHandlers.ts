import { AxiosError, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig, isAxiosError } from "axios";

export const onErrorResponse = (error: AxiosError | Error): Promise<AxiosError> => {
    let errorMessage = '';
    if (isAxiosError(error)) {
        const { message } = error;
        const { method, url } = error.config as AxiosRequestConfig;
        const { statusText, status, data } = error.response as AxiosResponse ?? {};

        console.error(
            `[IdentityNowClient] ${method?.toUpperCase()} ${url} | Error ${status} ${message}`, error
        );

        if ('error' in data) {
            errorMessage = data.error;
            if ("error_description" in data) {
                errorMessage += `: ${data.error_description}`;
            }
        } else if ('message' in data) {
            errorMessage = data.message;
        } else if ('messages' in data) {
            errorMessage = data.messages[0].text;
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

export const onRequest = (request: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {

    const method = request.method?.toUpperCase();
    const url = request.url;
    const body = typeof request.data === 'object' ? JSON.stringify(request.data) : request.data;
    console.log(`REQUEST: ${method} ${url} ${body}`);
    return request;
};

export const onResponse = (response: AxiosResponse): AxiosResponse => {

    const status = response.status;
    const body = typeof response.data === 'object' ? JSON.stringify(response.data) : response.data;
    console.log(`RESPONSE: ${status} ${body}`);
    return response;
};