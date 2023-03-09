import * as _ from "lodash";

function unwind(arr1: string[], obj: any): any {
    const [firstProp, ...restProps] = arr1;
    if (restProps.length === 0) {
        let values = _.get(obj, firstProp);
        if (values === undefined || values === null) {
            return [obj];
        }
        if (!Array.isArray(values)) {
            values = [values];
        }

        return values.map((x: any) => {
            return setProp(obj, firstProp, x);
        });
    } else {
        let currentObjs = unwind(restProps, obj);
        let values = _.get(obj, firstProp);
        if (values === undefined || values === null) {
            return currentObjs;
        }
        if (!Array.isArray(currentObjs)) {
            currentObjs = [currentObjs];
        }
        let firstValue: any;
        const [firstRow, ...restRows] = currentObjs;
        if (!Array.isArray(values)) {
            firstValue = values;
            values = [firstValue];
        } else {
            firstValue = values[0];
        }
        return [
            values.map((x: any) => {
                return setProp(firstRow, firstProp, x);
            }),

            ...restRows.map((x: any) => {
                return setProp(x, firstProp, firstValue);
            })
        ].flat();
    }
}


function setProp(obj: any, path: string | string[], value: any): any {
    const pathArray = Array.isArray(path) ? path : path.split('.');
    const [key, ...restPath] = pathArray;
    return {
        ...obj,
        [key]:
            pathArray.length > 1 ? setProp(obj[key] || {}, restPath, value) : value,
    };
}

export function customUnwind(params: { paths: string[] } = { paths: [] }) {
    return (dataRow: any) =>
        unwind(params.paths, dataRow).flat(2);
}