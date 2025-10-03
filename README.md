# Upframer Infrastructure

Infraestrutura como código (IaC) para a plataforma Upframer utilizando Pulumi e AWS.

## Visão Geral

Este projeto define a infraestrutura completa da aplicação Upframer na AWS usando Pulumi com TypeScript. A arquitetura é baseada em microserviços containerizados executando no Amazon ECS Fargate.

## Arquitetura

### Serviços

- **Upload Service** (Porta 3333): Responsável pelo upload e gerenciamento de arquivos
- **Process Service** (Porta 3334): Processamento de vídeos e jobs assíncronos
- **Auth Service** (Porta 3335): Autenticação e autorização de usuários
- **RabbitMQ** (Porta 5672/15672): Message broker para comunicação entre serviços

### Componentes AWS

- **ECS Fargate**: Orquestração de containers
- **Application Load Balancer**: Distribuição de tráfego HTTP
- **Network Load Balancer**: Distribuição de tráfego TCP (RabbitMQ)
- **S3**: Armazenamento de arquivos
- **IAM Roles**: Permissões para serviços ECS

## Pré-requisitos

- [Node.js](https://nodejs.org/) (versão 18+)
- [Pulumi CLI](https://www.pulumi.com/docs/get-started/install/)
- [AWS CLI](https://aws.amazon.com/cli/) configurado
- Docker (para build das imagens)

## Estrutura do Projeto

```
src/
├── cluster.ts              # Configuração do cluster ECS
├── load-balancer.ts        # Load balancers (ALB e NLB)
├── config/
│   └── env.ts              # Configurações de ambiente
├── images/
│   └── images.ts           # Definições das imagens Docker
├── roles/
│   └── ecs-roles.ts        # IAM roles para ECS
├── services/
│   ├── auth.ts             # Serviço de autenticação
│   ├── process.ts          # Serviço de processamento
│   ├── rabbitmq.ts         # Message broker
│   └── upload.ts           # Serviço de upload
└── storage/
    └── s3.ts               # Configuração do S3
```

## Endpoints

Após o deploy, os seguintes endpoints estarão disponíveis:

- **Upload Service**: `http://<alb-dns>:3333`
- **Process Service**: `http://<alb-dns>:3334`
- **Auth Service**: `http://<alb-dns>:3335`
- **RabbitMQ Admin**: `http://<alb-dns>:15672`

## Monitoramento

### Health Checks

Todos os serviços possuem health checks configurados:

- **Path**: `/health`
- **Interval**: 30 segundos
- **Timeout**: 5 segundos
- **Healthy Threshold**: 2
- **Unhealthy Threshold**: 5

### Logs

Os logs dos serviços podem ser visualizados no AWS CloudWatch Logs.

## Segurança

### S3 Bucket

- **Acesso Público**: Bloqueado
- **Encriptação**: AES256
- **Versionamento**: Desabilitado
- **CORS**: Configurado para operações necessárias

### Network

- **Load Balancers**: Públicos para acesso externo
- **ECS Tasks**: Em rede privada
- **Security Groups**: Configurados por serviço

## Configuração

### 1. Instalação de Dependências

```bash
npm install / bun install
```

### 2. Configuração do Pulumi

```bash
pulumi login

pulumi stack select <stack-name>
```

### 3. Variáveis de Ambiente

Configure as seguintes variáveis de ambiente no Pulumi:

```bash
# AWS Credentials
pulumi config set aws:accessKey <your-access-key>
pulumi config set aws:secretKey <your-secret-key> --secret
pulumi config set aws:sessionToken <your-session-token> --secret
pulumi config set aws:region us-east-1

# Database URLs
pulumi config set DATABASE_URL_UPLOAD <upload-db-url> --secret
pulumi config set DATABASE_URL_AUTH <auth-db-url> --secret

# JWT
pulumi config set JWT_SECRET <jwt-secret> --secret

# S3
pulumi config set AWS_BUCKET_NAME <bucket-name>

# SMTP
pulumi config set SMTP_HOST <smtp-host>
pulumi config set SMTP_PORT <smtp-port>
pulumi config set SMTP_SECURE <true/false>
pulumi config set SMTP_USER <smtp-user>
pulumi config set SMTP_PASS <smtp-pass> --secret

# RabbitMQ
pulumi config set RABBITMQ_DEFAULT_USER admin
pulumi config set RABBITMQ_DEFAULT_PASS admin --secret
```


## Deploy

### Deploy Completo

```bash
pulumi up
```

### Preview das Mudanças

```bash
pulumi preview
```

### Destroy da Infraestrutura

```bash
pulumi destroy
```
