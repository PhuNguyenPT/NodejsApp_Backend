// src/util/cache-keys.ts

import type { UUID } from "@/type/common/uuid.type.js";

/**
 * Centralized cache key management
 * All Redis cache keys should be defined here for consistency and maintainability
 */
export const CacheKeys = {
    /**
     * Cache key for admission field values by student
     * @param studentId - The student's UUID
     * @param userId - The user's UUID or "guest" for anonymous users
     * @returns Cache key string
     */
    admissionFields(studentId: UUID, userId?: UUID): string {
        return `admission_fields:${studentId}:${userId ?? "guest"}`;
    },

    /**
     * Pattern to match all admission field cache keys for a specific student
     * Used for bulk invalidation
     * @param studentId - The student's UUID
     * @returns Cache key pattern
     */
    admissionFieldsPattern(studentId: UUID): string {
        return `admission_fields:${studentId}:*`;
    },

    /**
     * Get all possible admission field cache keys for a student
     * @param studentId - The student's UUID
     * @param userId - Optional user ID if known
     * @returns Array of cache keys to invalidate
     */
    allAdmissionFieldsKeys(studentId: UUID, userId?: UUID): string[] {
        const keys = [this.admissionFields(studentId)]; // guest key
        if (userId) {
            keys.push(this.admissionFields(studentId, userId));
        }
        return keys;
    },

    /**
     * Cache key for student profile data
     * @param studentId - The student's UUID
     * @param userId - The user's UUID or undefined for guest/anonymous users
     * @returns Cache key string
     */
    studentProfile(studentId: UUID, userId?: UUID): string {
        return `student_profile:${studentId}:${userId ?? "guest"}`;
    },

    /**
     * Cache key for user data
     * @param userId - The user's UUID
     * @returns Cache key string
     */
    user(userId: UUID): string {
        return `user:${userId}`;
    },
} as const;
