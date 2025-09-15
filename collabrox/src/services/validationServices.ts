// Validate if a single name is at least 2 characters
const isValidSingleName = (name: string, returning = false): any =>
    returning ? name : name.length >= 2;

// Validate if full name has 2–5 words
const isValidFullName = (fullname: string, returning = false): any =>
    returning ? fullname : [2, 3, 4, 5].includes(fullname.split(' ').length);

// Basic email validation using regex
const isValidEmailAddress = (email: string, returning = false): any =>
    returning ? email : /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// Password must have upper, lower, digit, and be 8–32 characters long
const isValidPassword = (password: string, returning = false): any =>
    returning ? password : /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d.$]{8,32}/.test(password);



// Types and constants for checkValidation() starts here ---
type Validator = (val: any) => boolean
type ValidationTypes = 'singleName' | 'fullName' | 'name' | 'email' | 'password' | 'confirmPassword';
type ValidationTypesFunctions = Record<ValidationTypes | string, Validator>

// Permanent checkers (that means if user try to check any of these property, including pattern properties(ex. `petName`, `netWorth`, `getTotalCount`) inside the `permanentValidationTypesFuncs`, it will be checked)
const permanentValidationTypesFuncs: ValidationTypesFunctions = {
    singleName: isValidSingleName,
    fullName: isValidFullName,
    name: isValidFullName,
    email: isValidEmailAddress,
    password: isValidPassword,
    confirmPassword: isValidPassword,
    $name: (val) => typeof val === 'string',
    net$: (val) => typeof val === 'number',
    $total$: (val) => typeof val === 'number',
};

// Result type of checkValidation
interface CheckValidationResult {
    errors: Record<ValidationTypes | string, boolean> | false;
}



// =============== old checkValidation() ====================
// const checkValidation = (
//     propertyAndValues: Record<string, string> = {
//         singleName: 'Alex',
//         email: 'email@example.com',
//         password: 'mypassword234'
//     },
//     dontCheck: string[] = [],
//     customValidationFuncs: Record<string, (value: string) => boolean> = {}
// ): CheckValidationResult => {
//     const validationTypesFuncs = permanentValidationTypesFuncs;
//     const errors: Record<string, boolean> = {};

//     if (Object.keys(customValidationFuncs).length > 0) {
//         for (let customType in customValidationFuncs) {
//             customType = customType.toLowerCase();
//             if (/^[a-z_$]+$/i.test(customType)) {
//                 delete validationTypesFuncs[customType];
//                 validationTypesFuncs[customType] = customValidationFuncs[customType];
//             }
//         }
//     }

//     for (const [prop, value] of Object.entries(propertyAndValues)) {
//         if (!(dontCheck.includes(prop))) {
//             if (prop in validationTypesFuncs) {
//                 const isValid = validationTypesFuncs[prop](value);
//                 if (!isValid) {
//                     errors[prop] = true;
//                 }
//             } else {
//                 const typeLower = prop.toLowerCase();
//                 const setErrorIf = (fn: string) => {
//                     if (!validationTypesFuncs[fn](value)) {
//                         errors[prop] = true;
//                     }
//                 };
//                 for (let func in validationTypesFuncs) {
//                     if (func.includes('$')) {
//                         func = func.toLowerCase();
//                         if (func.startsWith('$') && countStr(func, '$') === 1 && typeLower.split(func.replaceAll('$', ''))[1] === '') {
//                             setErrorIf(func);
//                         } else if (func.endsWith('$') && countStr(func, '$') === 1 && typeLower.split(func.replaceAll('$', ''))[0] === '') {
//                             setErrorIf(func);
//                         } else if (func.startsWith('$') && func.endsWith('$') && countStr(func, '$') === 2 && typeLower.includes(func.replaceAll('$', ''))) {
//                             setErrorIf(func);
//                         }
//                     }
//                 }
//             }
//         }
//     }

//     return Object.keys(errors).length === 0
//         ? { errors: false }
//         : {
//             errors
//         };
// };
// ==========================================================











