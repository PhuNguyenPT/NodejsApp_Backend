// src/type/interface/user.ts

/**
 * Data Transfer Object for creating a new user
 * @example {
 *   "email": "jane.doe@example.com",
 *   "id": "644d97b3-f45f-4ae7-9b62-8bf02be11373",
 *   "name": "Jane Doe",
 *   "phoneNumbers": ["+1 (555) 123-4567", "+84 123 456 789"],
 *   "status": "Happy"
 * }
 */
export class User {
    email?: string;
    id?: string; // UUID
    name?: string;
    phoneNumbers?: string[];
    status?: "Happy" | "Sad";
}
