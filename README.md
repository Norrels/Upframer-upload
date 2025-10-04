# Upframer Upload

## 📖 Sobre o Projeto

O **Upframer Upload** é um sistema de upload e processamento de vídeos construído com uma arquitetura hexagonal com principios de clean architecture, utilizando TypeScript, Fastify.

O sistema permite o upload de vídeos pelos usuários, processa esses vídeos de forma assíncrona através de filas de mensagens e fornece endpoints para acompanhar o status do processamento e fazer download dos arquivos processados.

## 🏗️ Arquitetura

### Padrão Arquitetural: Hexagonal Architecture

O projeto implementa a **Arquitetura Hexagonal**, que organiza o código em camadas concêntricas, onde as camadas internas não conhecem as externas:

```
┌─────────────────────────────────────────────────────────────┐
│                    Infrastructure                           │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                   Application                       │    │
│  │  ┌─────────────────────────────────────────────┐    │    │
│  │  │               Domain                        │    │    │
│  │  │  ┌─────────────────────────────────────┐    │    │    │
│  │  │  │            Entities                 │    │    │    │
│  │  │  │         Value Objects               │    │    │    │
│  │  │  └─────────────────────────────────────┘    │    │    │
│  │  └─────────────────────────────────────────────┘    │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### Estrutura de Diretórios

```
src/
├── domain/                    # Camada de Domínio
│   ├── entities/             # Entidades de negócio
│   ├── value-objects/        # Objetos de valor
│   └── ports/                # Interfaces (contratos)
│       ├── upload-video.port.ts
│       └── out/
│           ├── storage/
│           ├── persistence/
│           ├── notification/
│           └── queue/
├── application/              # Camada de Aplicação
│   └── use-cases/           # Casos de uso
├── infrastructure/          # Camada de Infraestrutura
│   ├── adapters/
│   │   ├── in/             # Adapters de entrada (Controllers)
│   │   └── out/            # Adapters de saída
│   │       ├── storage/    # Armazenamento de arquivos
│   │       ├── persistence/# Banco de dados
│   │       ├── notification/# Notificações
│   │       └── queue/      # Filas de mensagens
│   └── middleware/         # Middlewares
├── config/                 # Configurações
└── utils/                  # Utilitários
```

### Camadas da Arquitetura

#### 1. **Domain (Domínio)**
- **Entities**: Modelos de negócio (`Video`, `JobEntity`)
- **Value Objects**: Objetos imutáveis (`VideoId`, `VideoName`)
- **Ports**: Interfaces que definem contratos (`UploadVideoPort`, `FileStoragePort`)

#### 2. **Application (Aplicação)**
- **Use Cases**: Implementam regras de negócio específicas
  - `UploadVideoUseCase`: Orquestra o upload de vídeos
  - `GetUserUploadsUseCase`: Recupera uploads do usuário
  - `GetJobStatusUseCase`: Consulta status de processamento
  - `DownloadFileUseCase`: Gerencia download de arquivos

#### 3. **Infrastructure (Infraestrutura)**
- **Adapters In**: Controllers que recebem requisições HTTP
- **Adapters Out**: Implementações concretas dos ports
  - `LocalFileStorageAdapter` / `S3FileStorageAdapter`: Armazenamento
  - `JobRepositoryDrizzle`: Persistência com Drizzle ORM
  - `RabbitMQAdapter`: Fila de mensagens
  - `EmailNotificationAdapter`: Notificações por email

## 🎯 Princípios e Padrões

### 1. **Dependency Inversion Principle (DIP)**
As camadas internas definem interfaces (ports) que são implementadas pelas camadas externas, invertendo as dependências.

```typescript
// Domain define a interface
export interface FileStoragePort {
  saveFile(fileData: FileData, filename: string): Promise<string>;
}

