import {
    registerDecorator,
    ValidationArguments,
    ValidationOptions,
} from "class-validator";

function IsArrayUnique(validationOptions?: ValidationOptions) {
    return function (object: object, propertyName: string) {
        registerDecorator({
            name: "isArrayUnique",
            options: validationOptions,
            propertyName: propertyName,
            target: object.constructor,
            validator: {
                defaultMessage(args: ValidationArguments): string {
                    return `${args.property} must contain unique values`;
                },
                validate(value: unknown[]): boolean {
                    return (
                        Array.isArray(value) &&
                        new Set(value).size === value.length
                    );
                },
            },
        });
    };
}

export { IsArrayUnique };
