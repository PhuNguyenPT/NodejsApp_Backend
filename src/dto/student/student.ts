// src/dto/student.ts

import { Expose } from "class-transformer";

export class StudentResponse {
    @Expose()
    createdAt!: Date;
    @Expose()
    id!: string;
    @Expose()
    modifiedAt!: Date;
    @Expose()
    userId!: string;
}
