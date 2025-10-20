import * as bcrypt from "bcrypt";
import { MigrationInterface, QueryRunner } from "typeorm";

import { logger } from "@/config/logger.config.js";
import { UserEntity } from "@/entity/security/user.entity.js";
import { getDefaultPermissionsByRole, Role } from "@/type/enum/user.js";
import { config } from "@/util/validate-env.js";

export class CreateDefaultAdmin1754794920377 implements MigrationInterface {
    name = "CreateDefaultAdmin1754794920377";

    public async down(queryRunner: QueryRunner): Promise<void> {
        const adminEmail = config.ADMIN_EMAIL;

        if (!adminEmail) {
            logger.warn(
                "ADMIN_EMAIL environment variable is required to remove default admin user",
            );
            return;
        }

        // Use the repository to delete the admin user
        const userRepository = queryRunner.manager.getRepository(UserEntity);
        await userRepository.delete({
            createdBy: "system",
            email: adminEmail,
        });

        logger.info(
            `Default admin user with email ${adminEmail} has been removed`,
        );
    }

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Get admin credentials from environment variables
        const adminEmail: string = config.ADMIN_EMAIL;
        const adminPassword: string = config.ADMIN_PASSWORD;
        const adminName: string = config.ADMIN_NAME || "System Administrator";

        if (!adminEmail || !adminPassword) {
            logger.warn(
                "ADMIN_EMAIL and ADMIN_PASSWORD environment variables are required to create default admin user",
            );
            return;
        }

        // Use the repository to check if admin exists
        const userRepository = queryRunner.manager.getRepository(UserEntity);
        const existingAdmin = await userRepository.findOne({
            where: { email: adminEmail },
        });

        if (existingAdmin) {
            logger.info(
                `Admin user with email ${adminEmail} already exists, skipping creation`,
            );
            return;
        }

        // Hash the password
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(adminPassword, saltRounds);

        // Get default admin permissions
        const adminPermissions = getDefaultPermissionsByRole(Role.ADMIN);

        // Create the admin user entity
        const adminUser = new UserEntity({
            accountNonExpired: true,
            accountNonLocked: true,
            createdBy: "system",
            credentialsNonExpired: true,
            email: adminEmail,
            enabled: true,
            name: adminName,
            password: hashedPassword,
            permissions: adminPermissions,
            role: Role.ADMIN,
        });

        // Save the admin user
        await userRepository.save(adminUser);

        logger.info(`Default admin user created with email: ${adminEmail}`);
    }
}
