import { UserStatus } from "@/type/enum/user.js";

export interface IUser {
    email?: string;
    id?: string;
    name?: string;
    password?: string;
    phoneNumbers?: string[];
    status?: UserStatus;
}