/**
* Checks validation of datas 
* @param propertyAndValues - Takes an object
* - Object that contained all property and values to check for validation.
* @default
* {
*     singleName: 'Alex',
*     email: 'emailaddress@gmail.com',
*     password: 'mypassword234'
* } 
* @param dontCheck (default = []) - Takes an array
* - Properties that should not check for validation, default is empty array [].
* @param customValidationFuncs (default = {}) - Takes an object
* - add custom validation function for properties
* - if any property's validation is not available both in default functions and param customValidationFuncs, then it will be skip, means somehow will be validated
* @Remember Pattern other than $start, end$, $include$ - other than these styles can result wrong in validation result, if you have any property with $, then input it manually, for example {have$InCash : (bool)=> typeof bool === 'boolean'}
* @example
* {
*     "username": (username) => typeof (username) === "string",
*     '$name': isValidIfEndsWithName,
*     'net$': isValidIfStartsWithNet,
*     '$total$': isNumber,
* } 
* @returns - An object
* It will return an object, given example below:
* @example
* -----------------------------------------------
* `If No error founds`;
* {errors : false}
* -----------------------------------------------
* `If at least one Errors found and parameter`;
* {
*   errors : {
*     singleName : true,
*     email : true, 
*     password : true
*   }
* }
* -----------------------------------------------
* @patterns
* ** 3 types of $patterns available for indication of dynamic properties check;
* - pattern type 1 : "$name" means some characters have before 'name', like username, petName, fatherName etc, here in all cases it will work;
* - pattern type 2 : "net$" means some characters have after 'net', like netPrice, netWorth etc, here in all cases it will work;
* - pattern type 3 : "$total$" means if 'total' included in property name, like totalResults, pagesTotal, mainTotalCounts etc, here in all cases, it will work;
*/
const checkValidation = (
    propertyAndValues: Record<string, string | number> = {
        singleName: 'Alex',
        email: 'email@example.com',
        password: 'mypassword234'
    },
    skipValidationProperties: string[] = [],
    customValidationFuncs: Record<string, Validator> = {}
): CheckValidationResult => {
    // Step 1: Filter and merge custom validators with permanent ones
    const validCustomFuncs = Object.entries(customValidationFuncs).reduce((acc, [key, validator]) => {
        const trimmedKey = key.trim();
        if (trimmedKey.length >= 2 && /^[a-z_$]+$/i.test(trimmedKey)) {
            acc[trimmedKey] = validator;
        }
        return acc;
    }, {} as Record<string, Validator>);

    const mergedValidators = { ...permanentValidationTypesFuncs, ...validCustomFuncs };

    // Step 2: Preprocess validators into direct and pattern-based with regex
    const directValidators: Record<string, Validator> = {};
    const patternValidators: Array<{ regex: RegExp; validator: Validator }> = [];

    for (const [key, validator] of Object.entries(mergedValidators)) {
        if (key.includes('$')) {
            const numDollars = (key.match(/\$/g) || []).length;
            const parts = key.split('$').filter(p => p !== '');

            let regex: RegExp | null = null;
            if (numDollars === 1) {
                if (key.startsWith('$')) {
                    // Pattern: $suffix (must end with suffix)
                    regex = new RegExp(`${parts[0]}$`, 'i');
                } else if (key.endsWith('$')) {
                    // Pattern: prefix$ (must start with prefix)
                    regex = new RegExp(`^${parts[0]}`, 'i');
                }
            } else if (numDollars === 2 && key.startsWith('$') && key.endsWith('$')) {
                // Pattern: $infix$ (must contain infix)
                regex = new RegExp(parts.join(''), 'i');
            }

            if (regex) patternValidators.push({ regex, validator });
        } else {
            directValidators[key] = validator;
        }
    }

    // Step 3: Validate each property
    const errors: Record<string, boolean> = {};
    const skipProps = new Set(skipValidationProperties);

    for (const [formProp, value] of Object.entries(propertyAndValues)) {
        if (skipProps.has(formProp)) continue;

        // Check direct validators first
        if (directValidators.hasOwnProperty(formProp)) {
            if (!directValidators[formProp](value)) {
                errors[formProp] = true;
            }
            continue; // Skip pattern checks if direct validator exists
        }

        // Check pattern validators using precompiled regex
        let hasError = false;
        for (const { regex, validator } of patternValidators) {
            if (regex.test(formProp)) {
                if (!validator(value)) {
                    hasError = true;
                    break; // Fail fast on first validation error
                }
            }
        }
        if (hasError) errors[formProp] = true;
    }

    return Object.keys(errors).length === 0 ? { errors: false } : { errors };
};

// Generates random password
const generatePassword = (): string => {
    const allowedCharacters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.-_';
    let password = '';
    for (let i = 0; i < 12; i++) {
        password += allowedCharacters[Math.floor(Math.random() * 72)];
    }
    return password;
};

export { isValidSingleName, isValidFullName, isValidEmailAddress, isValidPassword, checkValidation, generatePassword };
