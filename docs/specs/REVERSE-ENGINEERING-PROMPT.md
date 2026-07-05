# Prompt de Reengenharia — Sistema de Gerenciamento de Conteúdo

## Contexto

Você é um arquiteto de software sênior e engenheiro full-stack encarregado de reimplementar, do zero, um sistema de gerenciamento de conteúdo (CMS) completo e de nível empresarial. Este é um exercício de **engenharia clean room** — você não tem acesso ao código-fonte original, apenas a uma especificação funcional exaustiva que descreve todo o comportamento do sistema.

O documento `CLEAN-ROOM-SPEC.md` anexo a este prompt contém a especificação funcional completa do sistema. Ele descreve 35 subsistemas interconectados, cobrindo desde o ciclo de vida de uma requisição HTTP até sistemas de cache, permissões, blocos de conteúdo, API REST, e multisite. **Esse documento é sua única fonte de verdade.** Toda decisão arquitetural e de implementação deve ser rastreável a um comportamento descrito nele.

---

## Sua Missão

Reimplementar fielmente o ecossistema descrito na especificação, produzindo um CMS funcional que atenda a todos os comportamentos documentados. A reimplementação deve ser **funcionalmente equivalente** — um operador que conhece o sistema original deve conseguir usar o novo sistema com a mesma lógica mental, os mesmos conceitos e os mesmos fluxos de trabalho.

---

## Stack Tecnológico Definido

### Runtime e Linguagem

| Camada                 | Tecnologia                   | Justificativa                                                  |
| ---------------------- | ---------------------------- | -------------------------------------------------------------- |
| Linguagem              | **TypeScript (strict mode)** | Tipagem em todo o stack, contratos compiláveis entre camadas   |
| Runtime                | **Node.js 22+ LTS**          | Runtime unificado para API e frontend                          |
| Gerenciador de pacotes | **pnpm**                     | Workspace nativo, hoisting eficiente, lockfile determinístico  |
| Monorepo               | **Turborepo**                | Builds incrementais, cache de tarefas, orquestração de pacotes |

### Backend (API)

| Componente               | Tecnologia                                        | Uso                                                                           |
| ------------------------ | ------------------------------------------------- | ----------------------------------------------------------------------------- |
| Framework HTTP           | **NestJS**                                        | Módulos, injeção de dependência, guards, interceptors, pipes, decorators      |
| ORM / Query Builder      | **Drizzle ORM**                                   | Type-safe, próximo do SQL, migrações, sem overhead de runtime pesado          |
| Validação de entrada     | **Zod**                                           | Schemas de validação compartilhados entre API e frontend, inferência de tipos |
| Documentação da API      | **@nestjs/swagger**                               | Geração automática de OpenAPI/Swagger a partir dos decorators                 |
| Autenticação             | **Passport.js** via `@nestjs/passport`            | Estratégias modulares (cookie, HTTP Basic, custom)                            |
| Rate limiting            | **@nestjs/throttler**                             | Proteção de endpoints contra abuso                                            |
| Segurança HTTP           | **helmet**                                        | Headers de segurança (CSP, HSTS, X-Frame-Options)                             |
| Serialização de resposta | **class-transformer** + interceptors customizados | Controle de campos por contexto (view/edit)                                   |

### Frontend

| Componente       | Tecnologia                          | Uso                                                                                                |
| ---------------- | ----------------------------------- | -------------------------------------------------------------------------------------------------- |
| Framework        | **Next.js 15+ (App Router)**        | SSR, SSG, ISR, Server Components, Server Actions                                                   |
| Editor de blocos | **Plate.js** (baseado em Slate.js)  | Editor de blocos extensível, serialização customizável, plugins por tipo de bloco                  |
| Componentes UI   | **shadcn/ui** + **Tailwind CSS v4** | Componentes acessíveis, customizáveis, sem runtime CSS                                             |
| State management | **Zustand**                         | Estado leve para admin panel; Server Components eliminam necessidade de estado no frontend público |
| Formulários      | **React Hook Form** + **Zod**       | Validação client+server compartilhada                                                              |
| i18n             | **next-intl**                       | Internacionalização integrada ao App Router                                                        |
| Fetching         | **TanStack Query**                  | Cache, revalidação, otimistic updates no admin                                                     |

### Persistência

| Componente                   | Tecnologia                              | Uso                                                       |
| ---------------------------- | --------------------------------------- | --------------------------------------------------------- |
| Banco relacional             | **PostgreSQL 17+**                      | Banco principal, JSONB, full-text search, partitioning    |
| Cache / Sessões / Transients | **Redis 7+ (via ioredis)**              | Object cache, sessões, transients com TTL nativo, pub/sub |
| Connection pooling           | **PgBouncer** ou pool nativo do Drizzle | Reutilização de conexões sob carga                        |
| Migrações                    | **Drizzle Kit**                         | Migrações type-safe, diff automático de schema            |

### Processamento e Infraestrutura