// Infrastructure implementa
export class LocalFileStorageAdapter implements FileStoragePort {
  async saveFile(fileData: FileData, filename: string): Promise<string> {
    // implementação...
  }
}
```

### 2. **Single Responsibility Principle (SRP)**
Cada classe tem uma única responsabilidade:
- Use Cases: Orquestram regras de negócio
- Adapters: Fazem a tradução entre camadas
- Entities: Representam conceitos de negócio

### 3. **Open/Closed Principle (OCP)**
O sistema é extensível através de novos adapters sem modificar o código existente.

### 4. **Ports and Adapters Pattern**
- **Ports**: Interfaces que definem o que pode ser feito
- **Adapters**: Implementações específicas de como é feito

## 🔧 Tecnologias Utilizadas

### Core
- **[Node.js](https://nodejs.org/pt)** com **[TypeScript](https://www.typescriptlang.org/)**
- **[Fastify](https://fastify.dev/)** - Framework web rápido e eficiente
- **[Drizzle ORM](https://orm.drizzle.team/)** - ORM type-safe para TypeScript

### Armazenamento
- **File System Local** - Para desenvolvimento
- **AWS S3** - Para produção (preparado)
- **PostgreSQL** com **[Neon](https://neon.com/)** - Banco de dados

### Mensageria
- **[RabbitMQ](https://www.rabbitmq.com/)** - Fila de mensagens para processamento assíncrono

### Documentação
- **[Swagger/OpenAPI](https://swagger.io/resources/open-api/)** - Documentação da API

### Testes
- **[Vitest](https://vitest.dev/)** - Framework de testes

## 🚀 Como Funciona

### Fluxo de Upload
1. **Recebimento**: Controller recebe arquivo via HTTP
2. **Validação**: Middleware de autenticação valida usuário
3. **Processamento**: Use Case orquestra o armazenamento
4. **Persistência**: Job é salvo no banco de dados
5. **Enfileiramento**: Mensagem é enviada para RabbitMQ
6. **Notificação**: Sistema notifica em caso de erro (assíncrono)

### Fluxo de Consulta
1. **Requisição**: Cliente consulta status ou lista uploads
2. **Autenticação**: Middleware valida permissões
3. **Consulta**: Use Case busca dados no repositório
4. **Resposta**: Dados são retornados formatados

## 🌐 Endpoints Disponíveis

### **Health Check**
```http
GET /health
```
Verifica se a API está funcionando.

**Resposta:**
```json
"OK"
```

---

### **Upload de Vídeo**
```http
POST /api/upload-video
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Parâmetros:**
- `file`: Arquivo de vídeo (MP4, máx. 100MB)

**Resposta de Sucesso (200):**
```json
{
  "message": "Video uploaded successfully",
  "videoId": "clxyz123abc",
  "filename": "video.mp4",
  "status": "pending"
}
```

**Respostas de Erro:**
- `400`: Erro na validação do arquivo
- `401`: Token de autenticação inválido

---

### **Listar Uploads do Usuário**
```http
GET /api/my-uploads
Authorization: Bearer <token>
```

**Resposta de Sucesso (200):**
```json
{
  "success": true,
  "uploads": [
    {
      "jobId": "clxyz123abc",
      "status": "COMPLETED",
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

**Status possíveis:**
- `PENDING`: Aguardando processamento
- `PROCESSING`: Em processamento
- `COMPLETED`: Processamento concluído
- `FAILED`: Falha no processamento

---

### **Consultar Status de Job**
```http
GET /api/job/{jobId}/status
Authorization: Bearer <token>
```

**Parâmetros:**
- `jobId`: ID do job retornado no upload

**Resposta de Sucesso (200):**
```json
{
  "success": true,
  "job": {
    "id": "clxyz123abc",
    "videoUrl": "https://bucket.s3.amazonaws.com/video.mp4",
    "outputPath": "/path/to/processed/output.zip",
    "status": "completed",
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

**Respostas de Erro:**
- `401`: Token inválido
- `404`: Job não encontrado

---

### **Download de Arquivo Processado**
```http
GET /api/job/{jobId}/download
Authorization: Bearer <token>
```

**Parâmetros:**
- `jobId`: ID do job com status `COMPLETED`

**Resposta de Sucesso (200):**
```json
{
  "success": true,
  "downloadUrl": "https://bucket.s3.amazonaws.com/output.zip"
}
```

**Respostas de Erro:**
- `400`: Job ainda não processado
- `401`: Token inválido
- `403`: Acesso negado
- `404`: Job ou arquivo não encontrado

---

### **Documentação Interativa**
```http
GET /docs
```
Acessa a documentação Swagger/OpenAPI interativa da API.


## 📋 Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev              # Executa em modo desenvolvimento
npm run build            # Compila TypeScript
npm start               # Executa versão compilada

# Testes
npm test                # Executa testes
npm run test:watch      # Executa testes em modo watch
npm run test:coverage   # Executa testes com cobertura

# Banco de dados
npm run migrate:generate # Gera migrações
npm run migrate:migrate  # Executa migrações
npm run migrate:push     # Sincroniza schema
npm run studio          # Abre Drizzle Studio
```

## 🔧 Configuração

O projeto utiliza variáveis de ambiente para configuração. Principais variáveis:

```env
# Banco de dados
DATABASE_URL=postgresql://user:pass@host:port/db

# RabbitMQ
RABBITMQ_URL=amqp://admin:admin@localhost:5672
RABBITMQ_QUEUE_CREATED=job-created
RABBITMQ_QUEUE_STATUS_UPDATED=job-updated

# AWS S3 (opcional)
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=east-us-1
AWS_BUCKET_NAME=your-bucker-name

# Email
SMTP_HOST=your-smtp-host
SMTP_PORT=your-smpt-port
SMTP_USER=your-smtp-user
SMTP_PASS=your-smtp-pass

# JWT
JWT_SECRET=
```
