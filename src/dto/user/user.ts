// src/type/interface/user.ts
export interface User {
  email: string;
  id: string; // UUID
  name: string;
  phoneNumbers: string[];
  status?: "Happy" | "Sad";
}