| Componente                 | Tecnologia                                                               | Uso                                                                                          |
| -------------------------- | ------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------- |
| Processamento de imagem    | **Sharp** (baseado em libvips)                                           | Redimensionamento, recorte, rotação, conversão de formato. 4-5x mais rápido que alternativas |
| Filas e jobs em background | **BullMQ** (sobre Redis)                                                 | Substitui o pseudo-cron. Jobs com retry, concorrência, prioridade, scheduling                |
| Armazenamento de arquivos  | **Abstração com adaptadores**: disco local + S3-compatible               | Desenvolvimento local em disco, produção em object storage                                   |
| Email                      | **Nodemailer** + **React Email**                                         | Templates tipados em JSX, envio SMTP                                                         |
| Busca textual              | **PostgreSQL tsvector/tsquery** (fase 1) → **Meilisearch** (fase futura) | Full-text search sem infra adicional inicialmente                                            |
| Logging                    | **Pino**                                                                 | Structured logging, JSON, alta performance, integra com NestJS                               |
| Observabilidade            | **OpenTelemetry** + exporters                                            | Traces distribuídos, métricas, integração com qualquer backend (Jaeger, Grafana, etc.)       |
| CLI                        | **Commander.js**                                                         | Ferramenta de linha de comando para gestão do CMS                                            |

### Testes

| Tipo           | Tecnologia                            | Escopo                                                      |
| -------------- | ------------------------------------- | ----------------------------------------------------------- |
| Unitário       | **Vitest**                            | Funções puras, hook system, query builder, serialização     |
| Integração API | **Supertest** + **Vitest**            | Endpoints REST, autenticação, permissões                    |
| E2E            | **Playwright**                        | Fluxos completos (login, criação de conteúdo, customizer)   |
| Contrato       | **Zod schemas** como contratos de API | Validação de que resposta da API casa com o schema esperado |
| Banco de teste | **Testcontainers**                    | PostgreSQL e Redis efêmeros por suite de teste              |

### DevOps

| Componente      | Tecnologia                                                |
| --------------- | --------------------------------------------------------- |
| Containerização | **Docker** + **Docker Compose** (dev)                     |
| CI/CD           | **GitHub Actions**                                        |
| Ambientes       | `.env` por ambiente com **dotenv-vault** ou **infisical** |

---

## Arquitetura do Monorepo

```
cms/
├── apps/
│   ├── api/                  # NestJS — API REST + Bootstrap + Hook Engine
│   ├── web/                  # Next.js — Frontend público + Admin panel
│   └── cli/                  # Commander.js — Ferramenta de linha de comando
│
├── packages/
│   ├── core/                 # Sistema de ganchos, tipos compartilhados, constantes
│   ├── database/             # Drizzle schema, repositórios, migrações, seed
│   ├── editor/               # Editor de blocos (Plate.js), parser, serializer
│   ├── auth/                 # Autenticação, hashing, cookies, nonces, sessions
│   ├── media/                # Processamento de imagem, upload, storage abstraction
│   ├── i18n/                 # Catálogos, loaders, funções de tradução
│   ├── query-engine/         # Motor de consultas declarativo, subconsultas
│   ├── html-processor/       # Tag processor + Full processor HTML5
│   ├── sdk/                  # Cliente TypeScript para consumir a API (publicável)
│   └── config/               # ESLint, TSConfig, Prettier, Vitest compartilhados
│
├── docker/
│   ├── docker-compose.yml
│   ├── Dockerfile.api
│   └── Dockerfile.web
│
├── turbo.json
├── pnpm-workspace.yaml
└── tsconfig.base.json
```

### Responsabilidades por Pacote

**`@cms/core`** — Zero dependências externas. Contém:

- `HookEngine`: classe que implementa registro, execução, filtros, ações, gancho universal, pilha, contadores.
- Tipos TypeScript compartilhados (PostType, Taxonomy, Capability, Option, etc.).
- Constantes e enums do sistema.
- Este pacote é importado por TODOS os outros.

**`@cms/database`** — Camada de persistência:

- Schema Drizzle com todas as tabelas.
- Repositórios por entidade (PostRepository, UserRepository, TermRepository, etc.).
- Conexão com pool.
- Integração com Redis para object cache.
- Gerenciamento de schema incremental (delta).

**`@cms/query-engine`** — Motor de consultas:

- Recebe parâmetros declarativos, constrói queries type-safe via Drizzle.
- Implementa subconsultas de taxonomia, meta e data.
- Expõe interface `QueryResult` com flags de tipo (isSingle, isArchive, isSearch, etc.).

**`@cms/auth`** — Segurança:

- Hash de senha (bcrypt com pré-hash HMAC-SHA384).
- Geração/validação de cookies.
- Gerenciamento de sessões (Redis-backed).
- Nonces.
- Senhas de aplicação.
- Integração com Passport.js strategies.

**`@cms/editor`** — Editor de blocos:

- Parser de blocos (comentários HTML → árvore).
- Serializer de blocos (árvore → comentários HTML).
- Componentes React para cada tipo de bloco nativo.
- Registro de tipos de bloco com schemas Zod.
- Sistema de suportes (gera classes/estilos CSS).
- Integração com Plate.js.

**`@cms/media`** — Mídia:

- Adaptador de armazenamento (disco local, S3).
- Pipeline de processamento via Sharp (resize, crop, rotate, flip).
- Geração de tamanhos intermediários.
- Geração de srcset.
- Extração de metadados (EXIF, dimensões).

**`@cms/html-processor`** — Processamento HTML:

- Tag processor (varredura linear, modificação de atributos).
- Full processor (árvore HTML5, breadcrumbs, fechamento implícito).
- Decodificação de entidades.
- Zero dependência externa — implementação própria conforme spec.

**`apps/api`** (NestJS) — Orquestrador do sistema:

