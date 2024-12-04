import axios from "axios";
import { onErrorResponse, onRequest, onResponse } from "./AxiosHandlers";

export class AccessToken {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    private readonly access_token: string;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    private readonly token_type: string;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    private readonly expires_in: number;
    private readonly scope: string;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    private readonly tenant_id: string;
    private readonly pod: string;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    private readonly strong_auth_supported: boolean;
    private readonly org: string;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    private readonly identity_id: string;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    private readonly user_name: string;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    private readonly strong_auth: boolean;
    private readonly jti: string;

    public get accessToken(): string {
        return this.access_token;
    }
    public get expiresIn(): Date {
        const expires = new Date();
        expires.setSeconds(expires.getSeconds() + this.expires_in);
        return expires;
    }

}


export class OAuth2Client {

    /**
     * Constructor
     */
    constructor(
        private clientId: string,
        private clientSecret: string,
        private tokenUrl: string,
    ) {

    }


    public async getAccessToken(): Promise<AccessToken> {
        const params = new URLSearchParams({
            // eslint-disable-next-line @typescript-eslint/naming-convention
            "grant_type": "client_credentials",
            // eslint-disable-next-line @typescript-eslint/naming-convention
            "client_id": this.clientId,
            // eslint-disable-next-line @typescript-eslint/naming-convention
            "client_secret": this.clientSecret,
        });


        try {
            const instance =  axios.create();
            instance.interceptors.request.use(
                onRequest);
            instance.interceptors.response.use(
                onResponse,
                (error) => onErrorResponse(error, instance)
            );


            const { data, status } = await instance.post<AccessToken>(this.tokenUrl, params);
            if (status === 200) {
                const token = Object.assign(new AccessToken(), data);
                return token;
            } else {
                // TODO: better error management
                throw new Error("Unauthorized");
            }
        } catch (error) {
            console.error("Unable to fetch access token. Aborting.");
            throw new Error(error);
        }
    }
}