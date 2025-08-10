// src/migration/1754022674557-CreateDefaultAdmin.ts
import { MigrationInterface, QueryRunner } from "typeorm";
import * as bcrypt from "bcrypt";
import { Role, getDefaultPermissionsByRole } from "@/type/enum/user.js";
import { config } from "@/util/validate.env.js";

export class CreateDefaultAdmin1754794920377 implements MigrationInterface {
    name = "CreateDefaultAdmin1754794920377";

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Get admin credentials from environment variables
        const adminEmail: string = config.ADMIN_EMAIL;
        const adminPassword: string = config.ADMIN_PASSWORD;
        const adminName: string = config.ADMIN_NAME || "System Administrator";

        if (!adminEmail || !adminPassword) {
            console.warn(
                "ADMIN_EMAIL and ADMIN_PASSWORD environment variables are required to create default admin user",
            );
            return;
        }

        // Check if admin user already exists
        const existingAdmin = await queryRunner.query(
            `SELECT id FROM users WHERE email = $1`,
            [adminEmail],
        );

        if (existingAdmin.length > 0) {
            console.info(
                `Admin user with email ${adminEmail} already exists, skipping creation`,
            );
            return;
        }

        // Hash the password
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(adminPassword, saltRounds);

        // Get default admin permissions
        const adminPermissions = getDefaultPermissionsByRole(Role.ADMIN);
        const permissionsString = adminPermissions.join(",");

        // Create the admin user
        await queryRunner.query(
            `
            INSERT INTO users (
                email, 
                password, 
                name, 
                role, 
                status, 
                permissions,
                "createdAt",
                "modifiedAt",
                "createdBy"
            ) VALUES (
                $1, $2, $3, $4, $5, $6, NOW(), NOW(), 'system'
            )
        `,
            [
                adminEmail,
                hashedPassword,
                adminName,
                Role.ADMIN,
                "Happy", // Default status
                permissionsString,
            ],
        );

        console.info(`Default admin user created with email: ${adminEmail}`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const adminEmail = process.env.ADMIN_EMAIL;

        if (!adminEmail) {
            console.warn(
                "ADMIN_EMAIL environment variable is required to remove default admin user",
            );
            return;
        }

        // Remove the admin user
        await queryRunner.query(
            `DELETE FROM users WHERE email = $1 AND "createdBy" = 'system'`,
            [adminEmail],
        );

        console.info(
            `Default admin user with email ${adminEmail} has been removed`,
        );
    }
}