- Módulos NestJS mapeando 1:1 para subsistemas da spec (PostsModule, UsersModule, TaxonomyModule, MediaModule, CommentsModule, etc.).
- Bootstrap completo (17 fases) como lifecycle hook do NestJS.
- Extensões carregadas como módulos dinâmicos.
- Guards para autenticação, Interceptors para cache, Pipes para validação.

**`apps/web`** (Next.js) — Frontend e Admin:

- `/` — Frontend público (SSR/SSG com templates renderizados server-side).
- `/admin` — Painel administrativo (Server Components + Client Components onde necessário).
- `/admin/editor` — Editor de blocos (Client Component com `@cms/editor`).
- `/admin/customizer` — Personalizador com preview ao vivo.
- API Routes como proxy thin para a API NestJS quando necessário.

---

## Decisões Técnicas Críticas

### 1. Serialização — Redesign Completo

O sistema original serializa estruturas de dados complexas (arrays, objetos) como texto opaco em colunas de banco. Isso é **ineficiente e impossibilita consultas no banco**. Na reimplementação:

**Usar JSONB do PostgreSQL em vez de serialização textual:**

| Dado                                     | Original (texto serializado)      | Reimplementação (JSONB)                     |
| ---------------------------------------- | --------------------------------- | ------------------------------------------- |
| Capacidades do usuário                   | `a:1:{s:13:"administrator";b:1;}` | `{"administrator": true}` em coluna JSONB   |
| Opções complexas (widgets, menus ativos) | Texto serializado opaco           | Coluna JSONB consultável                    |
| Metadados com valor complexo             | Texto serializado                 | JSONB com GIN index                         |
| Tokens de sessão                         | Array serializado no usermeta     | Tabela dedicada `sessions` + Redis          |
| Extensões ativas                         | Array serializado na options      | Array JSONB com GIN index                   |
| Regras de reescrita                      | Array serializado na options      | JSONB ou tabela dedicada `rewrite_rules`    |
| Eventos agendados (cron)                 | Array aninhado serializado        | Tabela dedicada `scheduled_events` + BullMQ |

**Vantagens concretas:**

- Consultas no banco: `WHERE meta_value_json->>'cor' = 'azul'` em vez de deserializar tudo em memória.
- Índices GIN para busca eficiente em JSONB.
- Atualizações parciais: `jsonb_set()` em vez de ler, deserializar, modificar, serializar, gravar.
- Tipagem no ORM: Drizzle mapeia JSONB para tipos TypeScript.

**Regra de ouro:** Se o dado precisa ser consultado, nunca serialize — use JSONB ou tabela relacional. Se é opaco (apenas lido/escrito inteiro), JSONB ainda é superior a texto serializado por eliminar parse/serialize.

### 2. Cron — Substituição por Filas Reais

O sistema original dispara tarefas agendadas **dentro do ciclo de vida de uma requisição HTTP** — um visitante carrega uma página e, como efeito colateral, o cron é verificado. Isso é frágil (depende de tráfego), impreciso e penaliza a latência.

**Reimplementação com BullMQ:**

```
┌────────────────┐     ┌──────────────┐     ┌──────────────┐
│  API (NestJS)  │────▶│ Redis Queue  │────▶│  BullMQ      │
│  registra job  │     │ (scheduling) │     │  Worker      │
└────────────────┘     └──────────────┘     │  (processa)  │
                                            └──────────────┘
```

- Eventos únicos: `queue.add('hook_name', payload, { delay: ms_ate_timestamp })`.
- Eventos recorrentes: `queue.add('hook_name', payload, { repeat: { every: interval_ms } })`.
- Concorrência controlada: workers com limite de jobs simultâneos.
- Retry automático com backoff exponencial.
- Dashboard de monitoramento via BullBoard.
- **A API de registro permanece idêntica à da spec** — a diferença é que por baixo usa BullMQ em vez de pseudo-cron.

### 3. Sessões — Redis em Vez de Metadados

O sistema original armazena tokens de sessão como metadado serializado do usuário. Cada login/verificação faz query + deserialização.

**Reimplementação:**

- Sessões armazenadas diretamente no Redis com TTL nativo.
- Chave: `session:{user_id}:{token_hash}`.
- Valor: JSON com expiração, IP, user-agent, timestamp de login.
- Operações O(1) para criar, verificar, destruir.
- `SCAN session:{user_id}:*` para listar sessões do usuário.
- TTL do Redis garante expiração sem garbage collection.

### 4. Object Cache — Redis com Namespace

| Recurso                    | Implementação                                          |
| -------------------------- | ------------------------------------------------------ |
| Cache groups               | Prefixo Redis: `cache:{group}:{key}`                   |
| Grupos globais (multisite) | Sem prefixo de site: `cache:global:{group}:{key}`      |
| Grupos por-site            | Com prefixo: `cache:site:{id}:{group}:{key}`           |
| Flush por grupo            | `SCAN` + `DEL` por pattern (ou Redis hashes por grupo) |
| Flush total                | `FLUSHDB` do database Redis dedicado ao cache          |
| TTL                        | Configurável por grupo via Redis TTL nativo            |
| Operações em lote          | `MGET` / `MSET` / pipeline                             |

### 5. Busca Textual — PostgreSQL Full-Text Search

Em vez de `LIKE '%termo%'` (lento, sem ranking):

