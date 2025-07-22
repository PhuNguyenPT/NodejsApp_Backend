// src/util/bcrypt.util.ts
import bcrypt from "bcrypt";

/**
 * Salt rounds configuration for bcrypt hashing
 */
const SALT_ROUNDS = 12;

/**
 * Generate a salt with the configured rounds
 * @returns Promise<string> - Generated salt
 * @throws Error if salt generation fails
 */
export async function generateSalt(): Promise<string> {
    try {
        return await bcrypt.genSalt(SALT_ROUNDS);
    } catch (error) {
        throw new Error(
            `Failed to generate salt: ${error instanceof Error ? error.message : String(error)}`,
        );
    }
}

/**
 * Get the configured salt rounds
 * @returns number - Salt rounds being used
 */
export function getSaltRounds(): number {
    return SALT_ROUNDS;
}

/**
 * Hash a password using bcrypt
 * @param password - Plain text password to hash
 * @returns Promise<string> - Hashed password
 * @throws Error if hashing fails
 */
export async function hashPassword(password: string): Promise<string> {
    try {
        return await bcrypt.hash(password, SALT_ROUNDS);
    } catch (error) {
        throw new Error(
            `Failed to hash password: ${error instanceof Error ? error.message : String(error)}`,
        );
    }
}

/**
 * Hash a password with a custom salt
 * @param password - Plain text password to hash
 * @param salt - Custom salt to use
 * @returns Promise<string> - Hashed password
 * @throws Error if hashing fails
 */
export async function hashPasswordWithSalt(
    password: string,
    salt: string,
): Promise<string> {
    try {
        return await bcrypt.hash(password, salt);
    } catch (error) {
        throw new Error(
            `Failed to hash password with salt: ${error instanceof Error ? error.message : String(error)}`,
        );
    }
}

/**
 * Verify a password against a hash
 * @param password - Plain text password to verify
 * @param hash - Hashed password to compare against
 * @returns Promise<boolean> - True if password matches the hash
 * @throws Error if verification fails
 */
export async function verifyPassword(
    password: string,
    hash: string,
): Promise<boolean> {
    try {
        return await bcrypt.compare(password, hash);
    } catch (error) {
        throw new Error(
            `Failed to verify password: ${error instanceof Error ? error.message : String(error)}`,
        );
    }
}
