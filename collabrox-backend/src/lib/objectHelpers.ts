const makePropsValuesAs = (obj: Record<string, any>, value: string) => {
    const newObj: any = {}
    Object.keys(obj).forEach(prop => newObj[prop] = value)
    return newObj
}

const upperCaseObjectKeys = (obj: Record<string, any>) => {
    const newObj: Record<string, any> = {};
    for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
            const upperKey = key.replace(/([A-Z])/g, '_$1').toUpperCase();
            newObj[upperKey] = obj[key];
        }
    }
    return newObj;
}

const trimmer = <T extends Record<string, any>>(obj: T, exceptions: string[]): T => {
    if (typeof obj !== 'object' || obj === null) return obj;

    return Object.keys(obj).reduce((acc, key) => {
        const value = obj[key];
        (acc as any)[key] = typeof value === 'string' && !exceptions.includes(key)
            ? value.trim()
            : value;
        return acc;
    }, { ...obj } as T);
};

export {
    makePropsValuesAs,
    upperCaseObjectKeys,
    trimmer,
}