- Coluna `search_vector tsvector` na tabela posts, atualizada via trigger.
- Índice GIN no search_vector.
- Query: `WHERE search_vector @@ plainto_tsquery('portuguese', 'termo de busca')`.
- Ranking: `ts_rank(search_vector, query)` para ordenação por relevância.
- Indexa título (peso A), excerto (peso B), conteúdo (peso C).
- Suporte a stemming por idioma.
- Performance: índice GIN torna busca O(log n) em vez de O(n).

### 6. Modelo "Tudo é Post" — Manter com Otimizações

A spec exige que todo conteúdo viva na mesma tabela. Manter essa decisão, mas otimizar:

- **Índice parcial por tipo:** `CREATE INDEX idx_posts_publish ON posts (post_date DESC) WHERE post_type = 'post' AND post_status = 'publish'` — evita scan em revisões, autosaves, etc.
- **Partitioning por post_type** (se a tabela ultrapassar milhões de registros): PostgreSQL declarative partitioning separa fisicamente tipos diferentes.
- **Materialized views** para contagens caras (posts por categoria, posts por autor) com refresh periódico.

### 7. Metadados — Tabela EAV com Superpoderes

A tabela de metadados (entity-attribute-value) é mantida conforme spec, mas com melhorias:

- Coluna `meta_value TEXT` mantida para compatibilidade.
- Coluna adicional `meta_value_json JSONB` populada automaticamente quando o valor é JSON válido.
- Índice GIN em `meta_value_json` para consultas estruturadas.
- Índice B-tree em `(post_id, meta_key)` para lookups rápidos.
- Índice parcial em `meta_key` para chaves frequentes.

### 8. API REST — NestJS Controllers Mapeados à Spec

Cada recurso da spec vira um módulo NestJS:

```
PostsModule          → /api/v2/posts, /api/v2/pages, /api/v2/{custom-type}
UsersModule          → /api/v2/users, /api/v2/users/me
CommentsModule       → /api/v2/comments
TaxonomyModule       → /api/v2/categories, /api/v2/tags, /api/v2/{custom-tax}
MediaModule          → /api/v2/media
SettingsModule       → /api/v2/settings
BlockTypesModule     → /api/v2/block-types, /api/v2/block-patterns
RevisionsModule      → /api/v2/posts/{id}/revisions
SearchModule         → /api/v2/search
BatchModule          → /api/v2/batch
```

**Interceptors globais:**

- `EmbedInterceptor` — resolve `_embed` param incluindo recursos vinculados.
- `FieldsInterceptor` — filtra campos com `_fields` param.
- `EnvelopeInterceptor` — encapsula resposta com `_envelope` param.
- `CacheInterceptor` — cache Redis por rota com invalidação por entidade.

**Guards:**

- `CookieAuthGuard` — valida cookie + nonce para requests com mutação.
- `AppPasswordGuard` — HTTP Basic com senhas de aplicação.
- `PermissionGuard` — verifica capacidades via `@RequireCapability('edit_posts')` decorator.

### 9. Frontend — Next.js App Router

```
apps/web/
├── app/
│   ├── (public)/                    # Frontend público
│   │   ├── layout.tsx               # Template wrapper (header/footer via parts)
│   │   ├── page.tsx                 # Homepage (front-page ou home da spec)
│   │   ├── [year]/[month]/[slug]/   # Single post (permalink structure)
│   │   ├── [slug]/                  # Pages
│   │   ├── category/[slug]/         # Category archive
│   │   ├── tag/[slug]/              # Tag archive
│   │   ├── author/[slug]/           # Author archive
│   │   ├── search/                  # Search results
│   │   └── not-found.tsx            # 404
│   │
│   ├── admin/                       # Painel administrativo
│   │   ├── layout.tsx               # Admin shell (sidebar, toolbar)
│   │   ├── dashboard/               # Dashboard
│   │   ├── posts/                   # Listagem + editor
│   │   ├── pages/                   # Listagem + editor
│   │   ├── media/                   # Media library
│   │   ├── comments/                # Moderação
│   │   ├── users/                   # Gestão de usuários
│   │   ├── appearance/              # Temas, customizer, menus, widgets
│   │   ├── plugins/                 # Gestão de extensões
│   │   ├── settings/                # Configurações gerais
│   │   └── tools/                   # Import/export, privacidade
│   │
│   ├── api/                         # API Routes (proxy thin ou webhooks)
│   │   └── auth/[...nextauth]/      # Auth endpoints
│   │
│   └── sitemap.xml/                 # Sitemap dinâmico via route handler
│
├── components/
│   ├── blocks/                      # Renderização de cada tipo de bloco
│   ├── admin/                       # Componentes do painel
│   └── ui/                          # shadcn/ui components
│
└── lib/
    ├── api-client.ts                # Instância do @cms/sdk
    ├── auth.ts                      # Helpers de autenticação
    └── hooks.ts                     # React hooks para dados do CMS
```

**Hierarquia de templates no Next.js:**
A hierarquia da spec é implementada via layout nesting e route matching do App Router. O sistema de reescrita da spec mapeia para o file-system routing do Next.js, com `[...slug]` catch-all para rotas dinâmicas resolvidas pelo query engine.

### 10. Extensões — Módulos Dinâmicos NestJS

O sistema de extensões é o maior desafio arquitetural. Abordagem:

**Backend (extensões server-side):**

