import { Transform } from "class-transformer";

export const ToTwoDecimals = () =>
    Transform(({ value }: { value: unknown }) => {
        if (value === null || value === undefined) return value;
        if (typeof value === "number") return Math.round(value * 100) / 100;
        if (typeof value === "string") {
            const parsed = parseFloat(value);
            return isNaN(parsed) ? value : Math.round(parsed * 100) / 100;
        }
        return value;
    });
