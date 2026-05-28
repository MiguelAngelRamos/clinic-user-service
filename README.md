# clinic-user-service

Microservicio de usuarios de la **Clinic App**.

Responsabilidad única: gestionar el perfil completo del usuario — datos personales, rol y estado activo. Sin autenticación ni passwords.

## Stack

- **NestJS 11** · Node 22 · TypeScript 5
- **PostgreSQL 16** — BD propia (tabla `users`, solo perfil)
- Sin JWT — Kong valida el token en el borde e inyecta los headers

## Diferencia clave con el auth-service

| Campo | auth-service | user-service |
|---|---|---|
| `id` | PrimaryGeneratedColumn (genera el UUID) | PrimaryColumn (recibe el UUID) |
| `email` | ✅ | ✅ |
| `passwordHash` | ✅ | ❌ |
| `refreshTokenHash` | ✅ | ❌ |
| `firstName` / `lastName` | ❌ | ✅ |
| `phone` | ❌ | ✅ |

## Endpoints

| Método | Ruta | Rol | Descripción |
|--------|------|-----|-------------|
| `GET` | `/users` | ADMIN | Listar todos |
| `GET` | `/users/health` | Público | Health check K8s |
| `GET` | `/users/:id` | Autenticado | Ver perfil |
| `GET` | `/users/:id/exists` | Interno | Verifica existencia para otros servicios |
| `POST` | `/users` | Interno/ADMIN | Crear usuario |
| `PATCH` | `/users/:id` | Ownership | Actualizar perfil |
| `DELETE` | `/users/:id` | ADMIN | Soft delete |

## Autenticación

Este servicio **no valida JWT**. Kong lo hace en el borde. Los endpoints reciben los headers:

```
X-User-Id:    <uuid>
X-User-Role:  admin | doctor | patient
X-User-Email: email@ejemplo.com
```

## Comunicación con otros servicios

**Recibe (mensajería — pendiente RabbitMQ):**
- `user.registered` desde `auth-service` → crea el registro local

**Expone (HTTP REST):**
- `GET /users/:id/exists` → usado por `patient-service` y `doctor-service`

## Kubernetes

```bash
# Crear Secret
kubectl create secret generic user-postgres-secret \
  --namespace clinic \
  --from-literal=POSTGRES_USER=user_svc_user \
  --from-literal=POSTGRES_PASSWORD=<PASSWORD> \
  --from-literal=POSTGRES_DB=user_db

# Aplicar manifiestos
kubectl apply -f k8s/user-service.yaml

# Verificar
kubectl get pods -n clinic -l app=user-service
```