- Extensões são pacotes npm com um `manifest.json` (equivalente aos cabeçalhos da spec).
- Cada extensão exporta um `NestJS DynamicModule` que é carregado via `LazyModuleLoader`.
- O HookEngine é injetado em cada extensão via DI — extensões registram callbacks.
- Ativação/desativação modifica a opção do banco e recarrega os módulos.
- Sandbox: extensões são carregadas dentro de try/catch; erro fatal → pausa + notificação.

**Frontend (extensões client-side):**

- Extensões podem registrar componentes React para o admin panel.
- Slot system: pontos de extensão definidos no admin onde extensões injetam UI.
- Carregamento dinâmico via `React.lazy()` + `import()`.

### 11. Autosave e Tempo Real

**WebSocket via Socket.io** (integrado ao NestJS Gateway):

- Autosave a cada 60 segundos via WebSocket (não HTTP — elimina overhead de conexão).
- Lock de edição: quando um usuário edita um post, outros veem aviso "sendo editado por X".
- Preview ao vivo no customizer via WebSocket (mudanças no painel refletem no iframe de preview).
- Notificações de moderação de comentários em tempo real.

### 12. Segurança

| Camada          | Proteção                                                             |
| --------------- | -------------------------------------------------------------------- |
| SQL Injection   | Drizzle ORM (queries parametrizadas) — nunca concatenar strings      |
| XSS             | React (escape automático) + sanitização server-side de conteúdo HTML |
| CSRF            | Nonces (spec) + SameSite cookies + verificação de Origin header      |
| Brute force     | Rate limiting via @nestjs/throttler + delay progressivo no login     |
| SSRF            | Validação de URL no cliente HTTP (bloquear IPs privados, localhost)  |
| Path traversal  | Validação de caminhos de extensão e upload                           |
| Mass assignment | Zod schemas explícitos — só campos declarados são aceitos            |
| Timing attacks  | Comparação de hash em tempo constante (`crypto.timingSafeEqual`)     |
| Secrets         | Chaves em variáveis de ambiente, nunca no código                     |

---

## Princípios de Trabalho

### 1. Fidelidade Funcional Acima de Tudo

Cada comportamento descrito na especificação é um requisito. Não simplifique, não "melhore", não pule subsistemas achando que são irrelevantes. O sistema original é uma peça de engenharia com 20+ anos de evolução e cada comportamento existe por uma razão — mesmo os que parecem legado.

**Em particular:**

- O sistema de ganchos (hooks) é a espinha dorsal. Se ele não funcionar perfeitamente — com prioridades, execução recursiva, gancho universal, pilha de contexto — nada mais vai funcionar.
- O modelo "tudo é post" é mantido, mas com índices parciais e partitioning para performance.
- A ordem de carregamento (bootstrap) é estrita. Extensões obrigatórias antes de regulares. Tema depois de extensões. Init depois de tudo.
- A compatibilidade retroativa de hashes de senha (múltiplos algoritmos reconhecidos) é essencial.

### 2. Performance por Design

Decisões que evitam problemas de performance desde o início:

| Problema do original                                 | Solução na reimplementação                           |
| ---------------------------------------------------- | ---------------------------------------------------- |
| Serialização de dados complexos em TEXT              | JSONB com índices GIN                                |
| Cron disparado por request HTTP                      | BullMQ com workers dedicados                         |
| Sessões como metadado serializado do usuário         | Redis com TTL nativo                                 |
| Object cache em memória (não-persistente por padrão) | Redis como padrão (persistente entre requests)       |
| LIKE '%search%' sem índice                           | PostgreSQL tsvector com índice GIN                   |
| N+1 queries em meta e termos                         | Batch loading com DataLoader pattern                 |
| Autoload de TODAS as opções marcadas                 | Lazy loading com cache Redis + invalidação por chave |
| Contagens de termos calculadas em cada atribuição    | Materialized views com refresh incremental           |

### 3. Implementação Incremental por Camadas

Não tente construir tudo de uma vez. Siga esta ordem de camadas, onde cada uma depende das anteriores.

---

## Plano de Implementação em 7 Fases

### FASE 1 — Fundação (Infraestrutura Crítica)

Implemente primeiro os alicerces sobre os quais tudo mais se constrói:

**1.1 Monorepo e Tooling**

- Inicializar monorepo com Turborepo + pnpm workspaces.
- Configurar TypeScript strict, ESLint, Prettier compartilhados.
- Docker Compose com PostgreSQL 17 + Redis 7.
- CI pipeline básico (lint, typecheck, test).

**1.2 Sistema de Ganchos (`@cms/core`)**

- Classe `HookEngine` com registro, execução, filtros, ações.
- Prioridade numérica, execução recursiva, gancho universal "all".
- Pilha de ganchos em execução, contadores de disparo.
- Identificadores únicos por tipo de callback.
- Remoção precisa com match de prioridade.
- **100% coberto por testes unitários antes de avançar.**

**1.3 Camada de Persistência (`@cms/database`)**

- Schema Drizzle com todas as tabelas (posts, postmeta, users, usermeta, comments, commentmeta, terms, term_taxonomy, term_relationships, termmeta, options, links).
- Repositórios base com CRUD type-safe.
- Connection pool configurável.
- Migrações iniciais via Drizzle Kit.
- Seed de dados para desenvolvimento.

**1.4 Cache de Objetos**

