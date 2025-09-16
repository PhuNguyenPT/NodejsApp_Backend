import {
    registerDecorator,
    ValidationArguments,
    ValidationOptions,
} from "class-validator";

interface HasName {
    name: string;
}

export function IsUniqueSubject(validationOptions?: ValidationOptions) {
    return function (object: object, propertyName: string) {
        registerDecorator({
            name: "isUniqueSubject",
            options: validationOptions,
            propertyName: propertyName,
            target: object.constructor,
            validator: {
                defaultMessage(args: ValidationArguments) {
                    return `${args.property} must have unique names.`;
                },
                validate(value: unknown[]) {
                    if (
                        !Array.isArray(value) ||
                        value.some(
                            (item) =>
                                typeof item !== "object" ||
                                item === null ||
                                !("name" in item),
                        )
                    ) {
                        // The array is not valid or items are not objects with a 'name' property
                        return false;
                    }
                    // Perform a type assertion after the check
                    const names = (value as HasName[]).map((item) => item.name);
                    const uniqueNames = new Set(names);
                    return names.length === uniqueNames.size;
                },
            },
        });
    };
}
