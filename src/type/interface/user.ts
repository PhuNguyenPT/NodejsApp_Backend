import { UserStatus } from "../enum/user.status";

export interface IUser {
    email?: string;
    id?: string;
    name?: string;
    password?: string;
    phoneNumbers?: string[];
    status?: UserStatus;
}