- Interface Redis-backed: get, set, add, delete, flush, incr, decr, getMultiple, setMultiple.
- Agrupamento por grupos com prefixo de chave.
- Suporte a grupos globais vs. por-site.
- TTL configurável por grupo.
- Flush por grupo via SCAN + pipeline DEL.

**1.5 Sistema de Opções**

- CRUD de opções com integração Redis (autoloaded options pré-carregadas).
- Cache de "não existentes" no Redis.
- JSONB para valores complexos (em vez de serialização textual).
- Invalidação granular de cache na escrita.

**Critério de conclusão da Fase 1:** Ganchos registram e executam corretamente (com testes). Banco conecta e CRUD funciona. Redis opera como cache. Opções CRUD com cache integrado.

---

### FASE 2 — Conteúdo e Consultas

**2.1 Tipos de Conteúdo**

- Registro de post types com todas as propriedades via decorator ou função.
- Tipos nativos registrados no bootstrap.
- Status de conteúdo com semântica completa.
- CRUD de posts: inserir, atualizar, excluir (lixeira e permanente), obter.
- Posts fixos (sticky).
- Coluna `search_vector tsvector` com trigger de atualização + índice GIN.

**2.2 Metadados**

- API genérica de metadados para posts, usuários, comentários e termos.
- Serialização JSONB automática para valores complexos.
- DataLoader pattern para evitar N+1 em batch queries.

**2.3 Motor de Consultas (`@cms/query-engine`)**

- Consulta declarativa com builder type-safe sobre Drizzle.
- Todos os parâmetros da spec: tipo, status, autor, data, paginação, ordenação, busca, inclusão/exclusão.
- Subconsulta de taxonomia com relações AND/OR aninhadas.
- Subconsulta de metadados com casting de tipos e operadores.
- Subconsulta de datas com intervalo.
- Flags de tipo de requisição (isSingle, isArchive, isSearch, is404, isHome).
- Gancho de pré-consulta.
- Full-text search via tsvector.

**2.4 Taxonomias**

- Registro de taxonomias nativas + personalizadas.
- CRUD de termos, atribuição a objetos, contagem automática.
- Consulta de termos com filtros.
- Materialized view para contagens de termos (refresh via trigger ou BullMQ job).

**2.5 Revisões e Autosave**

- Criação automática de revisão na atualização.
- Diff para evitar revisão sem mudança.
- Limite configurável com cleanup.
- Restauração com metadados revisionáveis.
- Autosave via WebSocket (Socket.io) a cada 60 segundos.

**Critério de conclusão da Fase 2:** CRUD de posts com metadados e taxonomias. Queries complexas com paginação retornando resultados corretos. Full-text search funcionando. Revisões e autosave operacionais.

---

### FASE 3 — Usuários e Segurança

**3.1 Usuários**

- CRUD com Drizzle + Redis cache.
- Metadados via tabela usermeta.

**3.2 Papéis e Capacidades (`@cms/auth`)**

- Papéis como JSONB na tabela options.
- 5 papéis padrão com capacidades.
- Meta-capabilities com mapeamento contextual.
- `@RequireCapability()` decorator para guards do NestJS.

**3.3 Autenticação (`@cms/auth`)**

- Hash: bcrypt com pré-hash HMAC-SHA384 via `crypto` nativo do Node.js.
- Reconhecimento de hashes legados (bcrypt puro, argon2) com rehash automático.
- Login por username ou email.
- Cookies com HMAC-SHA256, HttpOnly, Secure, SameSite.
- Sessões no Redis com TTL nativo.
- Nonces CSRF com janela de 24h.
- Senhas de aplicação para API (HTTP Basic Auth).
- Passport.js strategies: CookieStrategy, AppPasswordStrategy.
- Rate limiting: 5 tentativas por minuto por IP/username.

**Critério de conclusão da Fase 3:** Login funcional com cookies validados. Verificação de capacidades com mapeamento contextual. Nonces protegendo mutations. App passwords autenticando na API.

---

### FASE 4 — Extensibilidade

**4.1 Extensões**

- Manifest.json com metadados (equivalente aos cabeçalhos da spec).
- Carregamento como NestJS DynamicModules.
- Ativação em sandbox (try/catch com timeout).
- Dependências verificadas na ativação/desativação.
- Drop-ins para substituição de cache e banco.
- Recovery mode: detecção de erro → pausa → email → link de recuperação.

**4.2 Temas (Next.js)**

- Tema = pacote npm com templates React + configuração JSON.
- Hierarquia de templates implementada via resolução dinâmica no servidor.
- Temas filho: merge de componentes (filho sobrescreve pai).
- Theme mods armazenados per-tema na options (JSONB).
- Funcionalidades de tema via registro no bootstrap.

**4.3 Bootstrap**

- As 17 fases da spec como lifecycle do NestJS `onModuleInit` + hooks customizados.
- Ordem estritamente respeitada.
- Short-init para endpoints leves.

**Critério de conclusão da Fase 4:** Extensão ativada modifica comportamento via ganchos. Tema define templates selecionados pela hierarquia. Bootstrap executa na ordem correta.

---

### FASE 5 — Interface e Apresentação

**5.1 API REST (NestJS Controllers)**

- Todos os endpoints da spec com validação Zod.
- Swagger/OpenAPI gerado automaticamente.
- Autenticação nos 3 modos.
- Batch processing (até 25 sub-requisições).
- Embedding, seleção de campos, envelope.
- Paginação via headers `X-Total-Count`, `Link`.

