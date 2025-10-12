// src/dto/student.ts

import { Expose } from "class-transformer";

export class StudentResponse {
    @Expose()
    createdAt!: Date;

    @Expose()
    id!: string;

    @Expose()
    updatedAt!: Date;

    @Expose()
    userId!: string;
}
