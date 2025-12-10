import {
    registerDecorator,
    type ValidationArguments,
    type ValidationOptions,
} from "class-validator";

/**
 * Validates that array elements are unique.
 *
 * For primitive arrays: checks the values directly.
 * For object arrays:
 *   - If no property specified: checks entire object (deep equality)
 *   - If property specified: checks uniqueness based on that property
 *
 * @param property - Optional property name to check uniqueness on
 * @param validationOptions - Standard class-validator options
 *
 * @example
 * // For primitive arrays
 * @IsArrayUnique()
 * tags: string[];
 *
 * @example
 * // For object arrays - check entire object
 * @IsArrayUnique()
 * conducts: ConductRequest[];
 *
 * @example
 * // For object arrays - check by specific property only
 * @IsArrayUnique('grade')
 * conducts: ConductRequest[];
 */
export function IsArrayUnique(
    property?: string,
    validationOptions?: ValidationOptions,
) {
    return function (object: object, propertyName: string) {
        registerDecorator({
            constraints: [property],
            name: "isArrayUnique",
            options: validationOptions,
            propertyName: propertyName,
            target: object.constructor,
            validator: {
                defaultMessage(args: ValidationArguments): string {
                    const prop = args.constraints[0] as string | undefined;
                    if (prop) {
                        return `${args.property} must contain unique values for property '${prop}'`;
                    }
                    return `${args.property} must contain unique elements`;
                },
                validate(value: unknown, args: ValidationArguments): boolean {
                    if (!Array.isArray(value)) {
                        return false;
                    }

                    if (value.length === 0) {
                        return true; // Empty arrays are valid
                    }

                    const property = args.constraints[0] as string | undefined;

                    // If property specified, check uniqueness by that property only
                    if (property) {
                        const extractedValues = value.map((item: unknown) => {
                            if (item == null) return null;

                            // Support nested property access
                            const props = property.split(".");
                            let val: unknown = item;
                            for (const prop of props) {
                                if (
                                    typeof val === "object" &&
                                    val !== null &&
                                    prop in val
                                ) {
                                    val = (val as Record<string, unknown>)[
                                        prop
                                    ];
                                } else {
                                    return undefined;
                                }
                            }
                            return val;
                        });

                        return (
                            new Set(extractedValues).size ===
                            extractedValues.length
                        );
                    }

                    // No property specified - check entire object/value uniqueness
                    const firstItem: unknown = value[0];
                    const isPrimitive =
                        typeof firstItem !== "object" || firstItem === null;

                    if (isPrimitive) {
                        // For primitives, use Set
                        return new Set(value).size === value.length;
                    }

                    // For objects, use JSON stringification for deep comparison
                    const stringified = value.map((item: unknown) => {
                        try {
                            return JSON.stringify(item);
                        } catch {
                            // Handle circular references or non-serializable objects
                            return String(item);
                        }
                    });
                    return new Set(stringified).size === stringified.length;
                },
            },
        });
    };
}