**5.2 Reescrita de URLs**

- Resolução de URL para variáveis de consulta via matching de padrões.
- Tags de estrutura configuráveis.
- Armazenamento de regras no PostgreSQL (JSONB).
- Integração com Next.js routing.

**5.3 Editor de Blocos (`@cms/editor`)**

- Parser de blocos (comentários HTML → árvore) — implementação própria.
- Serializer (árvore → comentários HTML).
- Componentes Plate.js para edição visual.
- Registro de tipos de bloco com schemas Zod.
- Suportes de bloco (alinhamento, cores, tipografia, espaçamento, bordas, sombras, layout).
- Padrões de blocos.
- Toolbar com controles por tipo de bloco.
- Drag-and-drop para reordenação.

**5.4 Processador HTML (`@cms/html-processor`)**

- Tag processor: varredura linear, modificação de atributos/classes.
- Full processor: árvore HTML5 com pilha de elementos, breadcrumbs.
- Implementação própria (zero dependência), conforme spec.

**5.5 Comentários**

- CRUD com threading (hierarquia).
- Moderação: duplicatas, flood, palavras bloqueadas.
- Akismet-like hook para extensões de anti-spam.

**5.6 Widgets e Menus**

- Widgets: componentes React registráveis com configuração + áreas.
- Menus: CRUD de itens hierárquicos, localizações, renderização server-side.

**5.7 Códigos Curtos**

- Registro de padrão + callback.
- Parser regex unificado.
- Suporte a aninhamento e escape.

**Critério de conclusão da Fase 5:** API REST completa com Swagger. Editor de blocos funcional. Comentários com moderação. Admin panel navegável.

---

### FASE 6 — Subsistemas de Suporte

**6.1 Mídia (`@cms/media`)**

- Upload via multer → pipeline Sharp → storage adapter (disco/S3).
- Geração de tamanhos intermediários com fila BullMQ (não bloqueia o request).
- Metadados EXIF extraídos e armazenados como JSONB.
- Srcset gerado automaticamente.
- Media Library como componente React com grid, busca e bulk actions.

**6.2 Internacionalização (`@cms/i18n`)**

- Funções de tradução: \_\_, \_e, \_x, \_n, \_nx com escape.
- Domínios de texto independentes.
- Loader de catálogos (.json por locale).
- next-intl para frontend, i18next para backend.
- Determinação de locale (config → opção → user preference → padrão).

**6.3 Agendador de Tarefas (BullMQ)**

- API de registro idêntica à da spec (scheduleEvent, scheduleRecurring).
- Internamente: BullMQ delayed jobs e repeatable jobs.
- Dashboard via BullBoard em `/admin/tools/queue`.
- Workers separados do processo principal da API.
- Retry com backoff exponencial.
- Dead letter queue para jobs falhados.

**6.4 Transients**

- Redis-backed com TTL nativo.
- Interface: setTransient, getTransient, deleteTransient.
- Sem tocar no banco — Redis-only.

**6.5 Cliente HTTP**

- Wrapper sobre `fetch` nativo do Node.js 22.
- Timeout, redirects, headers, cookies, body.
- Validação SSRF (bloquear ranges privados).
- Streaming para arquivo.
- Retry configurável.

**6.6 Enfileiramento de Assets**

- Registro de scripts/estilos com dependências.
- Resolução topológica de grafo de dependências.
- Integração com Next.js `<Script>` e `<link>`.
- Scripts inline, dados localizados.
- Estratégias defer/async.

**6.7 Incorporação (oEmbed)**

- Lista de provedores conhecidos (60+).
- Descoberta de oEmbed em URLs desconhecidas.
- Cache em Redis com TTL de 1 semana.
- Endpoint REST como provedor.

**6.8 Sitemap XML**

- Gerado via Next.js route handler (`app/sitemap.xml/route.ts`).
- Índice + sub-sitemaps paginados (2000 URLs).
- Provedores: posts, taxonomias, autores.
- Referência em robots.txt.

**6.9 Personalizador**

- Interface Next.js com iframe de preview.
- WebSocket para preview ao vivo.
- Configurações, controles, seções.
- Armazenamento como theme_mods (JSONB na options).

**Critério de conclusão da Fase 6:** Upload com redimensionamento assíncrono. Traduções funcionando. Jobs processando em filas. Sitemap gerando XML válido. oEmbed incorporando.

---

### FASE 7 — Funcionalidades Avançadas

**7.1 Multisite**

- Tabelas por site com prefixo dinâmico (ou schema PostgreSQL por site).
- Detecção de site via hostname + path.
- Troca de contexto com pilha.
- Super administrador.
- Extensões e opções de nível de rede.
- Row Level Security (RLS) do PostgreSQL como camada adicional de isolamento.

**7.2 Estilos Globais e Design Tokens**

- Parser de arquivo JSON de configuração.
- Cascata de 4 fontes com deep merge.
- Geração de CSS custom properties.
- Geração de classes utilitárias.
- Integração com Tailwind para tokens customizados.

**7.3 Privacidade e Proteção de Dados**

- Fluxo de solicitação com confirmação por email.
- Exportação: coletores registráveis, saída em ZIP via archiver.
- Exclusão: apagadores registráveis.
- Coleta de textos para política de privacidade.

**7.4 Recovery Mode**

