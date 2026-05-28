// src/users/entities/user.entity.ts
//
// DISEÑO DE MICROSERVICIO:
// Esta entidad es la vista del user-service — perfil completo del usuario.
// NO tiene passwordHash ni refreshTokenHash — esos son exclusivos del auth-service.
// Cada servicio es dueño de sus propios datos y sus propios tipos.
//
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from "typeorm";

// Roles del sistema — redefinidos localmente en cada servicio
// No hay paquete compartido — cada servicio es autónomo
export enum UserRole {
  ADMIN = "admin",
  DOCTOR = "doctor",
  PATIENT = "patient",
}

@Entity("users")
export class User {
  // El id viene del auth-service vía evento user.registered
  // No es autoincremental aquí — el UUID lo genera auth-service
  // PrimaryColumn (no PrimaryGeneratedColumn) porque el ID es externo
  @PrimaryColumn("uuid")
  id!: string;

  // Email — único, sincronizado desde auth-service
  @Column({ unique: true, length: 255 })
  email!: string;

  // Datos de perfil — propios de este servicio
  @Column({ name: "first_name", type: "varchar", length: 100, nullable: true })
  firstName!: string | null;

  @Column({ name: "last_name", type: "varchar", length: 100, nullable: true })
  lastName!: string | null;

  @Column({ type: "varchar", length: 20, nullable: true })
  phone!: string | null;

  // Rol sincronizado desde auth-service
  @Column({
    type: "enum",
    enum: UserRole,
    default: UserRole.PATIENT,
  })
  role!: UserRole;

  // isActive sincronizado desde auth-service vía evento user.deactivated
  @Column({ name: "is_active", default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}
