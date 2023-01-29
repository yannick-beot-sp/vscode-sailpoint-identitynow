import "isomorphic-fetch";

/**
 * Make a request using isomorphic-fetch for 
 *
 * @param   {string}  method
 * @param   {string}  url
 * @param   {string}  body
 * @param   {Object}  headers
 * @returns {Promise}
 */
export function request(method: string,
    url: string,
    body: string,
    headers: any):
    Promise<{ status: number, body: string }> {
    return fetch(url, {
        body: body,
        method: method,
        headers: headers 
    }).then(function (res) {
        return res.text()
            .then(body => {
                return {
                    status: res.status,
                    body: body
                };
            });
    });
}
