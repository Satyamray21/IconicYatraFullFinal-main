// pick.js
export const pick = (object, keys) => {
    if (!object) return {};
    return keys.reduce((acc, key) => {
        if (Object.prototype.hasOwnProperty.call(object, key)) {
            acc[key] = object[key];
        }
        return acc;
    }, {});
};