- Detecção de erro fatal no carregamento de extensão.
- Pausa automática.
- Email via Nodemailer + React Email com link temporário.
- Sessão de recuperação.

**Critério de conclusão da Fase 7:** Multisite com isolamento real. Design tokens gerando CSS. Exportação de dados em ZIP. Recovery mode protegendo contra crash.

---

## Verificação de Completude

Ao finalizar cada fase, valide contra esta checklist:

### Fase 1

- [ ] HookEngine: 100% dos testes passando (registro, prioridade, recursão, universal, pilha, contadores, remoção)
- [ ] PostgreSQL: todas as tabelas criadas via Drizzle migration
- [ ] Redis: cache operacional com get/set/delete/flush por grupo
- [ ] Opções: CRUD com autoload via Redis, JSONB para valores complexos
- [ ] Docker Compose: `docker compose up` sobe todo o ambiente
- [ ] CI: lint + typecheck + testes passando

### Fase 2

- [ ] Post types registram com todas as propriedades
- [ ] CRUD de posts com todos os status + full-text search
- [ ] Meta CRUD genérico com JSONB para valores complexos
- [ ] Query engine gera SQL correto para todos os parâmetros (20+ testes de integração)
- [ ] Subconsultas de taxonomia/meta/data com relações aninhadas
- [ ] Taxonomias registram, termos CRUD, atribuição com contagem
- [ ] Revisões criadas automaticamente, restauração funciona
- [ ] Autosave via WebSocket a cada 60s

### Fase 3

- [ ] Usuários CRUD com metadados
- [ ] 5 papéis padrão com capacidades corretas
- [ ] Meta-capabilities resolvem corretamente
- [ ] Login por username e email com cookies HMAC
- [ ] Sessões no Redis com TTL
- [ ] Nonces com janela de 24h
- [ ] App passwords via HTTP Basic na API
- [ ] Rate limiting no login

### Fase 4

- [ ] Extensões carregam como módulos dinâmicos NestJS
- [ ] Dependências verificadas
- [ ] Bootstrap nas 17 fases na ordem correta
- [ ] Hierarquia de templates seleciona corretamente
- [ ] Tema filho herda do pai
- [ ] Theme mods per-tema em JSONB
- [ ] Recovery mode pausa extensão com erro

### Fase 5

- [ ] API REST com todos os endpoints + Swagger
- [ ] Autenticação nos 3 modos
- [ ] Validação Zod rejeita dados inválidos
- [ ] Batch processing (até 25 sub-requisições)
- [ ] URLs amigáveis resolvendo
- [ ] Editor de blocos: parse, render, edição visual
- [ ] Suportes de bloco gerando CSS
- [ ] Processador HTML sem quebrar marcação
- [ ] Comentários com threading e moderação
- [ ] Widgets em áreas, menus em localizações

### Fase 6

- [ ] Upload → Sharp pipeline → storage adapter → tamanhos intermediários
- [ ] Traduções com domínios e pluralização
- [ ] BullMQ processando jobs com retry
- [ ] Transients com TTL no Redis
- [ ] Cliente HTTP com validação SSRF
- [ ] Assets enfileirados na ordem de dependências
- [ ] oEmbed incorporando 60+ provedores
- [ ] Sitemap XML válido com paginação

### Fase 7

- [ ] Multisite com isolamento por schema/prefix + RLS
- [ ] Design tokens → CSS custom properties
- [ ] Exportação de dados pessoais em ZIP
- [ ] Recovery mode: erro → pausa → email → link → sessão de recuperação

---

## Formato de Entrega

Para cada fase concluída, entregue:

1. **Código-fonte** organizado conforme estrutura do monorepo.
2. **Suite de testes** (Vitest unitário, Supertest integração, Playwright E2E conforme a fase).
3. **Migration files** do Drizzle Kit.
4. **Documento de decisões** explicando escolhas que divergem da spec (ex.: JSONB em vez de serialização, BullMQ em vez de pseudo-cron).
5. **Swagger/OpenAPI spec** gerado (a partir da Fase 5).
6. **Docker Compose** atualizado se novos serviços foram adicionados.

---

## Notas Importantes

- **Não consulte o código-fonte original.** Este é um exercício de clean room. A especificação é sua única referência.
- **Não use bibliotecas que sejam parte do sistema original.** A reimplementação deve ser independente.
- **Priorize corretude sobre performance — mas não ignore performance.** As decisões técnicas deste prompt (JSONB, Redis, BullMQ, tsvector) já endereçam os gargalos conhecidos. Implemente-as desde o início.
- **Quando a especificação for ambígua, documente sua interpretação** e siga-a consistentemente.
- **O sistema de ganchos é a prioridade zero.** É o primeiro código a ser escrito e o mais testado. Se ele falhar, os 34 subsistemas restantes falham.
- **TypeScript strict mode é inegociável.** `noImplicitAny`, `strictNullChecks`, `strictFunctionTypes` — sem exceções. Isso previne classes inteiras de bugs em um sistema desta complexidade.
- **Cada pacote do monorepo deve ser publicável independentemente.** `@cms/core`, `@cms/query-engine`, `@cms/html-processor` e `@cms/sdk` devem funcionar sem o resto do monorepo.

---

_Este prompt, combinado com `CLEAN-ROOM-SPEC.md`, contém toda a informação necessária para reimplementar o ecossistema completo. Comece pela Fase 1: monorepo setup + HookEngine + banco + cache._
