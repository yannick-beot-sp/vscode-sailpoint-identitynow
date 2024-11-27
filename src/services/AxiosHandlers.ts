import { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig, isAxiosError } from "axios";

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

export const onErrorResponse = async (error: AxiosError | Error, instance: AxiosInstance) => {
    // Only retry for HTTP 429 rate limiting error
    if (error instanceof AxiosError && isRetryable(error)) {
        console.error(
            `[ISCClient] ${error.config.method?.toUpperCase()} ${error.config.url} | Error ${error.response.status} ${error.response.statusText}`, error
        );
        // Calculate the time to wait using the 'retry-after' header then wait
        const timeToWait = await getTimeToWait(error);
        
        console.error(`[ISCClient] RETRY: waiting for ${timeToWait}ms`);
        await new Promise(resolve => setTimeout(resolve, timeToWait));
        // Retry the original request
        return instance(error.config);
    } else {
        let errorMessage = '';
        if (isAxiosError(error)) {
            const { message } = error;
            const { method, url } = error.config as AxiosRequestConfig;
            const { statusText, status, data } = error.response as AxiosResponse ?? {};

            console.error(
                `[ISCClient] ${method?.toUpperCase()} ${url} | Error ${status} ${message} | ${JSON.stringify(data)}`, error
            );
            if (data !== undefined && 'error' in data) {
                errorMessage = data.error;
                if ("error_description" in data) {
                    errorMessage += `: ${data.error_description}`;
                }
            } else if (data !== undefined && 'message' in data) {
                errorMessage = data.message;
            } else if (data !== undefined && 'messages' in data) {
                errorMessage = data.messages[0].text;
            } else if (data !== undefined && 'formatted_msg' in data) {
                errorMessage = data.formatted_msg;
            } else if (data !== undefined && 'errorMessage' in data) {
                errorMessage = data.errorMessage;
            } else {
                errorMessage = message;
            }

        } else {
            const caller = (new Error()).stack?.split("\n")[2].trim().split(" ")[1];
            console.error(`[ISCClient] ${caller?.toUpperCase()} ${error.message}`, error);
            errorMessage = error.message;
        }
        return Promise.reject(new Error(errorMessage));
    }
};

function isRetryable(error: AxiosError) {
    return (
        error.code !== 'ECONNABORTED' &&
        (!error.response ||
            // rate limit error
            error.response.status === 429 ||
            // server error
            (error.response.status >= 500 && error.response.status <= 599))
    );
}

function getTimeToWait(error: AxiosError): number {
    const retryAfter = error.response.headers['retry-after']
    if (retryAfter) {

        const parsedRetryAfter = parseInt(retryAfter)
        return Number.isNaN(parsedRetryAfter)
            ? Date.parse(retryAfter) - Date.now()
            : parsedRetryAfter * 1000
    }

    return getRandomInteger()
}

function getRandomInteger(min: number = 1000, max: number = 5000): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}