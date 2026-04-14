import {
    registerDecorator,
    ValidationArguments,
    ValidationOptions,
} from 'class-validator';

export function IsAfter(
    property: string,
    validationOptions?: ValidationOptions,
) {
    return function (object: object, propertyName: string) {
        registerDecorator({
            name: 'isAfter',
            target: object.constructor,
            propertyName,
            constraints: [property],
            options: validationOptions,
            validator: {
                validate(value: unknown, args: ValidationArguments) {
                    const [relatedPropertyName] = args.constraints as string[];
                    const relatedValue = (
                        args.object as Record<string, unknown>
                    )[relatedPropertyName];
                    return (
                        new Date(value as string) >
                        new Date(relatedValue as string)
                    );
                },
                defaultMessage(args: ValidationArguments) {
                    return `${args.property} must be after ${args.constraints[0]}`;
                },
            },
        });
    };
}
