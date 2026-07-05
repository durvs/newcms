# Especificação Funcional Clean Room — Sistema de Gerenciamento de Conteúdo

> **Documento de engenharia reversa funcional.** Descreve o comportamento completo do sistema sem referências a código-fonte, nomes de produto, marcas ou tecnologias específicas. O objetivo é permitir a reimplementação integral em qualquer stack tecnológico.

---

## Índice

1. [Visão Geral da Arquitetura](#1-visão-geral-da-arquitetura)
2. [Ciclo de Vida de uma Requisição](#2-ciclo-de-vida-de-uma-requisição)
3. [Sistema de Ganchos (Hooks)](#3-sistema-de-ganchos-hooks)
4. [Camada de Persistência (Banco de Dados)](#4-camada-de-persistência-banco-de-dados)
5. [Sistema de Consultas (Query Engine)](#5-sistema-de-consultas-query-engine)
6. [Tipos de Conteúdo](#6-tipos-de-conteúdo)
7. [Sistema de Classificação (Taxonomias)](#7-sistema-de-classificação-taxonomias)
8. [Revisões e Salvamento Automático](#8-revisões-e-salvamento-automático)
9. [Metadados](#9-metadados)
10. [Usuários, Papéis e Permissões](#10-usuários-papéis-e-permissões)
11. [Autenticação e Sessões](#11-autenticação-e-sessões)
12. [Extensões (Plugins)](#12-extensões-plugins)
13. [Temas e Templates](#13-temas-e-templates)
14. [Editor de Blocos](#14-editor-de-blocos)
15. [Processador de Marcação HTML](#15-processador-de-marcação-html)
16. [API REST](#16-api-rest)
17. [Sistema de Mídia](#17-sistema-de-mídia)
18. [Comentários](#18-comentários)
19. [Widgets e Áreas Laterais](#19-widgets-e-áreas-laterais)
20. [Menus de Navegação](#20-menus-de-navegação)
21. [Códigos Curtos (Shortcodes)](#21-códigos-curtos-shortcodes)
22. [Incorporação de Conteúdo Externo (oEmbed)](#22-incorporação-de-conteúdo-externo-oembed)
23. [Cache de Objetos](#23-cache-de-objetos)
24. [Opções e Configurações](#24-opções-e-configurações)
25. [Valores Temporários (Transients)](#25-valores-temporários-transients)
26. [Agendador de Tarefas (Cron)](#26-agendador-de-tarefas-cron)
27. [URLs Amigáveis (Reescrita)](#27-urls-amigáveis-reescrita)
28. [Internacionalização (i18n)](#28-internacionalização-i18n)
29. [Cliente HTTP](#29-cliente-http)
30. [Enfileiramento de Scripts e Estilos](#30-enfileiramento-de-scripts-e-estilos)
31. [Mapa do Site (Sitemap)](#31-mapa-do-site-sitemap)
32. [Rede de Sites (Multisite)](#32-rede-de-sites-multisite)
33. [Privacidade e Proteção de Dados](#33-privacidade-e-proteção-de-dados)
34. [Estilos Globais e Design Tokens](#34-estilos-globais-e-design-tokens)
35. [Modo de Recuperação](#35-modo-de-recuperação)

---

## 1. Visão Geral da Arquitetura

O sistema é uma plataforma de gerenciamento de conteúdo modular, extensível e orientada por ganchos (hooks). Possui três camadas principais:

- **Núcleo:** Fornece todas as funcionalidades fundamentais — persistência, autenticação, renderização de templates, API REST, mecanismo de consultas.
- **Extensões:** Módulos opcionais que se conectam ao núcleo via ganchos, adicionando ou modificando comportamento sem alterar o código base.
- **Temas:** Definem a apresentação visual e a estrutura de templates para o conteúdo. Funcionam como uma extensão especializada na camada de apresentação.

### Princípios Arquiteturais

- **Extensibilidade via ganchos:** Praticamente toda decisão do sistema passa por um ponto de interceptação (filtro ou ação) onde extensões podem modificar o comportamento.
- **Carregamento progressivo:** O sistema inicializa em fases ordenadas — configuração, banco de dados, cache, extensões obrigatórias, extensões regulares, tema, inicialização final.
- **Substituição por drop-in:** Componentes críticos (banco de dados, cache, tratamento de erros) podem ser substituídos por arquivos especiais colocados no diretório de conteúdo.
- **Funções substituíveis (pluggable):** Um conjunto de funções centrais (autenticação, hash de senha, criação de nonce) pode ser completamente substituído por extensões, desde que definam a função antes do núcleo.

---

## 2. Ciclo de Vida de uma Requisição

### 2.1 Sequência de Inicialização (Bootstrap)

A inicialização ocorre em fases estritamente ordenadas:

**Fase 1 — Ponto de entrada:**
O ponto de entrada recebe a requisição HTTP e inclui o carregador principal.

**Fase 2 — Configuração:**
O arquivo de configuração é carregado. Este arquivo define constantes de conexão ao banco (host, nome do banco, usuário, senha, charset), chaves criptográficas (8 chaves/salts para autenticação), prefixo de tabelas, e flags opcionais (modo debug, cache avançado, limite de memória).

**Fase 3 — Constantes iniciais:**
São definidas constantes de unidades de bytes, limites de memória (40MB padrão, 256MB máximo), modo de desenvolvimento, flags de debug, e diretório de conteúdo.

**Fase 4 — Verificações de ambiente:**
O sistema valida versões mínimas do interpretador e do motor de banco de dados. Normaliza variáveis de servidor para compatibilidade com diferentes servidores web.

**Fase 5 — Tratamento de erros:**
Registra um tratador de erros fatais e um modo de recuperação que pode pausar extensões com falha.

**Fase 6 — Funções utilitárias do núcleo:**
Carrega centenas de módulos de funções — formatação, manipulação de strings, compatibilidade, classes de erro, localização.

**Fase 7 — Conexão ao banco de dados:**
Instancia o adaptador de banco de dados com as credenciais da configuração. Se existir um drop-in de banco de dados no diretório de conteúdo, usa esse em vez do adaptador padrão.

**Fase 8 — Cache de objetos:**
Inicializa o sistema de cache em memória. Se existir um drop-in de cache no diretório de conteúdo, usa uma implementação externa (ex.: cache em memória distribuída).

**Fase 9 — Filtros padrão:**
Registra todos os ganchos padrão do núcleo — dezenas de filtros que conectam as funções básicas aos pontos de interceptação.

**Fase 10 — Extensões obrigatórias (must-use):**
Carrega automaticamente todos os arquivos do diretório de extensões obrigatórias, em ordem alfabética. Não podem ser desativadas pela interface administrativa.

**Fase 11 — Extensões regulares:**
Carrega as extensões marcadas como ativas na opção do banco de dados. Cada extensão é validada (existência do arquivo, segurança do caminho) antes de ser incluída. Extensões pausadas pelo modo de recuperação são ignoradas.

**Fase 12 — Funções substituíveis:**
Carrega as funções de autenticação, hash, nonce e cookie. Se alguma extensão já definiu essas funções, as versões do núcleo são ignoradas.

**Fase 13 — Gancho "extensões carregadas":**
Dispara um gancho sinalizando que todas as extensões estão disponíveis.

**Fase 14 — Objetos globais:**
Cria os objetos globais: motor de consultas principal, sistema de reescrita de URLs, gerenciador de widgets, gerenciador de papéis de usuário.

**Fase 15 — Tema:**
Carrega o arquivo de funções do tema ativo (e do tema pai, se houver tema filho). Dispara gancho de "tema configurado".

**Fase 16 — Inicialização:**
Dispara o gancho principal de inicialização. Extensões e temas registram aqui seus tipos de conteúdo, taxonomias, menus, scripts e estilos.

**Fase 17 — Sistema carregado:**
Dispara gancho final indicando que o sistema está completamente inicializado.

### 2.2 Fluxo Público (Front-end)

Após a inicialização:

1. O objeto principal analisa a URL da requisição contra as regras de reescrita.
2. Transforma a URL em variáveis de consulta (tipo de conteúdo, identificador, página, etc.).
3. Executa a consulta principal ao banco de dados.
4. Determina qual template exibir baseado na hierarquia de templates.
5. Inclui e renderiza o template, que gera a saída HTML.

### 2.3 Fluxo Administrativo (Back-end)

1. Define constantes indicando contexto administrativo.
2. Carrega o mesmo bootstrap do front-end.
3. Desabilita cache HTTP (headers no-cache).
4. Verifica se o esquema do banco precisa de atualização.
5. Carrega a interface administrativa correspondente à página solicitada.

### 2.4 Saída Rápida (Short-init)

Se uma constante especial for definida antes da fase completa, o sistema para após conectar ao banco de dados e inicializar o cache, sem carregar extensões, temas ou sistemas de alto nível. Usado para endpoints leves como processamento assíncrono.

---

## 3. Sistema de Ganchos (Hooks)

O mecanismo central de extensibilidade do sistema. Existem dois tipos:

### 3.1 Ações

Pontos de execução onde código adicional pode ser inserido. Não transformam dados — apenas executam efeitos colaterais.

**Registro:** Uma função é associada a um nome de gancho com uma prioridade numérica (padrão 10) e um número de argumentos aceitos.

**Execução:** Quando o sistema dispara uma ação, todos os callbacks registrados são executados em ordem de prioridade (menor número = primeiro). Callbacks com mesma prioridade executam na ordem de registro.

**Contagem:** O sistema mantém um contador de quantas vezes cada ação foi disparada durante a requisição.

### 3.2 Filtros

Transformam um valor passando-o por uma cadeia de callbacks. Cada callback recebe o valor (potencialmente já modificado pelo anterior) e retorna o valor transformado.

**Mecanismo:** Internamente, ações e filtros usam o mesmo mecanismo de execução. A diferença é que filtros retornam o valor transformado, enquanto ações ignoram o retorno.

### 3.3 Execução Recursiva

O sistema suporta disparo de ganchos dentro de ganchos. Mantém um nível de aninhamento e pilhas de iteração por nível, garantindo que callbacks adicionados ou removidos durante a execução não causem comportamento inesperado.

### 3.4 Gancho Universal

Existe um gancho especial que é executado antes de qualquer outro gancho. Callbacks registrados nele recebem todos os argumentos de qualquer gancho disparado. Útil para logging e debugging.

### 3.5 Pilha de Ganchos

O sistema mantém uma pilha dos ganchos em execução. Permite que qualquer código consulte qual gancho está sendo executado no momento.

### 3.6 Identificadores Únicos

Cada callback é identificado por um ID único derivado de:

- Funções nomeadas: o próprio nome.
- Métodos estáticos: "NomeClasse::nomeMetodo".
- Métodos de instância: hash do objeto + nome do método.

Isso previne duplicatas e permite remoção precisa.

---

## 4. Camada de Persistência (Banco de Dados)

### 4.1 Adaptador de Banco

O sistema usa um adaptador relacional que abstrai a comunicação com o motor de banco de dados. Funcionalidades:

- **Conexão:** Estabelecida automaticamente na construção do objeto com credenciais fornecidas pela configuração.
- **Consultas preparadas:** Aceita placeholders tipados — `%s` (string com escape automático), `%d` (inteiro), `%f` (float), `%i` (identificador de tabela/coluna com escape de crases).
- **Métodos de consulta:**
  - Consulta genérica que retorna o número de linhas afetadas.
  - Busca de múltiplas linhas como objetos, arrays associativos ou indexados.
  - Busca de uma única linha.
  - Busca de um único valor.
- **Operações CRUD auxiliares:** Inserção, atualização, exclusão e substituição que recebem arrays associativos e formatação de tipos.
- **Tratamento de charset:** Detecta e configura automaticamente o melhor charset suportado pelo banco, incluindo suporte a 4 bytes para emojis e caracteres especiais.
- **Log de consultas:** Se uma constante de debug estiver ativa, todas as consultas são registradas com tempo de execução e rastreamento de chamadas.

### 4.2 Esquema de Tabelas

O sistema define as seguintes tabelas (com prefixo configurável):

| Tabela                 | Finalidade                                                                                                   |
| ---------------------- | ------------------------------------------------------------------------------------------------------------ |
| **posts**              | Todo conteúdo principal (artigos, páginas, anexos, revisões, itens de menu, blocos reutilizáveis, templates) |
| **postmeta**           | Metadados arbitrários associados a posts (chave-valor)                                                       |
| **users**              | Contas de usuário (login, senha hash, email, nome exibido, data de registro)                                 |
| **usermeta**           | Metadados de usuário (papéis, preferências, tokens de sessão)                                                |
| **comments**           | Comentários associados a posts                                                                               |
| **commentmeta**        | Metadados de comentários                                                                                     |
| **terms**              | Termos de classificação (nome, slug, grupo)                                                                  |
| **term_taxonomy**      | Associa termos a taxonomias, define hierarquia (pai) e contagem                                              |
| **term_relationships** | Relação muitos-para-muitos entre posts e termos (via term_taxonomy_id)                                       |
| **termmeta**           | Metadados de termos                                                                                          |
| **options**            | Configurações globais do site (chave-valor com flag de carregamento automático)                              |
| **links**              | Links de blogroll (legado)                                                                                   |

**Em modo multisite, tabelas adicionais:**

| Tabela       | Finalidade                                           |
| ------------ | ---------------------------------------------------- |
| **sites**    | Registro de sites na rede (domínio, caminho, status) |
| **sitemeta** | Opções de nível de rede                              |
| **blogs**    | Alias/registro de blogs individuais                  |
| **blogmeta** | Metadados de blogs                                   |
| **signups**  | Registros pendentes de confirmação                   |

### 4.3 Gerenciamento de Esquema

Uma função especial compara a estrutura atual do banco com a estrutura desejada e aplica alterações incrementais (criação de tabelas, adição de colunas, modificação de índices) sem perda de dados.

---

## 5. Sistema de Consultas (Query Engine)

### 5.1 Motor de Consultas Principal

O motor de consultas é o coração do sistema para recuperação de conteúdo. Recebe parâmetros declarativos e gera a consulta SQL correspondente.

**Parâmetros suportados:**

- Identificação direta: por ID, por nome (slug), por título.
- Tipo de conteúdo: filtra por um ou mais tipos registrados.
- Status: publicado, rascunho, pendente, privado, lixeira, agendado, herdado.
- Autoria: por ID ou nome de autor.
- Datas: ano, mês, dia, hora, minuto, segundo, semana.
- Taxonomias: filtragem por termos com operadores (IN, NOT IN, AND, EXISTS) e suporte a relações AND/OR aninhadas.
- Metadados: filtragem por chaves e valores de meta com operadores de comparação (=, !=, >, <, LIKE, BETWEEN, REGEXP, etc.) e casting de tipos.
- Datas avançadas: consultas de intervalo com antes/depois, colunas configuráveis.
- Paginação: itens por página, offset, página atual.
- Ordenação: por data, título, nome, modificação, pai, aleatório, relevância, ordem de menu, contagem de comentários, valor de meta, ordem de inclusão.
- Campos: retornar objetos completos, apenas IDs, ou pares ID-pai.
- Busca textual: pesquisa por palavra-chave no título, conteúdo e/ou excerto.
- Inclusão/exclusão: listas de IDs a incluir ou excluir.

**Flags de tipo de requisição:**
Após analisar os parâmetros, o motor define flags booleanas que indicam o tipo de requisição: é uma página única? Um arquivo? Uma busca? Uma categoria? Um erro 404? A página inicial? Estas flags são usadas para seleção de template.

**Gancho de pré-consulta:**
Antes de executar a consulta SQL, o motor dispara um gancho que permite que extensões modifiquem os parâmetros. Este é um dos ganchos mais importantes do sistema.

### 5.2 O Loop (Laço de Iteração)

O mecanismo de iteração sobre os resultados da consulta principal:

1. **Verificação de itens:** Verifica se existem mais itens não processados no resultado.
2. **Avanço:** Move para o próximo item, configura variáveis globais (conteúdo atual, ID, autor, páginas do conteúdo).
3. **Disparo de eventos:** Dispara ação de "início do loop" na primeira iteração e "fim do loop" na última.
4. **Reset automático:** Ao esgotar os itens, o ponteiro é reinicializado.

### 5.3 Subconsultas

Três sistemas de subconsulta geram cláusulas SQL para filtros complexos:

- **Subconsulta de taxonomia:** Gera JOINs e WHEREs para filtrar por termos, com suporte a relações AND/OR aninhadas, inclusão de filhos (hierarquia), e múltiplos operadores.
- **Subconsulta de metadados:** Gera JOINs e WHEREs para filtrar por metadados, com casting de tipos e relações AND/OR aninhadas. Suporta uso como critério de ordenação.
- **Subconsulta de datas:** Gera WHEREs para filtrar por intervalos de data, com granularidade de ano a segundo, suporte a antes/depois, e colunas configuráveis.

---

## 6. Tipos de Conteúdo

Toda informação no sistema é armazenada como "post" — um registro na tabela de posts. Tipos de conteúdo diferenciam a natureza e o comportamento de cada registro.

### 6.1 Tipos Nativos

| Tipo                       | Hierárquico | Público | Finalidade                                                |
| -------------------------- | ----------- | ------- | --------------------------------------------------------- |
| **Artigo**                 | Não         | Sim     | Conteúdo de blog com data, autor, categorias e tags       |
| **Página**                 | Sim         | Sim     | Conteúdo estático hierárquico (pai-filho)                 |
| **Anexo**                  | Não         | Sim     | Arquivos de mídia (imagens, vídeos, documentos)           |
| **Revisão**                | Não         | Não     | Versão histórica de um conteúdo                           |
| **Item de menu**           | Não         | Não     | Entrada em menus de navegação                             |
| **CSS personalizado**      | Não         | Não     | Folha de estilo personalizada                             |
| **Conjunto de alterações** | Não         | Não     | Alterações pendentes do personalizador                    |
| **Cache de incorporação**  | Não         | Não     | Respostas de incorporação em cache                        |
| **Solicitação do usuário** | Não         | Não     | Solicitação de privacidade (exportação/exclusão de dados) |
| **Bloco reutilizável**     | Não         | Não     | Padrão de blocos salvo para reutilização                  |
| **Template**               | Não         | Não     | Template de bloco para o editor de site                   |
| **Parte de template**      | Não         | Não     | Parte reutilizável de template (cabeçalho, rodapé)        |
| **Estilos globais**        | Não         | Não     | Configurações de design em formato JSON                   |
| **Navegação**              | Não         | Não     | Bloco de menu de navegação no editor de site              |
| **Família de fonte**       | Não         | Não     | Gerenciamento de fontes tipográficas                      |

### 6.2 Registro de Tipos Personalizados

Extensões podem registrar novos tipos com propriedades configuráveis:

- **Rótulos:** Nomes para exibição (singular, plural, textos de ação).
- **Visibilidade:** Público, visível na interface, disponível em buscas, consultável via URL.
- **Hierarquia:** Se suporta relações pai-filho.
- **Suportes (features):** Lista de funcionalidades — título, editor, autor, miniatura, excerto, campos personalizados, comentários, revisões, formatos de post, atributos de página, rastreamento.
- **Capacidades:** Modelo de permissões (baseado em um tipo de capacidade que gera automaticamente permissões de leitura, edição e exclusão).
- **Taxonomias associadas:** Quais classificações se aplicam.
- **Arquivo:** Se o tipo possui página de listagem (archive).
- **API REST:** Se exposto na API REST, com qual caminho e controlador.
- **Reescrita de URL:** Estrutura de URL amigável.
- **Template de blocos:** Template padrão no editor de blocos.
- **Exclusão com usuário:** Se conteúdos são excluídos quando o autor é removido.

### 6.3 Status de Conteúdo

| Status            | Visibilidade | Comportamento                                                         |
| ----------------- | ------------ | --------------------------------------------------------------------- |
| **Publicado**     | Público      | Visível para todos, indexável                                         |
| **Rascunho**      | Protegido    | Apenas autor e editores veem. Data não afeta publicação               |
| **Pendente**      | Protegido    | Aguardando revisão editorial. Data não afeta publicação               |
| **Privado**       | Privado      | Apenas autor e administradores veem                                   |
| **Agendado**      | Protegido    | Será publicado automaticamente na data definida                       |
| **Lixeira**       | Interno      | Excluído logicamente. Pode ser restaurado ou excluído permanentemente |
| **Auto-rascunho** | Interno      | Rascunho automático não salvo pelo usuário                            |
| **Herdado**       | Interno      | Usado por revisões e anexos — herda status do pai                     |

### 6.4 Proteção por Senha

Qualquer conteúdo pode ter uma senha definida. Quando protegido:

- O conteúdo é substituído por um formulário de entrada de senha.
- A senha submetida é verificada e armazenada em um cookie com validade.
- Excertos mostram mensagem genérica de conteúdo protegido.
- Comentários ficam ocultos.
- Anexos filhos ficam inacessíveis.

### 6.5 Posts Fixos (Sticky)

Conteúdos podem ser marcados como "fixos" — aparecem no topo da listagem principal. A lista de IDs fixos é armazenada como opção do sistema. Aplicável apenas ao tipo artigo.

### 6.6 Formatos de Conteúdo

Uma taxonomia especial que categoriza a forma de apresentação:

| Formato      | Uso                              |
| ------------ | -------------------------------- |
| Padrão       | Apresentação normal              |
| Nota lateral | Breve nota sem título            |
| Conversa     | Transcrição de chat              |
| Galeria      | Coleção de imagens               |
| Link         | URL compartilhado                |
| Imagem       | Imagem única                     |
| Citação      | Texto citado                     |
| Status       | Atualização curta tipo microblog |
| Vídeo        | Conteúdo de vídeo                |
| Áudio        | Conteúdo de áudio                |

Os termos desta taxonomia são armazenados com prefixo interno e as funções de consulta ocultam esse detalhe.

### 6.7 Excerto e Conteúdo

**Excerto:** Resumo curto do conteúdo. Pode ser definido manualmente ou gerado automaticamente (primeiras 55 palavras do conteúdo, com tags HTML removidas).

**Conteúdo com quebra:**

- Uma marcação especial `<!--more-->` divide o conteúdo em teaser e conteúdo completo. Em listagens, apenas o teaser aparece com link "leia mais".
- Uma marcação `<!--nextpage-->` divide o conteúdo em múltiplas páginas com navegação de paginação.

---

## 7. Sistema de Classificação (Taxonomias)

Taxonomias são sistemas de categorização que associam termos a conteúdos.

### 7.1 Taxonomias Nativas

| Taxonomia               | Hierárquica | Tipo de conteúdo         | Finalidade                                           |
| ----------------------- | ----------- | ------------------------ | ---------------------------------------------------- |
| **Categoria**           | Sim         | Artigo                   | Classificação principal com pai-filho                |
| **Tag**                 | Não         | Artigo                   | Palavras-chave livres                                |
| **Menu de navegação**   | Não         | Item de menu             | Agrupamento de itens de menu                         |
| **Categoria de link**   | Não         | Link                     | Classificação de blogroll                            |
| **Formato de conteúdo** | Não         | Artigo                   | Formato de apresentação                              |
| **Tema**                | Não         | Template, Parte, Estilos | Associação de templates a temas                      |
| **Área de parte**       | Não         | Parte de template        | Classificação de partes (cabeçalho, rodapé, lateral) |
| **Categoria de padrão** | Não         | Bloco                    | Classificação de padrões de blocos                   |

### 7.2 Taxonomias Personalizadas

Extensões podem registrar novas taxonomias com:

- **Hierarquia:** Sim (como categorias, com interface de checklist) ou não (como tags, com interface de texto separado por vírgulas).
- **Tipos de conteúdo associados:** Quais tipos de post esta taxonomia classifica.
- **Visibilidade:** Pública, na interface, em menus, em buscas rápidas.
- **Capacidades:** Gerenciar, editar, excluir e atribuir termos.
- **Reescrita:** Estrutura de URL para páginas de arquivo.
- **API REST:** Exposição na API com caminho e controlador configuráveis.
- **Termo padrão:** Um termo criado automaticamente no registro.

### 7.3 Estrutura de Dados

- **Termo:** Nome legível, slug para URL, grupo numérico.
- **Term-Taxonomia:** Associa termo a uma taxonomia, define pai (hierarquia) e mantém contagem de objetos.
- **Relacionamento:** Tabela de junção ligando qualquer objeto (post) a um term-taxonomy, com campo de ordenação.

### 7.4 Atribuição de Termos

A atribuição pode substituir todos os termos existentes ou acrescentar novos. Termos podem ser especificados por ID, slug ou nome. Se um termo não existir, ele é criado automaticamente. As contagens são recalculadas após cada operação.

---

## 8. Revisões e Salvamento Automático

### 8.1 Revisões

Sempre que um conteúdo é atualizado, uma cópia da versão anterior é armazenada como um post do tipo "revisão":

- O nome da revisão segue o padrão `{id_pai}-revision-v1`.
- O pai da revisão aponta para o conteúdo original.
- Campos revisionados por padrão: título, conteúdo, excerto.
- Extensões podem adicionar campos personalizados ao sistema de revisões.
- Metadados marcados como "revisionáveis" são salvos junto com cada revisão.
- Uma comparação é feita antes de salvar — se não houve alteração real, a revisão não é criada.
- Limite configurável de revisões por conteúdo (via constante ou filtro). Revisões mais antigas são excluídas quando o limite é atingido.

**Restauração:**

- Restaurar uma revisão copia os campos revisionados de volta para o conteúdo original.
- Metadados revisionáveis também são restaurados.
- A data de modificação é atualizada.

### 8.2 Salvamento Automático (Autosave)

- Criado periodicamente enquanto o usuário edita (tipicamente a cada 60 segundos).
- Armazenado como revisão com nome `{id_pai}-autosave-v1`.
- Apenas um autosave por usuário por conteúdo é mantido.
- Autosaves são preservados quando revisões antigas são excluídas.

---

## 9. Metadados

O sistema possui quatro tabelas de metadados (post, usuário, comentário, termo), todas com estrutura idêntica:

- **Chave:** String identificadora.
- **Valor:** Qualquer tipo de dado — valores não escalares são serializados automaticamente.
- **Múltiplos:** Um mesmo objeto pode ter múltiplas entradas com a mesma chave.

**Operações:**

- Obter: busca por objeto e chave, retornando valor único ou array de valores.
- Adicionar: insere nova entrada (pode ser marcada como única para prevenir duplicatas).
- Atualizar: modifica valor existente ou cria se não existir.
- Excluir: remove por chave, opcionalmente filtrando por valor.

**Convenções:**

- Chaves iniciadas com `_` são consideradas privadas (ocultas na interface de campos personalizados).
- Metadados podem ser registrados formalmente com tipo, esquema de validação, sanitização e exposição na API REST.

---

## 10. Usuários, Papéis e Permissões

### 10.1 Modelo de Usuário

Cada usuário possui:

- **Campos obrigatórios:** Login, senha (hash), email, nome amigável para URL, nome de exibição, data de registro.
- **Papéis:** Lista de papéis atribuídos (armazenados como metadado).
- **Capacidades individuais:** Permissões específicas adicionadas fora dos papéis.
- **Capacidades consolidadas:** Merge de todas as capacidades dos papéis mais capacidades individuais.

### 10.2 Papéis Padrão

| Papel             | Nível  | Capacidades Principais                                                  |
| ----------------- | ------ | ----------------------------------------------------------------------- |
| **Administrador** | Total  | Gerenciar opções, temas, extensões, usuários. Acesso a tudo.            |
| **Editor**        | Alto   | Editar/publicar/excluir qualquer conteúdo. Gerenciar categorias, links. |
| **Autor**         | Médio  | Editar/publicar/excluir apenas conteúdo próprio. Enviar arquivos.       |
| **Colaborador**   | Baixo  | Editar conteúdo próprio, mas não publicar. Sem upload.                  |
| **Assinante**     | Mínimo | Apenas leitura.                                                         |

### 10.3 Verificação de Capacidades

Existem dois tipos de capacidades:

- **Primitivas:** Permissões absolutas (editar posts, gerenciar categorias, instalar extensões).
- **Meta-capacidades:** Permissões contextuais que são mapeadas para primitivas dependendo do contexto. Por exemplo, "editar post 42" é mapeado para "editar posts próprios" (se o usuário é autor) ou "editar posts de outros" (se não é).

**Fluxo de verificação:**

1. A meta-capacidade é convertida em uma ou mais capacidades primitivas via função de mapeamento.
2. Verifica-se se o usuário é super-administrador (em multisite).
3. Um filtro permite extensões modificarem o resultado.
4. Cada capacidade primitiva requerida é verificada contra o conjunto consolidado do usuário.
5. O resultado é verdadeiro somente se TODAS as primitivas estão presentes.

### 10.4 Gerenciamento de Papéis

Os papéis são armazenados como opção do sistema (array serializado). Cada papel contém uma lista de capacidades com valor booleano. Papéis podem ser criados, removidos ou modificados (adição/remoção de capacidades) tanto programaticamente quanto pela interface.

---

## 11. Autenticação e Sessões

### 11.1 Fluxo de Login

1. O sistema recebe credenciais (login/email + senha).
2. Busca o usuário pelo login ou email.
3. Aplica filtro de pré-autenticação (extensões podem intervir).
4. Verifica a senha contra o hash armazenado.
5. Se o hash usa algoritmo antigo, rehash automaticamente com o algoritmo atual.
6. Cria um token de sessão e cookies de autenticação.
7. Dispara ação de login bem-sucedido.

### 11.2 Hash de Senha

O sistema utiliza hashing robusto com pré-processamento:

1. A senha é limitada a 4096 caracteres.
2. Um HMAC é calculado usando uma chave de separação de domínio.
3. O resultado é codificado e então processado pelo algoritmo de hash com fator de custo.
4. O hash final é prefixado com um marcador para identificação do algoritmo.

**Compatibilidade retroativa:** O sistema reconhece hashes de algoritmos anteriores e atualiza automaticamente ao hash atual na próxima autenticação bem-sucedida.

### 11.3 Cookies de Autenticação

Três cookies são utilizados:

- **Cookie de autenticação:** Para páginas administrativas (exige HTTPS quando disponível).
- **Cookie de autenticação segura:** Variante para conexões HTTPS.
- **Cookie de sessão logada:** Para páginas públicas (requisitos de segurança menores).

**Formato do cookie:** `usuario|expiração|token|hmac`

- Expiração: 14 dias com "lembrar-me", 2 dias sem.
- Token: identificador aleatório da sessão.
- HMAC: assinatura criptográfica calculada com a chave secreta do site, fragmento do hash da senha, e o token.

**Validação:**

1. Analisa os componentes do cookie.
2. Verifica se não expirou (com período de graça para requisições POST/AJAX).
3. Busca o usuário e extrai fragmento da senha.
4. Recalcula o HMAC esperado e compara com o do cookie.
5. Verifica se o token de sessão é válido.

### 11.4 Tokens de Sessão

Cada login gera um token de sessão único, armazenado como metadado do usuário:

- Token: string aleatória de 43 caracteres, armazenada como hash.
- Dados da sessão: expiração, endereço IP, agente do navegador, momento do login.
- Um usuário pode ter múltiplas sessões (múltiplos dispositivos).
- Operações: criar, verificar, destruir uma, destruir todas exceto uma, destruir todas.

### 11.5 Nonces (Proteção contra CSRF)

Tokens de uso único que protegem ações contra falsificação de requisições:

- Gerados a partir do hash de: tick temporal + ação + ID do usuário + token da sessão.
- Válidos por 24 horas (duas janelas de 12 horas).
- Verificação retorna 1 (tick atual) ou 2 (tick anterior).
- Embutidos em formulários como campos ocultos ou anexados a URLs como parâmetro.

### 11.6 Senhas de Aplicação

Para autenticação em APIs sem expor a senha principal:

- Geradas como strings alfanuméricas de 24 caracteres.
- Armazenadas como hash no metadado do usuário.
- Aceitas via autenticação HTTP básica (usuário:senha-de-aplicação).
- Cada uma tem nome, UUID, e estatísticas de uso.
- Podem ser criadas, listadas e revogadas individualmente.
- Funcionam apenas em contextos de API (REST ou XML-RPC), não para login web.

---

## 12. Extensões (Plugins)

### 12.1 Tipos de Extensões

**Extensões obrigatórias (must-use):**

- Arquivos colocados em um diretório especial.
- Carregadas automaticamente em ordem alfabética.
- Não podem ser desativadas pela interface.
- Não suportam subdiretórios (apenas arquivos na raiz).

**Extensões de rede (multisite):**

- Ativadas pelo administrador da rede.
- Aplicam-se a todos os sites da rede.
- Armazenadas como opção de nível de rede.

**Extensões regulares:**

- Ativadas/desativadas por site.
- Armazenadas como opção do banco de dados (array de caminhos ativos).
- Podem estar em subdiretórios.

**Drop-ins:**

- Arquivos com nomes específicos no diretório de conteúdo.
- Substituem componentes do núcleo: banco de dados, cache de objetos, cache avançado, tratamento de erros fatais, páginas de manutenção, roteamento multisite.
- Não requerem ativação — são carregados por convenção de nome.

### 12.2 Descoberta e Cabeçalhos

Extensões são descobertas pela presença de cabeçalhos especiais nos primeiros 8KB do arquivo principal:

- Nome, versão, descrição, autor, URI do autor.
- Domínio de texto e caminho de tradução (para internacionalização).
- Versão mínima do CMS e do interpretador requeridas.
- Dependências de outras extensões (slugs separados por vírgula).
- URI de atualização (fonte de atualizações).
- Flag de rede (se é apenas para multisite).

### 12.3 Ciclo de Vida

**Ativação:**

1. Valida existência e cabeçalho da extensão.
2. Verifica requisitos de versão do CMS, do interpretador e dependências.
3. Inclui o arquivo da extensão em um sandbox com captura de saída.
4. Se não houve erro fatal, adiciona ao array de extensões ativas.
5. Dispara ganchos de ativação (genérico e específico por extensão).

**Desativação:**

1. Remove do array de extensões ativas.
2. Dispara ganchos de desativação.
3. Em modo de recuperação, remove da lista de extensões pausadas.

**Desinstalação:**

1. Se a extensão possui um arquivo de desinstalação, executa-o.
2. Caso contrário, se um callback foi registrado, executa-o.
3. Permite limpeza de dados, opções e tabelas personalizadas.

### 12.4 Dependências

O sistema mantém um grafo de dependências entre extensões:

- Detecta dependências circulares.
- Impede ativação de extensão com dependências não atendidas.
- Impede desativação de extensão da qual outras dependem.
- Exibe avisos na interface para dependências ausentes ou inativas.

### 12.5 Modo de Recuperação

Se uma extensão causa erro fatal:

- O sistema detecta o erro e pausa a extensão automaticamente.
- O administrador recebe um email com link de recuperação.
- O link concede acesso temporário ao painel para corrigir o problema.
- A extensão pausada é excluída do carregamento até ser reativada manualmente.

---

## 13. Temas e Templates

### 13.1 Hierarquia de Templates

O sistema seleciona o template a ser renderizado seguindo uma hierarquia de especificidade decrescente. Para cada tipo de requisição, uma lista ordenada de candidatos é verificada — o primeiro encontrado é utilizado:

**Página única de conteúdo:**
`{tipo}-{slug}.ext` → `{tipo}.ext` → `singular.ext` → `index.ext`

**Página estática:**
`{template-personalizado}.ext` → `page-{slug}.ext` → `page-{id}.ext` → `page.ext` → `singular.ext` → `index.ext`

**Arquivo de categoria:**
`category-{slug}.ext` → `category-{id}.ext` → `category.ext` → `archive.ext` → `index.ext`

**Arquivo de tag:**
`tag-{slug}.ext` → `tag-{id}.ext` → `tag.ext` → `archive.ext` → `index.ext`

**Arquivo de taxonomia personalizada:**
`taxonomy-{tax}-{termo}.ext` → `taxonomy-{tax}-{id}.ext` → `taxonomy-{tax}.ext` → `taxonomy.ext` → `archive.ext` → `index.ext`

**Arquivo de autor:**
`author-{nicename}.ext` → `author-{id}.ext` → `author.ext` → `archive.ext` → `index.ext`

**Arquivo de data:**
`date.ext` → `archive.ext` → `index.ext`

**Resultado de busca:**
`search.ext` → `index.ext`

**Erro 404:**
`404.ext` → `index.ext`

**Página inicial:**
`front-page.ext` (se definida) → `home.ext` → `index.ext`

**Anexo:**
`{tipo-mime}-{subtipo}.ext` → `{subtipo}.ext` → `{tipo-mime}.ext` → `attachment.ext` → `single.ext` → `index.ext`

### 13.2 Temas Filho

Um tema pode declarar outro como pai. Quando há tema filho:

1. Templates são buscados primeiro no tema filho.
2. Se não encontrados, são buscados no tema pai.
3. O arquivo de funções do tema filho é carregado antes do pai.
4. Apenas uma geração de herança é permitida (sem "netos").

### 13.3 Funcionalidades de Tema

Temas registram suporte a funcionalidades específicas:

- **Miniaturas (thumbnails):** Imagens destacadas para conteúdo.
- **Formatos de conteúdo:** Quais formatos de apresentação são suportados.
- **Marcação HTML5:** Quais componentes usam marcação moderna (formulários, galerias, etc.).
- **Logo personalizado:** Upload de logotipo com dimensões configuráveis.
- **Cabeçalho personalizado:** Imagem de cabeçalho com dimensões e callbacks.
- **Fundo personalizado:** Cor/imagem de fundo configurável.
- **Menus:** Suporte a menus de navegação.
- **Links de feed:** Inclui links de RSS automaticamente no cabeçalho.
- **Incorporações responsivas:** Iframes de conteúdo externo se redimensionam.
- **Templates de blocos:** Habilita edição completa do site.

### 13.4 Temas Clássicos vs. Temas de Blocos

**Temas clássicos:**

- Templates escritos em linguagem server-side mesclando lógica e apresentação.
- Usam tags de template para incluir cabeçalho, rodapé, barra lateral, partes de template.
- Variáveis globais disponíveis nos templates (consulta, post atual, dados do usuário).

**Temas de blocos:**

- Templates em formato de marcação HTML com blocos.
- Diretório `templates/` para templates completos, `parts/` para partes reutilizáveis.
- Configurados via arquivo JSON de design tokens (ver seção 34).
- Detectados pela presença de `templates/index.html`.
- Suportam edição visual completa do site no editor de blocos.

### 13.5 Personalizações de Tema (Theme Mods)

Configurações específicas por tema:

- Armazenadas no banco como uma opção com chave baseada no slug do tema.
- Quando o tema é trocado, as personalizações do tema anterior são preservadas (retornam se o tema for reativado).
- Diferentes das opções globais, que persistem independentemente do tema.

### 13.6 Personalizador (Customizer)

Interface de personalização em tempo real:

- **Configurações:** Valores individuais (cor de fundo, logotipo, título do site).
- **Controles:** Interfaces visuais para cada configuração (seletor de cor, upload, texto).
- **Seções:** Agrupam controles tematicamente.
- **Painéis:** Agrupam seções.
- **Pré-visualização:** Mostra alterações ao vivo antes de salvar.
- **Atualização seletiva:** Permite atualizar apenas partes da página sem recarregar totalmente.

---

## 14. Editor de Blocos

### 14.1 Conceito de Blocos

Todo conteúdo é composto por blocos — unidades atômicas de conteúdo que podem ser combinadas livremente. Cada bloco tem:

- **Tipo:** Identificador no formato `namespace/nome` (ex.: `core/paragraph`, `core/image`).
- **Atributos:** Pares chave-valor tipados definidos por esquema JSON.
- **Conteúdo interno (innerHTML):** Marcação HTML estática do bloco.
- **Blocos internos (innerBlocks):** Blocos aninhados dentro deste bloco (recursivo).

### 14.2 Serialização

Blocos são serializados como comentários HTML especiais dentro do conteúdo:

**Bloco com conteúdo:**

```
<!-- tipo {"atributo": "valor"} -->
<p>Conteúdo visível</p>
<!-- /tipo -->
```

**Bloco vazio (void):**

```
<!-- tipo {"atributo": "valor"} /-->
```

**Blocos aninhados:** Os comentários de abertura/fechamento do pai envolvem os blocos filhos.

**Conteúdo livre:** Texto fora de blocos é tratado como bloco de forma livre (freeform).

### 14.3 Análise (Parsing)

O analisador de blocos varre o documento linearmente, tokenizando delimitadores de comentário e spans de HTML:

- Mantém uma pilha de blocos aninhados.
- Produz uma árvore de objetos de bloco, cada um com: nome do tipo, atributos (do JSON), HTML interno, conteúdo interno (array misto de strings e nulos para blocos internos), e blocos internos (recursivo).

### 14.4 Renderização

**Blocos estáticos:** O HTML armazenado é usado diretamente.

**Blocos dinâmicos:** Possuem um callback de renderização no servidor que gera HTML sob demanda com dados atuais.

**Processo de renderização:**

1. O bloco é instanciado com seus atributos e contexto.
2. Atributos padrão são aplicados onde valores estão ausentes.
3. Vínculos de dados (bindings) são processados — atributos podem ser preenchidos por fontes externas (metadados do conteúdo, configurações do padrão, etc.).
4. O callback de renderização é chamado (se existir), ou o HTML interno é usado.
5. Suportes de bloco (features) são aplicados, gerando classes CSS e atributos adicionais.

### 14.5 Registro de Tipos de Bloco

Cada tipo de bloco é registrado com:

- **Nome:** Identificador único com namespace.
- **Título, descrição, ícone, categoria, palavras-chave.**
- **Atributos:** Esquema JSON definindo os dados do bloco.
- **Suportes:** Funcionalidades habilitadas (alinhamento, cores, espaçamento, bordas, sombras, tipografia, layout).
- **Estilos:** Variações visuais (ex.: "contorno", "preenchido").
- **Variações:** Presets de atributos com nomes descritivos.
- **Callback de renderização:** Para blocos dinâmicos.
- **Contexto:** Dados fornecidos a blocos filhos (provides_context) e dados consumidos de blocos pais (uses_context).
- **Pai/Ancestral:** Restrição de onde o bloco pode ser inserido.
- **Blocos permitidos:** Lista branca de tipos filhos aceitos.

### 14.6 Suportes de Bloco (Block Supports)

Sistema modular de funcionalidades que geram automaticamente atributos HTML e classes CSS:

- **Alinhamento:** Largura do bloco (ampla, completa, centrada).
- **Cores:** Cor de texto, fundo, gradiente.
- **Tipografia:** Tamanho, família, peso, estilo, espaçamento entre letras/linhas.
- **Espaçamento:** Margens e padding individuais por lado.
- **Bordas:** Largura, cor, raio por lado.
- **Sombras:** Sombras CSS configuráveis.
- **Layout:** Flexbox, grid, fluxo.
- **Dimensões:** Largura mínima/máxima, proporção.

### 14.7 Padrões de Blocos

Combinações pré-definidas de blocos que podem ser inseridas como unidade:

- Registradas com título, conteúdo (marcação de blocos), descrição, categorias, palavras-chave.
- Podem ser restritas a tipos de conteúdo ou templates específicos.
- Suportam carregamento a partir de arquivos.

### 14.8 Ganchos de Bloco (Block Hooks)

Permitem que blocos se auto-insiram em posições definidas de outros blocos:

- Antes, depois, como primeiro filho ou último filho.
- Usados para injeção automática de funcionalidades em templates.

---

## 15. Processador de Marcação HTML

### 15.1 Processador de Tags

Varredura linear para modificação de atributos de tags HTML sem análise estrutural:

- **Navegação:** Avança para a próxima tag, opcionalmente filtrando por nome de tag, classe ou atributo.
- **Leitura:** Obtém nome da tag, valores de atributos, classes.
- **Modificação:** Define/remove atributos, adiciona/remove classes.
- **Marcadores (bookmarks):** Permite salvar e retornar a posições específicas no documento.
- **Elementos especiais:** Reconhece elementos cujo conteúdo não é HTML (scripts, estilos, áreas de texto, iframes).
- **Saída:** Gera o HTML modificado sob demanda.

### 15.2 Processador Completo

Extensão do processador de tags que implementa um analisador estrutural conforme a especificação HTML5:

- **Árvore de elementos:** Mantém pilha de elementos abertos e rastreia posição na árvore.
- **Migalhas de pão (breadcrumbs):** Representam o caminho da raiz até o elemento atual.
- **Consultas estruturais:** Permite buscar tags considerando ancestralidade e posição na árvore.
- **Fechamento implícito:** Implementa regras de fechamento automático de tags opcionais.
- **Limitações:** Suporta um subconjunto da especificação — aborta em elementos de tabela, conteúdo estrangeiro (SVG/MathML), e certos modos de inserção.
- **Adoção e foster parenting:** Implementa os algoritmos de formatação do HTML5 para recuperação de marcação malformada.
- **Decodificação de entidades:** Suporta todas as referências de caracteres nomeadas do HTML5.

---

## 16. API REST

### 16.1 Infraestrutura

O sistema expõe uma API REST completa via JSON:

- **Roteamento:** Rotas registradas com padrão regex, associadas a métodos HTTP (GET, POST, PUT, PATCH, DELETE).
- **Namespaces:** Rotas organizadas em namespaces versionados (ex.: `v2`).
- **Descoberta:** Endpoint raiz retorna índice de todas as rotas, namespaces e capacidades do site.

**Acesso:**

- Via URLs amigáveis (ex.: `/api/v2/posts`).
- Via parâmetro de consulta (ex.: `?rest_route=/v2/posts`) quando URLs amigáveis não estão disponíveis.

### 16.2 Requisição

**Fontes de parâmetros (em ordem de prioridade):**

1. Corpo JSON (quando Content-Type é JSON).
2. Corpo da requisição (para métodos não-GET com corpo).
3. Dados de formulário POST.
4. Parâmetros de URL (query string).
5. Parâmetros extraídos do padrão regex da rota.
6. Valores padrão da definição da rota.

**Validação e sanitização:**

- Cada parâmetro pode ter callbacks de validação e sanitização.
- Validação é executada antes do processamento; falha retorna erro detalhado.
- Sanitização transforma valores após validação.

### 16.3 Resposta

- **Código de status HTTP:** 200, 201, 400, 401, 403, 404, 500, etc.
- **Links (RFC 5988):** Links hipermídia para recursos relacionados, paginação.
- **CURIEs:** URIs compactas para links com namespace customizado.
- **Incorporação (\_embed):** Inclui dados de recursos vinculados inline na resposta.
- **Seleção de campos (\_fields):** Retorna apenas campos solicitados.
- **Envelope (\_envelope):** Encapsula resposta com metadados.

### 16.4 Autenticação na API

Três mecanismos:

1. **Baseada em cookie:** Para usuários logados no navegador. Requer nonce CSRF (enviado como parâmetro ou cabeçalho).
2. **Senha de aplicação:** Via autenticação HTTP básica com login:senha-de-aplicação.
3. **Customizada:** Extensões podem registrar mecanismos via filtro de autenticação.

### 16.5 Permissões

Cada rota define um callback de permissão que verifica se o usuário atual tem autorização:

- Retorna verdadeiro (permitido), falso/nulo (negado 403), ou erro.
- Utiliza o sistema de capacidades descrito na seção 10.

### 16.6 Esquema JSON

Cada endpoint define seu esquema no formato JSON Schema Draft 4:

- Descreve propriedades, tipos, restrições.
- Propriedades incluem marcação de contexto: `view` (leitura pública), `edit` (leitura editorial).
- Usado para validação de entrada, sanitização e documentação automática da API.

### 16.7 Recursos Expostos

O sistema expõe recursos para gerenciamento completo do conteúdo:

| Recurso                    | Operações                        |
| -------------------------- | -------------------------------- |
| Conteúdos (todos os tipos) | CRUD completo, filtros, busca    |
| Tipos de conteúdo          | Listagem e consulta de metadados |
| Status de conteúdo         | Listagem                         |
| Taxonomias                 | Listagem e consulta de metadados |
| Termos                     | CRUD completo por taxonomia      |
| Usuários                   | CRUD, perfil atual               |
| Comentários                | CRUD com moderação               |
| Mídia (anexos)             | Upload, CRUD, edição de imagem   |
| Configurações do site      | Leitura e escrita                |
| Temas                      | Listagem, ativação               |
| Extensões                  | Listagem, ativação, instalação   |
| Widgets                    | CRUD                             |
| Áreas de widget            | Listagem                         |
| Tipos de bloco             | Listagem                         |
| Padrões de bloco           | Listagem                         |
| Blocos reutilizáveis       | CRUD                             |
| Renderização de bloco      | Renderização server-side         |
| Revisões                   | Listagem, restauração            |
| Salvamentos automáticos    | CRUD                             |
| Busca unificada            | Pesquisa em todos os tipos       |
| Senhas de aplicação        | CRUD                             |
| Saúde do site              | Diagnósticos                     |
| Templates e partes         | CRUD                             |
| Estilos globais            | CRUD, revisões                   |
| Menus e itens              | CRUD                             |
| Localizações de menu       | Listagem                         |
| Fontes tipográficas        | CRUD                             |

### 16.8 Processamento em Lote (Batch)

Endpoint especial que aceita múltiplas requisições em uma única chamada HTTP:

- Limite padrão de 25 requisições por lote.
- Cada sub-requisição é despachada independentemente.
- Modos de validação: normal (erro em qualquer falha) ou estrito (todas devem validar).

### 16.9 Campos Personalizados na API

Extensões podem registrar campos adicionais em qualquer recurso:

- Callback de leitura para popular o campo na resposta.
- Callback de escrita para processar o campo na criação/atualização.
- Esquema JSON para documentação e validação.

---

## 17. Sistema de Mídia

### 17.1 Upload e Armazenamento

Arquivos de mídia são armazenados como conteúdo do tipo "anexo":

- O arquivo físico é salvo no diretório de uploads (organizado por ano/mês).
- O caminho do arquivo é armazenado como metadado do anexo.
- Metadados completos são extraídos e armazenados: dimensões, tamanhos gerados, tipo MIME.

### 17.2 Processamento de Imagens

**Tamanhos registrados:**

- Tamanhos nativos: miniatura, médio, médio-grande, grande.
- Tamanhos personalizados podem ser registrados com largura, altura e modo de recorte.
- O recorte pode ser centralizado (booleano) ou posicional (esquerda/centro/direita × topo/centro/base).

**Geração de tamanhos intermediários:**

- Na hora do upload, o sistema gera cópias redimensionadas para cada tamanho registrado.
- Respeita proporção (aspect ratio) — nunca distorce a imagem.
- Cada tamanho intermediário é armazenado como arquivo separado com sufixo de dimensões.
- Metadados incluem dimensões, caminho e tamanho de arquivo de cada versão.

**Imagens responsivas (srcset):**

- O sistema gera automaticamente atributos de imagem responsiva, listando as versões disponíveis com larguras correspondentes.
- O navegador escolhe a versão apropriada baseado no tamanho da viewport.

**Editor de imagem:**

- Suporta operações de: redimensionar, recortar, rotacionar, espelhar.
- Qualidade de saída: 82% para JPEG, 86% para formatos modernos.
- Suporta múltiplos backends de processamento (bibliotecas gráficas nativas).

---

## 18. Comentários

### 18.1 Modelo de Dados

Cada comentário contém:

- Associação ao conteúdo pai (post).
- Dados do autor: nome, email, URL, IP, user-agent.
- Conteúdo do comentário, data, status.
- Tipo: comentário regular, pingback (notificação automática de link), trackback (notificação manual), ou personalizado.
- Comentário pai (para hierarquia/threading).
- Associação opcional com usuário registrado.

### 18.2 Status de Comentário

| Status       | Significado          |
| ------------ | -------------------- |
| **Aprovado** | Publicado e visível  |
| **Pendente** | Aguardando moderação |
| **Spam**     | Marcado como spam    |
| **Lixeira**  | Excluído logicamente |

### 18.3 Moderação e Validação

**Verificações na submissão:**

1. **Duplicatas:** Verifica se existe comentário idêntico do mesmo autor para o mesmo conteúdo.
2. **Controle de flood:** Limita a frequência de comentários por IP/usuário (1 por intervalo).
3. **Moderação automática:** Verifica contra lista de palavras bloqueadas e limite de links externos.
4. **Aprovação anterior:** Autores com comentário previamente aprovado podem ser aprovados automaticamente.
5. Administradores e moderadores são isentos do controle de flood.

### 18.4 Hierarquia de Comentários

Comentários podem ser aninhados (respostas a respostas):

- O campo "pai" referencia outro comentário.
- Consultas suportam formatos "threaded" (árvore) e "flat" (lista).
- Profundidade de aninhamento é configurável.

### 18.5 Cookies do Autor

Para visitantes não autenticados, dados do autor (nome, email, URL) são salvos em cookies para pré-preenchimento de formulários futuros. Expiram em 1 ano por padrão.

---

## 19. Widgets e Áreas Laterais

### 19.1 Conceito

Widgets são componentes modulares de interface que podem ser colocados em áreas definidas pelo tema.

### 19.2 Estrutura

**Widget:**

- Classe base que define: saída visual, formulário de configuração e lógica de validação.
- Cada widget tem um identificador de tipo (ex.: "recent-posts") e um número de instância.
- Um mesmo tipo pode ter múltiplas instâncias com configurações diferentes.
- ID completo: `{tipo}-{instância}` (ex.: "recent-posts-1", "recent-posts-2").

**Área de widget (sidebar):**

- Registrada pelo tema com: ID, nome, descrição.
- Define marcação HTML que envolve cada widget (elementos e classes CSS).
- Pode ter marcação para antes/depois do título do widget.

### 19.3 Armazenamento

- Configurações de cada tipo de widget: armazenadas como opção do sistema, indexadas por número de instância.
- Mapa de áreas: quais IDs de widget estão em cada área, armazenado como opção.

### 19.4 Exibição

A função de exibição de área itera sobre os widgets atribuídos, aplicando a marcação de envolvimento e chamando a saída de cada widget. Ganchos permitem filtrar cada widget individualmente.

---

## 20. Menus de Navegação

### 20.1 Estrutura

- **Menu:** Representado como um termo na taxonomia especial de menus.
- **Item de menu:** Representado como post especial com metadados descrevendo o link:
  - Tipo: link personalizado, conteúdo do site, ou taxonomia.
  - URL, destino (mesma janela ou nova), atributo de relação, classes CSS.
  - Hierarquia: campo pai permite submenus aninhados.
  - Ordem: campo de ordenação define a posição.

### 20.2 Localizações

Temas declaram localizações de menu (ex.: "principal", "rodapé"). A atribuição de qual menu aparece em cada localização é armazenada como personalização do tema.

### 20.3 Renderização

Um mecanismo de percurso de árvore (walker) renderiza o menu:

- Gera listas HTML aninhadas para representar a hierarquia.
- Marca o item atual com classe CSS especial e atributo `aria-current="page"`.
- Cada nível de submenu recebe classe identificadora.
- Personalização completa da marcação via subclasses do walker.

---

## 21. Códigos Curtos (Shortcodes)

### 21.1 Conceito

Tags especiais dentro do conteúdo que são processadas e substituídas por HTML gerado dinamicamente.

### 21.2 Formato

```
[nome atributo1="valor1" atributo2="valor2"]conteúdo entre tags[/nome]
```

Ou auto-fechado:

```
[nome atributo="valor"]
```

**Escape:** Colchetes duplos `[[nome]]` renderizam a tag literalmente sem processamento.

### 21.3 Processamento

1. Uma expressão regular unificada é gerada abrangendo todos os shortcodes registrados.
2. O conteúdo é varrido pela regex.
3. Para cada match, atributos são parseados e o callback registrado é chamado.
4. O callback recebe: array de atributos, conteúdo (se houver), nome da tag.
5. O retorno do callback substitui o shortcode no conteúdo.
6. Shortcodes podem ser aninhados, mas o callback do pai deve re-invocar o processamento no conteúdo interno.

### 21.4 Atributos

Parseados como pares `chave="valor"` ou `chave='valor'`. Valores sem aspas são aceitos para alfanuméricos. O resultado é um array associativo.

---

## 22. Incorporação de Conteúdo Externo (oEmbed)

### 22.1 Como Consumidor

O sistema pode transformar URLs em conteúdo incorporado:

1. A URL é comparada contra uma lista de provedores conhecidos (mais de 60 serviços de vídeo, áudio, mídia social, mapas).
2. Se não houver match e a descoberta estiver habilitada, o sistema busca a página da URL procurando tags de link que anunciam suporte a oEmbed.
3. O provedor é consultado com a URL e dimensões máximas.
4. A resposta (JSON ou XML) contém o HTML de incorporação, metadados do recurso.

**Tipos de resposta:** vídeo, foto, link, rich (conteúdo rico).

**Cache:** Respostas são cacheadas como metadados do conteúdo com validade de 1 semana.

### 22.2 Como Provedor

O sistema também atua como provedor oEmbed:

- Endpoint REST disponível para que outros sites incorporem conteúdo deste site.
- Retorna JSON com título, autor, HTML de incorporação.

### 22.3 Handlers Personalizados

Extensões podem registrar padrões de URL com callbacks de processamento para incorporações não baseadas em oEmbed.

---

## 23. Cache de Objetos

### 23.1 Conceito

Sistema de cache em memória que armazena dados recuperados do banco de dados para evitar consultas repetidas durante a mesma requisição.

### 23.2 Interface

- **Armazenar:** Chave + dados + grupo + expiração.
- **Recuperar:** Chave + grupo. Retorna dados ou falso (com flag indicando se "falso" é o valor real ou "não encontrado").
- **Adicionar:** Só armazena se a chave não existir.
- **Excluir:** Remove entrada por chave + grupo.
- **Incrementar/Decrementar:** Operações atômicas em valores numéricos.
- **Limpar:** Esvazia todo o cache ou um grupo específico.
- **Operações em lote:** Obter, definir, adicionar e excluir múltiplas chaves de uma vez.

### 23.3 Grupos

Chaves são organizadas em grupos (namespaces). A mesma chave pode existir em diferentes grupos.

**Em modo multisite:**

- Grupos regulares: a chave é prefixada com o ID do site (isolamento por site).
- Grupos globais: a chave não é prefixada (compartilhada entre todos os sites).
- Grupos não persistentes: ignorados por backends externos (dados que não devem ser cacheados entre requisições).

### 23.4 Implementação Padrão vs. Externa

**Padrão:** Array em memória, destruído ao final de cada requisição (não persistente).

**Externa (drop-in):** Arquivo especial no diretório de conteúdo substitui a implementação. Permite backends persistentes (armazenamento em memória distribuída, cache de chave-valor) que sobrevivem entre requisições e são compartilhados entre processos.

---

## 24. Opções e Configurações

### 24.1 Armazenamento

Opções são pares chave-valor armazenados na tabela de opções:

- Chave: string única.
- Valor: qualquer tipo de dado (escalares armazenados diretamente, complexos serializados automaticamente).
- Flag de carregamento automático: se ativo, a opção é carregada junto com todas as outras na inicialização (uma única consulta SQL).

### 24.2 Caching

Sistema de cache em três níveis:

1. **Cache de autoload:** Todas as opções com flag de carregamento automático são carregadas de uma vez na inicialização.
2. **Cache de "não existentes":** Opções consultadas e não encontradas são registradas para evitar consultas repetidas.
3. **Cache individual:** Opções carregadas sob demanda são cacheadas individualmente.

### 24.3 Operações

- **Obter:** Verifica cache de autoload, depois cache de não-existentes, depois cache individual, depois banco de dados.
- **Atualizar:** Se a opção não existe, cria. Se existe e o valor é diferente, atualiza. Invalida os caches relevantes.
- **Excluir:** Remove do banco e invalida caches.

### 24.4 Opções Protegidas

Certas opções internas (caches de opções) não podem ser modificadas diretamente para prevenir corrupção.

---

## 25. Valores Temporários (Transients)

### 25.1 Conceito

Opções com expiração temporal. Ideal para cache de resultados computacionalmente caros.

### 25.2 Comportamento

- **Definir:** Armazena valor com tempo de vida em segundos.
- **Obter:** Retorna o valor se não expirado, falso caso contrário.
- **Excluir:** Remove imediatamente.

### 25.3 Armazenamento

**Sem cache externo:** Armazenados como duas opções — uma para o valor (prefixo especial) e outra para o timestamp de expiração.

**Com cache externo:** Utilizados diretamente pelo backend de cache com TTL nativo, sem tocar no banco de dados. Muito mais performático.

### 25.4 Escopo

- **Transients de site:** Válidos para o site atual.
- **Transients de rede:** Válidos para toda a rede multisite.

---

## 26. Agendador de Tarefas (Cron)

### 26.1 Conceito

Sistema de agendamento de tarefas que executa ações programadas em segundo plano.

### 26.2 Tipos de Eventos

- **Evento único:** Executa uma vez no timestamp definido.
- **Evento recorrente:** Repete em intervalos fixos (horário, duas vezes ao dia, diário, semanal, ou intervalos personalizados).

### 26.3 Armazenamento

Eventos são armazenados como opção do sistema em uma estrutura aninhada:

```
[timestamp] → [nome_do_gancho] → [hash_dos_argumentos] → {agenda, argumentos, intervalo}
```

### 26.4 Execução

- **Disparo:** A cada carregamento de página, o sistema verifica se existem eventos com timestamp no passado.
- **Requisição assíncrona:** Uma requisição HTTP não bloqueante é enviada ao próprio sistema para processar os eventos pendentes, sem atrasar a resposta ao visitante.
- **Trava de concorrência:** Um valor temporal transiente impede execução simultânea por múltiplos processos. Travas com mais de 10 minutos são consideradas obsoletas e resetadas.
- **Proteção contra duplicatas:** Eventos idênticos (mesmo gancho e argumentos) dentro de 10 minutos são ignorados.
- **Re-agendamento:** Eventos recorrentes são automaticamente re-agendados para o próximo intervalo após execução.

### 26.5 Intervalos Padrão

| Nome              | Intervalo       |
| ----------------- | --------------- |
| Horário           | 3600 segundos   |
| Duas vezes ao dia | 43200 segundos  |
| Diário            | 86400 segundos  |
| Semanal           | 604800 segundos |

Intervalos personalizados podem ser registrados via filtro.

### 26.6 Modo Alternativo

Uma constante especial pode redirecionar o disparo para um gancho do ciclo de vida em vez de requisição HTTP assíncrona. Outra constante pode desabilitar completamente o disparo automático (para uso com agendador externo do sistema operacional).

---

## 27. URLs Amigáveis (Reescrita)

### 27.1 Conceito

O sistema transforma URLs amigáveis em variáveis de consulta internas usando regras de reescrita baseadas em expressões regulares.

### 27.2 Tags de Estrutura

Tags substituíveis na estrutura de permalink:

| Tag             | Regex gerado   | Variável       |
| --------------- | -------------- | -------------- |
| `%ano%`         | `([0-9]{4})`   | ano            |
| `%mes%`         | `([0-9]{1,2})` | mês            |
| `%dia%`         | `([0-9]{1,2})` | dia            |
| `%id%`          | `([0-9]+)`     | ID do post     |
| `%nome%`        | `([^/]+)`      | slug do post   |
| `%autor%`       | `([^/]+)`      | nome do autor  |
| `%nome_pagina%` | `([^/]+?)`     | slug da página |
| `%busca%`       | `(.+)`         | termo de busca |

### 27.3 Geração de Regras

Regras são geradas a partir das estruturas de permalink e armazenadas como opção do banco:

- Formato: `[padrão_regex] → string_de_consulta_com_referências`
- Referências como `$matches[1]`, `$matches[2]` apontam para grupos de captura.
- Regras são aplicadas em ordem: regras extras prioritárias → regras internas → regras extras → regras externas.

### 27.4 Resolução de URL

1. A URL da requisição é comparada sequencialmente contra as regras de reescrita.
2. A primeira regra que corresponde é utilizada.
3. Os grupos de captura da regex são substituídos na string de consulta.
4. As variáveis de consulta resultantes são passadas ao motor de consultas.

### 27.5 Endpoints

Endpoints são segmentos adicionais ao final de URLs existentes (ex.: `/feed/`, `/trackback/`, `/pagina/2/`):

- Registrados com nome, posição (antes ou depois) e máscara de endpoint (define onde se aplicam: posts, páginas, categorias, etc.).
- A máscara é um campo de bits que controla a aplicação granular.

### 27.6 Atualização de Regras

- **Flush suave:** Regenera as regras no banco de dados sem tocar no arquivo de configuração do servidor web.
- **Flush rígido:** Regenera regras no banco E reescreve o arquivo de configuração do servidor.
- Executado automaticamente em ativação/desativação de extensões e mudanças de estrutura de permalink.

---

## 28. Internacionalização (i18n)

### 28.1 Funções de Tradução

| Função                    | Comportamento                                                                                     |
| ------------------------- | ------------------------------------------------------------------------------------------------- |
| **Obter tradução**        | Retorna string traduzida para o domínio especificado                                              |
| **Ecoar tradução**        | Exibe a string traduzida diretamente                                                              |
| **Tradução com contexto** | Diferencia strings idênticas com significados diferentes (ex.: "Post" como verbo vs. substantivo) |
| **Pluralização**          | Seleciona forma singular ou plural baseada em número                                              |
| **Variantes com escape**  | Versões que aplicam escape HTML ou de atributo automaticamente                                    |

### 28.2 Domínios de Texto

Cada conjunto de traduções é identificado por um domínio:

- O núcleo usa um domínio padrão.
- Cada extensão e tema tem seu próprio domínio.
- Domínios permitem que múltiplos catálogos de tradução coexistam sem conflito.

### 28.3 Arquivos de Tradução

Três formatos suportados:

- **Formato binário:** Compilado para busca rápida (formato nativo de catálogos de mensagens).
- **Formato texto:** Legível para tradutores, com pares original/tradução.
- **Formato nativo da linguagem:** Carregamento mais rápido que o formato binário.

Nomeados como: `{domínio}-{locale}.{extensão}` e localizados no diretório de idiomas.

### 28.4 Locale

- Determinado por: constante de configuração, opção do banco, opção de rede (multisite), ou padrão "en_US".
- Cada usuário pode ter preferência de locale diferente (armazenada como metadado).
- Suporte a troca temporária de locale para renderização de conteúdo específico.

### 28.5 Filtros de Tradução

Cada chamada de tradução passa por filtros específicos, permitindo que extensões interceptem e modifiquem traduções em tempo real.

---

## 29. Cliente HTTP

### 29.1 Interface

Funções para realizar requisições HTTP externas:

- **Requisição genérica:** Aceita qualquer método HTTP.
- **Variantes por método:** GET, POST, HEAD.
- **Variantes seguras:** Validam a URL contra SSRF (Server-Side Request Forgery).

### 29.2 Parâmetros

| Parâmetro         | Padrão                   | Descrição                    |
| ----------------- | ------------------------ | ---------------------------- |
| Método            | GET                      | Método HTTP                  |
| Timeout           | 5s                       | Tempo máximo de espera       |
| Redirecionamentos | 5                        | Máximo de redirects seguidos |
| User-Agent        | Identificador do sistema | Agente HTTP                  |
| Bloqueante        | Sim                      | Esperar pela resposta        |
| Cabeçalhos        | []                       | Headers personalizados       |
| Cookies           | []                       | Cookies a enviar             |
| Corpo             | null                     | Corpo da requisição          |
| Compressão        | Não                      | Gzip do corpo                |
| Descompressão     | Sim                      | Descompactar resposta        |
| Verificação SSL   | Sim                      | Verificar certificado        |
| Streaming         | Não                      | Salvar resposta em arquivo   |
| Limite de tamanho | null                     | Máximo de bytes na resposta  |

### 29.3 Resposta

Retorna um array com:

- Cabeçalhos de resposta (dicionário case-insensitive).
- Corpo da resposta como string.
- Código de status e mensagem HTTP.
- Cookies recebidos como objetos.
- Funções auxiliares para extrair cada componente individualmente.

### 29.4 Transporte

Utiliza uma biblioteca de abstração HTTP que seleciona automaticamente o melhor transporte disponível (conexões nativas da linguagem, bibliotecas cURL). Suporta proxy configurável.

---

## 30. Enfileiramento de Scripts e Estilos

### 30.1 Conceito

Sistema de gerenciamento de dependências para assets do front-end (scripts e folhas de estilo).

### 30.2 Ciclo de Vida

1. **Registrar:** Declara o asset com handle único, URL, dependências, versão.
2. **Enfileirar:** Marca o asset para inclusão na saída HTML.
3. **Resolução de dependências:** Calcula a ordem correta baseada no grafo de dependências.
4. **Saída:** Gera as tags HTML na posição apropriada (cabeçalho ou rodapé).

### 30.3 Propriedades por Asset

- **Handle:** Identificador único.
- **URL:** Localização do arquivo.
- **Dependências:** Lista de handles que devem ser carregados antes.
- **Versão:** String anexada à URL para invalidação de cache.
- **Grupo:** Posição de saída (cabeçalho vs. rodapé para scripts).

### 30.4 Scripts — Funcionalidades Extras

- **Scripts inline:** Código adicionado antes ou depois do script.
- **Dados localizados:** Ponte de dados servidor→cliente, renderizados como variáveis globais antes do script.
- **Estratégia de carregamento:** Atributos `defer` ou `async` para carregamento não-bloqueante.
- **Módulos:** Suporte a módulos ES nativos com importmap.
- **Prevenção de duplicatas:** Scripts já carregados não são incluídos novamente.

### 30.5 Estilos — Funcionalidades Extras

- **Media queries:** Atributo `media` para carregamento condicional.
- **Suporte RTL:** Geração automática de versão direita-para-esquerda.
- **Estilos inline:** CSS adicional após a folha de estilo.

---

## 31. Mapa do Site (Sitemap)

### 31.1 Estrutura

O sistema gera automaticamente mapas do site em formato XML:

- **Índice:** Lista de sub-sitemaps.
- **Sub-sitemaps:** URLs paginadas por tipo (conteúdo, taxonomias, autores).

### 31.2 Provedores Nativos

1. **Conteúdos:** URLs de todos os tipos de conteúdo público, paginados em grupos de 2000.
2. **Taxonomias:** URLs de termos de taxonomias públicas.
3. **Autores:** URLs de perfis de autores com conteúdo público.

### 31.3 Entrada de URL

Cada URL no sitemap pode conter:

- `loc`: URL do recurso.
- `lastmod`: Data da última modificação (ISO 8601).
- `priority`: Prioridade relativa (0.0 a 1.0).
- `changefreq`: Frequência estimada de alteração.

### 31.4 Controle

- Sitemaps são habilitados apenas para sites marcados como públicos.
- Extensões podem adicionar provedores personalizados, modificar entradas via filtros, ou desabilitar sitemaps completamente.
- A URL do sitemap é incluída automaticamente no arquivo `robots.txt`.
- Folha de estilo XSL fornece visualização amigável no navegador.

---

## 32. Rede de Sites (Multisite)

### 32.1 Conceito

O sistema pode gerenciar uma rede de sites a partir de uma única instalação:

- Uma **rede** contém múltiplos **sites**.
- Cada site tem seu próprio conteúdo, usuários atribuídos, opções e extensões ativas.
- Tabelas por site: posts, postmeta, comments, commentmeta, terms, term_taxonomy, term_relationships, termmeta, options, links.
- Tabelas compartilhadas: users, usermeta, sites, sitemeta, blogs, blogmeta.

### 32.2 Modos de Endereçamento

- **Subdomínio:** Cada site em um subdomínio (site1.exemplo.com).
- **Subdiretório:** Cada site em um caminho (exemplo.com/site1).

### 32.3 Detecção do Site Atual

Na inicialização:

1. O sistema analisa o hostname e o caminho da URL.
2. Consulta o banco para encontrar o site correspondente.
3. Configura o prefixo de tabela com o ID do site.
4. Se um drop-in de "nascer do sol" (sunrise) existir, permite roteamento completamente customizado.

### 32.4 Troca de Contexto

O sistema suporta troca temporária de site:

- Salva o contexto atual em uma pilha.
- Altera prefixo de tabela, caches, variáveis globais.
- A restauração recupera o contexto da pilha.
- Permite operações em nome de outro site sem perder o contexto original.

### 32.5 Super Administrador

Papel especial com acesso total a todos os sites e à administração da rede:

- Pode ativar extensões para toda a rede.
- Pode criar/excluir sites.
- Ignora verificações de capacidade padrão.

### 32.6 Status de Site

| Status    | Efeito                                             |
| --------- | -------------------------------------------------- |
| Público   | Visível normalmente                                |
| Arquivado | Acesso bloqueado, pode exibir página personalizada |
| Spam      | Marcado como spam, acesso bloqueado                |
| Excluído  | Marcado para exclusão                              |
| Inativo   | Desativado, pode exibir página personalizada       |

---

## 33. Privacidade e Proteção de Dados

### 33.1 Solicitações de Dados

O sistema implementa um fluxo completo para gerenciar solicitações de privacidade:

1. **Criação:** Usuário ou administrador cria solicitação de exportação ou exclusão de dados.
2. **Confirmação:** Email de confirmação enviado com link seguro.
3. **Processamento:** Administrador processa a solicitação aprovada.
4. **Conclusão:** Dados são exportados (arquivo ZIP) ou anonimizados/excluídos.

### 33.2 Exportação de Dados

- Extensões registram "exportadores" — callbacks que retornam dados associados a um email.
- Dados são coletados de todos os exportadores registrados e compilados em arquivo.
- O arquivo contém dados de perfil, conteúdo publicado, comentários, metadados e dados de extensões.

### 33.3 Exclusão/Anonimização de Dados

- Extensões registram "apagadores" — callbacks que removem ou anonimizam dados.
- Opções: manter conta com dados removidos, ou excluir conta completamente (reatribuindo conteúdo).

### 33.4 Política de Privacidade

- Sistema de coleta de textos sugeridos por extensões para compor a política de privacidade.
- Cada extensão pode contribuir com texto descrevendo quais dados coleta e como os utiliza.
- O painel exibe um compilado de todas as contribuições.

---

## 34. Estilos Globais e Design Tokens

### 34.1 Conceito

Um arquivo JSON de configuração define o sistema de design do tema:

- **Configurações:** Paletas de cores, escalas tipográficas, escalas de espaçamento, sombras, bordas.
- **Estilos:** Estilos padrão aplicados globalmente, por elemento HTML, ou por tipo de bloco.
- **Templates personalizados:** Definição de templates adicionais disponíveis no editor.
- **Padrões:** Referências a padrões de blocos utilizados pelo tema.

### 34.2 Fontes de Dados (Cascata)

Os estilos são mesclados de quatro fontes em ordem de precedência:

1. **Padrões do núcleo:** Configurações base do sistema.
2. **Padrões dos blocos:** Estilos definidos pelos próprios blocos.
3. **Tema:** Arquivo JSON do tema ativo.
4. **Usuário:** Customizações feitas pelo administrador no editor de site.

### 34.3 Saída

O processador de estilos globais gera:

- **Propriedades CSS customizadas:** Variáveis CSS para cada token de design (cores, fontes, espaçamentos).
- **Classes utilitárias:** Classes CSS geradas automaticamente (ex.: `.has-primary-color`, `.has-large-font-size`).
- **Estilos de bloco:** CSS específico para cada tipo de bloco baseado nas configurações.

### 34.4 Presets de Design

Cada tipo de preset suporta:

- **Cores:** Nome, slug, valor hexadecimal/RGB/HSL. Geram variáveis CSS e classes.
- **Tipografia:** Tamanhos de fonte com nome, slug e valor (com fluid/responsive).
- **Espaçamento:** Escala de espaçamento customizável.
- **Sombras:** Presets de sombra CSS com nome e valor.
- **Gradientes:** Gradientes CSS pré-definidos.

---

## 35. Modo de Recuperação

### 35.1 Conceito

Sistema de proteção que permite que o site permaneça funcional mesmo quando uma extensão ou tema causa erro fatal.

### 35.2 Fluxo

1. **Detecção:** O tratador de erros fatais detecta o erro e identifica a extensão/tema responsável.
2. **Pausa:** A extensão problemática é adicionada à lista de extensões pausadas.
3. **Notificação:** Email enviado ao administrador com detalhes do erro e link de recuperação.
4. **Recuperação:** O link concede sessão especial de recuperação com as extensões pausadas descarregadas.
5. **Resolução:** O administrador pode corrigir, desativar ou atualizar a extensão problemática.
6. **Retorno:** Ao resolver o problema, a extensão é removida da lista de pausadas e volta ao funcionamento normal.

### 35.3 Proteção

- Extensões pausadas são excluídas do carregamento durante a inicialização.
- O modo de recuperação não afeta extensões obrigatórias (must-use).
- Chaves de recuperação têm expiração para evitar uso indevido.
- Múltiplas extensões podem estar pausadas simultaneamente.

---

## Apêndice A — Ganchos Principais do Ciclo de Vida

Em ordem de disparo durante a inicialização:

1. **extensão_obrigatória_carregada** — Após cada extensão obrigatória ser incluída.
2. **extensões_obrigatórias_carregadas** — Após todas as extensões obrigatórias.
3. **extensão_de_rede_carregada** — Após cada extensão de rede (multisite).
4. **extensão_carregada** — Após cada extensão regular.
5. **extensões_carregadas** — Após todas as extensões regulares e funções substituíveis.
6. **sanitizar_cookies_comentarios** — Sanitização de cookies.
7. **configurar_tema** — Antes do carregamento do tema.
8. **apos_configurar_tema** — Após o tema estar carregado (principal ponto de registro de funcionalidades do tema).
9. **inicializar** — Principal gancho de inicialização (registro de tipos de conteúdo, taxonomias, scripts, etc.).
10. **sistema_carregado** — Sistema completamente inicializado.
11. **redirecionamento_template** — Antes da seleção de template (front-end).
12. **inclusao_template** — Último filtro antes de incluir o template.

---

## Apêndice B — Diagrama de Relações de Tabelas

```
┌──────────┐     ┌───────────┐     ┌──────────────────┐     ┌───────────┐
│  users   │     │   posts   │     │ term_relationships│     │   terms   │
│──────────│     │───────────│     │──────────────────│     │───────────│
│ ID ◄─────┼─────┤ post_author│     │ object_id ◄──────┼─────┤ term_id   │
│ login    │     │ ID ◄──────┼─────┤ term_taxonomy_id │     │ name      │
│ pass     │     │ parent    │     └────────┬─────────┘     │ slug      │
│ email    │     │ type      │              │               └─────┬─────┘
│ name     │     │ status    │              │                     │
└────┬─────┘     │ content   │     ┌────────┴─────────┐         │
     │           │ title     │     │  term_taxonomy   │         │
     │           └────┬──────┘     │──────────────────│         │
     │                │            │ term_taxonomy_id  │◄────────┘
┌────┴─────┐    ┌─────┴──────┐    │ term_id           │
│ usermeta │    │  postmeta  │    │ taxonomy          │
│──────────│    │────────────│    │ parent            │
│ user_id  │    │ post_id    │    │ count             │
│ key      │    │ key        │    └──────────────────-┘
│ value    │    │ value      │
└──────────┘    └────────────┘

┌──────────┐    ┌──────────────┐    ┌──────────┐
│ comments │    │ commentmeta  │    │ termmeta │
│──────────│    │──────────────│    │──────────│
│ ID       │    │ comment_id   │    │ term_id  │
│ post_ID  │    │ key          │    │ key      │
│ author   │    │ value        │    │ value    │
│ parent   │    └──────────────┘    └──────────┘
│ status   │
│ type     │    ┌──────────┐
│ content  │    │ options  │
└──────────┘    │──────────│
                │ name     │
                │ value    │
                │ autoload │
                └──────────┘
```

---

## Apêndice C — Fluxo Completo de uma Requisição Pública

```
Requisição HTTP
       │
       ▼
Ponto de Entrada
       │
       ▼
Carregador (load)
       │
       ▼
Configuração (config)
       │
       ▼
Orquestrador (settings)
       │
       ├─► Verificações de ambiente
       ├─► Constantes iniciais
       ├─► Funções do núcleo
       ├─► Conexão ao banco
       ├─► Cache de objetos
       ├─► Filtros padrão
       ├─► Extensões obrigatórias ──► [gancho: mu carregadas]
       ├─► Extensões regulares ────► [gancho: extensões carregadas]
       ├─► Funções substituíveis
       ├─► Objetos globais
       ├─► Tema ──────────────────► [gancho: após configurar tema]
       └─► [gancho: inicializar]
              │
              ▼
       [gancho: sistema carregado]
              │
              ▼
       Análise da URL (reescrita → variáveis de consulta)
              │
              ▼
       Consulta principal ao banco
              │
              ▼
       Seleção de template (hierarquia)
              │
              ▼
       Renderização do template
              │
              ▼
       Saída HTML ao navegador
```

---

_Este documento mapeia o comportamento funcional completo do sistema. Qualquer implementação que atenda fielmente a estas especificações será funcionalmente compatível com o sistema original, independentemente da tecnologia utilizada._
