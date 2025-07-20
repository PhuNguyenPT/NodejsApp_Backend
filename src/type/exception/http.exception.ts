export class HttpException extends Error {
    public status: number;

    constructor(status: number, message: string, name?: string) {
        super(message);
        this.status = status;
        this.name = name ?? "HttpException";

        Error.captureStackTrace(this, new.target);
    }
}
