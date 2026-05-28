// src/users/users.service.ts
import {
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User, UserRole } from "./entities/user.entity";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  // findAll — solo ADMIN puede listar todos los usuarios
  async findAll(): Promise<User[]> {
    return this.userRepository.find({
      order: { createdAt: "DESC" },
    });
  }

  // findOne — cualquier usuario autenticado puede ver su propio perfil
  // ADMIN puede ver cualquiera
  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException(`Usuario ${id} no encontrado`);
    return user;
  }

  // findByEmail — usado internamente por patient-service y doctor-service
  // vía HTTP REST para verificar existencia del userId
  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  // create — llamado por el evento user.registered de auth-service
  // o por un ADMIN directamente
  async create(dto: CreateUserDto): Promise<User> {
    // Verificar que el email no existe ya
    const existing = await this.userRepository.findOne({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException(`El email ${dto.email} ya está registrado`);
    }

    const user = this.userRepository.create({
      id: dto.id, // ID externo del auth-service
      email: dto.email,
      role: dto.role,
      firstName: dto.firstName ?? null,
      lastName: dto.lastName ?? null,
      phone: dto.phone ?? null,
    });

    const saved = await this.userRepository.save(user);
    this.logger.log(`Usuario creado: ${saved.email} [${saved.role}]`);
    return saved;
  }

  // update — verifica ownership antes de actualizar
  // Un usuario solo puede editar su propio perfil
  // ADMIN puede editar cualquiera (incluyendo isActive)
  async update(
    id: string,
    dto: UpdateUserDto,
    requesterId: string,
    requesterRole: string,
  ): Promise<User> {
    const user = await this.findOne(id);

    // IDOR prevention — OWASP A01: Broken Access Control
    // Solo el propio usuario o un ADMIN puede modificar el perfil
    if (requesterRole !== UserRole.ADMIN && requesterId !== id) {
      throw new ForbiddenException(
        "No tienes permiso para modificar este usuario",
      );
    }

    // Solo ADMIN puede cambiar isActive — soft delete controlado
    if (dto.isActive !== undefined && requesterRole !== UserRole.ADMIN) {
      throw new ForbiddenException(
        "Solo un administrador puede activar o desactivar usuarios",
      );
    }

    Object.assign(user, dto);
    const updated = await this.userRepository.save(user);
    this.logger.log(`Usuario actualizado: ${updated.id}`);
    return updated;
  }

  // deactivate — soft delete — solo ADMIN
  // Publica evento user.deactivated para que auth-service revoque tokens
  async deactivate(id: string): Promise<User> {
    const user = await this.findOne(id);
    user.isActive = false;
    const deactivated = await this.userRepository.save(user);
    this.logger.log(`Usuario desactivado: ${deactivated.id}`);
    // TODO: publicar evento user.deactivated a RabbitMQ
    // cuando se integre la mensajería asíncrona
    return deactivated;
  }

  // exists — llamado por patient-service y doctor-service via HTTP REST
  // Verifica que un userId existe y está activo antes de crear perfiles
  async exists(id: string): Promise<{ exists: boolean; role: string | null }> {
    const user = await this.userRepository.findOne({ where: { id } });
    return {
      exists: !!user && user.isActive,
      role: user?.role ?? null,
    };
  }
}
