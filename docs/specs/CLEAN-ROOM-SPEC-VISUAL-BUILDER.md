# Especificação Funcional Clean Room — Editor Visual de Conteúdo

> **Documento de engenharia reversa funcional.** Descreve o comportamento completo do editor visual de conteúdo — o modo nativo de edição do CMS. Sem referências a código-fonte, nomes de produto, marcas ou tecnologias específicas.

---

## Índice

**Fundação**

1. [Visão Geral](#1-visão-geral)
2. [Modelo de Documentos e Armazenamento](#2-modelo-de-documentos-e-armazenamento)
3. [Hierarquia de Elementos](#3-hierarquia-de-elementos)
4. [Sistema de Controles](#4-sistema-de-controles)
5. [Editor Visual e Pré-visualização](#5-editor-visual-e-pré-visualização)
6. [Geração e Compilação de CSS](#6-geração-e-compilação-de-css)
7. [Sistema Responsivo](#7-sistema-responsivo)
8. [Renderização no Frontend](#8-renderização-no-frontend)

**Conteúdo Dinâmico**

9. [Tags Dinâmicas](#9-tags-dinâmicas)
10. [Construtor de Loops](#10-construtor-de-loops)
11. [Construtor de Temas](#11-construtor-de-temas)
12. [Condições de Exibição](#12-condições-de-exibição)

**Componentes Visuais**

13. [Inventário Completo de Componentes](#13-inventário-completo-de-componentes)
14. [Componentes de Texto e Tipografia](#14-componentes-de-texto-e-tipografia)
15. [Componentes de Mídia](#15-componentes-de-mídia)
16. [Componentes Interativos e de Layout](#16-componentes-interativos-e-de-layout)
17. [Componentes de Marketing e Conversão](#17-componentes-de-marketing-e-conversão)
18. [Componentes de Navegação](#18-componentes-de-navegação)
19. [Componentes Sociais](#19-componentes-sociais)
20. [Componentes de Comércio Eletrônico](#20-componentes-de-comércio-eletrônico)

**Formulários**

21. [Construtor de Formulários](#21-construtor-de-formulários)
22. [Ações Pós-Submissão e Integrações](#22-ações-pós-submissão-e-integrações)

**Popups e Overlays**

23. [Construtor de Popups](#23-construtor-de-popups)

**Efeitos Visuais**

24. [Efeitos de Movimento e Animações](#24-efeitos-de-movimento-e-animações)
25. [Transições de Página](#25-transições-de-página)
26. [Elementos Fixos e Scroll Snap](#26-elementos-fixos-e-scroll-snap)

**Sistema de Design**

27. [Kit de Design (Estilos Globais)](#27-kit-de-design-estilos-globais)
28. [CSS e Código Personalizado](#28-css-e-código-personalizado)
29. [Componentes Globais Reutilizáveis](#29-componentes-globais-reutilizáveis)

**Infraestrutura**

30. [Biblioteca de Modelos](#30-biblioteca-de-modelos)
31. [Histórico e Revisões](#31-histórico-e-revisões)
32. [Navegador de Elementos](#32-navegador-de-elementos)
33. [Sistema de Módulos e Feature Flags](#33-sistema-de-módulos-e-feature-flags)
34. [Gerenciamento de Papéis](#34-gerenciamento-de-papéis)
35. [Importação e Exportação](#35-importação-e-exportação)
36. [Cache de Elementos](#36-cache-de-elementos)

---

## 1. Visão Geral

O editor visual é **o modo nativo de edição de conteúdo** do CMS. Todo conteúdo — páginas, artigos, templates de tema, popups, loops, formulários — é construído através de uma interface de arrastar-e-soltar com pré-visualização em tempo real.

### Princípios

- **Dados como árvore JSON.** O conteúdo de cada página é uma árvore de elementos serializados como JSON nos metadados do CMS — não como HTML bruto.
- **Renderização dupla.** Cada componente possui uma renderização no cliente (para o editor em tempo real) e uma renderização no servidor (para o visitante).
- **Tudo é componente.** Texto, imagem, formulário, galeria de produtos, popup — tudo é um nó na árvore de elementos, com controles, estilos e comportamento uniforme.
- **CSS declarativo.** Os controles mapeiam valores diretamente para propriedades CSS via seletores — o CSS é gerado automaticamente sem lógica customizada por componente.
- **Extensível por módulos.** Funcionalidades são organizadas em módulos independentes (60+) com feature flags para funcionalidades experimentais.

### Managers

O editor é orquestrado por um conjunto de managers (padrão singleton):

| Manager        | Responsabilidade                                             |
| -------------- | ------------------------------------------------------------ |
| Controles      | Tipos de controle da interface do editor                     |
| Elementos      | Elementos estruturais (contêiner, seção, coluna)             |
| Componentes    | Registro de componentes visuais (widgets)                    |
| Documentos     | Páginas, templates, popups — tudo que é editável             |
| Editor         | Interface do editor visual                                   |
| Frontend       | Renderização pública                                         |
| CSS/Arquivos   | Geração e cache de CSS                                       |
| Assets         | Carregamento condicional de scripts e estilos                |
| Tags dinâmicas | Conteúdo dinâmico                                            |
| Templates      | Biblioteca de modelos                                        |
| Módulos        | Carregamento de módulos de funcionalidade                    |
| Kits           | Estilos globais e design tokens                              |
| Revisões       | Histórico e versionamento                                    |
| Condições      | Regras de exibição de templates de tema                      |
| Localizações   | Mapeamento de templates (cabeçalho, rodapé, single, arquivo) |

---

## 2. Modelo de Documentos e Armazenamento

### Tipos de Documento

| Tipo                      | Finalidade                                   |
| ------------------------- | -------------------------------------------- |
| **Página**                | Página do CMS editada visualmente            |
| **Artigo**                | Post do CMS editado visualmente              |
| **Template de seção**     | Seção salva para reutilização                |
| **Template de página**    | Página completa salva como modelo            |
| **Template de cabeçalho** | Header global do site                        |
| **Template de rodapé**    | Footer global do site                        |
| **Template de artigo**    | Layout de post individual                    |
| **Template de arquivo**   | Layout de listagem (categorias, tags)        |
| **Template de busca**     | Layout da página de resultados               |
| **Template 404**          | Layout da página de erro                     |
| **Item de loop**          | Template visual de cada item em uma listagem |
| **Popup**                 | Modal/popup com gatilhos e condições         |
| **Componente global**     | Componente reutilizável sincronizado         |

### Metadados por Documento

| Chave                    | Conteúdo                                        |
| ------------------------ | ----------------------------------------------- |
| `_builder_data`          | Árvore JSON dos elementos (hierarquia completa) |
| `_builder_page_settings` | Configurações de nível de página                |
| `_builder_edit_mode`     | Flag indicando que o construtor está ativo      |
| `_builder_version`       | Versão do editor na última edição               |
| `_builder_template_type` | Tipo de documento                               |
| `_builder_css`           | Status e timestamp do CSS em cache              |
| `_builder_conditions`    | Condições de exibição (para templates de tema)  |

### Formato da Árvore de Elementos

Cada documento armazena seu conteúdo como array JSON. Cada nó contém:

- **`id`** — Identificador único (gerado no cliente).
- **`elType`** — Tipo estrutural: `container`, `section`, `column` ou `widget`.
- **`widgetType`** — Para widgets: qual componente (ex.: `heading`, `image`, `form`).
- **`settings`** — Objeto com todos os valores dos controles.
  - Inclui `__dynamic__` para tags dinâmicas: `{ "title": "[tag id=... name=post-title]" }`.
- **`elements`** — Array de filhos (recursivo).

---

## 3. Hierarquia de Elementos

### Tipos Estruturais

**Contêiner (principal)**

- Layout flexbox ou grid CSS.
- Propriedades: direção, wrap, justify-content, align-items, gap, largura do conteúdo.
- Suporta aninhamento ilimitado.
- Vídeo de fundo, formas decorativas SVG, overlay.

**Seção (legado)**

- Grade de colunas com proporções fixas ou customizadas.
- Presets de 1 a 10 colunas.
- Cada coluna é um elemento filho com largura percentual.
- Redimensionamento responsivo por breakpoint.

**Widget (nó folha)**

- Componente visual (texto, imagem, formulário, produto, etc.).
- Não possui filhos (em geral — exceção: elementos aninhados como abas e acordeão).
- Renderiza conteúdo visual via template do cliente + renderização do servidor.

### Árvore

```
Documento
├── Contêiner (flex/grid)
│   ├── Widget: Título
│   ├── Widget: Imagem
│   └── Contêiner aninhado (flex)
│       ├── Widget: Texto
│       └── Widget: Botão
├── Contêiner
│   └── Widget: Formulário
└── Contêiner (full-width)
    └── Widget: Grade de Produtos
```

### Atributos de Renderização

Cada elemento acumula atributos HTML que são compilados em string na renderização. Dependências de scripts/estilos por elemento garantem carregamento condicional.

---

## 4. Sistema de Controles

### Conceito

Controles são os inputs do painel do editor. Cada controle tem: tipo, identificador, rótulo, valor padrão, seletores CSS opcionais, flag responsivo, flag de conteúdo dinâmico e condições de visibilidade.

### Organização

- **Abas:** Conteúdo | Estilo | Avançado (+ Layout, Responsivo, Configurações quando aplicável).
- **Seções:** Agrupamentos lógicos colapsáveis dentro de cada aba.
- **Condições:** Controles aparecem/desaparecem conforme valores de outros controles.

### Tipos de Controle

**Entrada de dados:**
Texto, área de texto, número, email, URL, oculto, senha.

**Seleção:**
Dropdown, rádio, checkbox, switch (on/off), escolha com ícones (ex.: alinhamento), abas.

**Mídia:**
Seletor de arquivo, galeria multi-imagem, seletor de ícone, dimensões de imagem.

**Estilo:**
Cor (com suporte a gradientes), dimensões (top/right/bottom/left com link), slider com unidade (px/em/%/vw), sombra de caixa, sombra de texto.

**Estrutural:**
Seção (agrupador colapsável), divisor, título, HTML bruto, repetidor (lista dinâmica de campos), popover toggle.

**Avançados:**
Editor de código (com syntax highlighting), editor WYSIWYG, aviso/notificação.

### Grupos de Controles Reutilizáveis

| Grupo      | Controles incluídos                                                               |
| ---------- | --------------------------------------------------------------------------------- |
| Fundo      | Tipo (cor/imagem/gradiente/vídeo), cor, imagem com posição/repeat/size, gradiente |
| Borda      | Tipo de borda, largura por lado, cor, raio por canto                              |
| Sombra     | Cor, offset X/Y, blur, spread, posição (inset/outset)                             |
| Tipografia | Família, tamanho, peso, estilo, decoração, transform, line-height, letter-spacing |
| Flexbox    | Direção, wrap, justify-content, align-items, align-content, gap                   |
| Grid       | Colunas, linhas, gap, auto-flow, template-areas                                   |
| Query      | Tipo de conteúdo, taxonomias, autores, ordenação, paginação                       |

### Seletores CSS

Controles mapeiam valores para CSS declarativamente:

```
"{{WRAPPER}} .titulo" → "color: {{VALUE}}; font-size: {{SIZE}}{{UNIT}}"
```

- `{{WRAPPER}}` = seletor único do elemento.
- `{{VALUE}}` = valor do controle.
- `{{SIZE}}` + `{{UNIT}}` = para sliders com unidade.

Isso gera CSS automaticamente sem lógica por componente.

---

## 5. Editor Visual e Pré-visualização

### Arquitetura

- **Painel lateral:** Lista de componentes, configurações do elemento selecionado, configurações da página, navegador de elementos.
- **Área de preview:** Iframe renderizando o conteúdo em tempo real.
- **Barra de ferramentas:** Salvar, desfazer/refazer, trocar dispositivo, histórico, navegador, configurações globais.

### Fluxo de Edição

1. Usuário abre o editor → JSON do documento é carregado.
2. Árvore de elementos é renderizada no iframe de preview.
3. Usuário arrasta componente do painel → novo nó inserido na árvore → preview atualizado.
4. Usuário altera controle no painel → valor no JSON atualizado → componente re-renderizado no iframe (apenas o afetado).
5. Ao salvar → JSON enviado ao servidor via AJAX → armazenado como metadado → CSS regenerado.

### Templates do Cliente

Cada componente define uma template de renderização no cliente usando variáveis interpoladas dos settings, permitindo atualização instantânea sem round-trip ao servidor.

### Autosave

Integra com revisões do CMS. Detecta autosaves mais recentes e oferece recuperação.

---

## 6. Geração e Compilação de CSS

### Pipeline

1. Percorre a árvore de elementos recursivamente.
2. Para cada controle com seletor CSS → substitui placeholders → gera regra CSS.
3. Agrupa regras por media query (breakpoints).
4. Gera stylesheet completo e minificado.
5. Salva como arquivo externo: `uploads/builder/css/post-{id}.css`.

### CSS Dinâmico

Elementos com tags dinâmicas têm CSS gerado em separado por requisição (pois valores mudam).

### Invalidação

Regenerado quando: documento salvo, Kit alterado, cache limpo manualmente.

### Status

Três estados: arquivo externo, inline no HTML, vazio (sem CSS).

---

## 7. Sistema Responsivo

### Breakpoints

| Nome         | Largura                |
| ------------ | ---------------------- |
| Mobile       | 0px                    |
| Mobile extra | 480px                  |
| Tablet       | 768px                  |
| Tablet extra | 1024px                 |
| Laptop       | 1366px                 |
| Desktop      | Base (sem media query) |
| Tela ampla   | 1440px+                |

Breakpoints editáveis pelo administrador no Kit de Design.

### Controles Responsivos

Controles marcados como "responsivos" geram variantes automáticas por breakpoint. Valores não definidos herdam do breakpoint maior.

### Saída CSS

```css
.el {
	font-size: 24px;
}
@media (max-width: 1023px) {
	.el {
		font-size: 18px;
	}
}
@media (max-width: 767px) {
	.el {
		font-size: 14px;
	}
}
```

---

## 8. Renderização no Frontend

### Pipeline por Elemento

1. Verificar cache (se ativo).
2. Disparar gancho "antes de renderizar".
3. Resolver tags dinâmicas nos settings.
4. Renderizar componente (server-side).
5. Renderizar filhos recursivamente.
6. Envolver em wrapper HTML com atributos de dados (`data-id`, `data-element_type`, `data-widget_type`).
7. Enfileirar assets condicionais (CSS/JS usados pelo componente).

### Modos

- **Normal:** Para visitantes públicos.
- **Preview:** Para pré-visualização via URL com nonce de segurança.

---

## 9. Tags Dinâmicas

### Conceito

Substituem valores estáticos de controles por dados do CMS obtidos em tempo real.

### Formato de Armazenamento

```json
{
	"settings": {
		"title": "Fallback estático",
		"__dynamic__": {
			"title": "[tag id=abc name=post-title settings={}]"
		}
	}
}
```

### Categorias de Tags

| Categoria       | Exemplos de dados                                                           |
| --------------- | --------------------------------------------------------------------------- |
| **Post**        | Título, excerto, conteúdo, imagem destacada, galeria, data, URL, termos, ID |
| **Arquivo**     | Título do arquivo, descrição, URL                                           |
| **Site**        | Nome, logo, tagline, URL do site                                            |
| **Autor**       | Nome, foto, bio, URL, metadados customizados                                |
| **Mídia**       | Dados da imagem destacada                                                   |
| **Ações**       | Data/hora atual, parâmetro de URL, info do usuário logado, lightbox         |
| **Comentários** | Contagem, URL dos comentários                                               |
| **Comércio**    | Preço, SKU, estoque, avaliação, galeria do produto, termos do produto       |

### Campos Personalizados

O sistema suporta provedores de campos personalizados que expõem metadados customizados como tags dinâmicas. Tipos suportados por provedor: texto, imagem, arquivo, galeria, cor, data, número, URL.

### Tipos de Retorno

Cada tag retorna: texto, HTML, URL, objeto ou repetidor.

---

## 10. Construtor de Loops

### Conceito

Permite criar um template visual para cada item de uma listagem de conteúdo (posts, produtos, termos).

### Tipos de Documento

**Item de loop:** Template visual aplicado repetidamente a cada resultado de uma query.

### Componentes

| Componente               | Comportamento                                                 |
| ------------------------ | ------------------------------------------------------------- |
| **Grade de loop**        | Exibe itens em grade com paginação                            |
| **Carrossel de loop**    | Exibe itens em carrossel com navegação                        |
| **Filtro por taxonomia** | Permite ao visitante filtrar itens por categoria/tag via AJAX |

### Query

Configuração declarativa de consulta:

- Tipo de conteúdo (artigos, páginas, produtos, tipo customizado).
- Filtro por taxonomia, autor, status.
- Ordenação (data, título, campos customizados, aleatório).
- Paginação com navegação.
- Prevenção de duplicatas entre múltiplos loops na mesma página.
- Query de conteúdo relacionado (posts da mesma categoria, etc.).
- Filtro por taxonomia via AJAX sem recarregar a página.
- Multi-seleção de filtros.

---

## 11. Construtor de Temas

### Conceito

O editor visual substitui completamente o sistema de templates estáticos do CMS. Em vez de arquivos de template, o administrador cria templates visuais atribuídos a localizações.

### Localizações

| Localização             | O que substitui                                      |
| ----------------------- | ---------------------------------------------------- |
| **Cabeçalho**           | Header global do tema                                |
| **Rodapé**              | Footer global do tema                                |
| **Artigo individual**   | Template de post                                     |
| **Página individual**   | Template de página                                   |
| **Arquivo**             | Listagem de posts (categorias, tags, datas, autores) |
| **Resultados de busca** | Página de resultados                                 |
| **Erro 404**            | Página de erro                                       |
| **Produto individual**  | Página de detalhe do produto (e-commerce)            |
| **Arquivo de produtos** | Página da loja e categorias                          |
| **Carrinho**            | Página do carrinho de compras                        |
| **Checkout**            | Página de finalização de compra                      |
| **Minha conta**         | Dashboard do cliente                                 |

### Condições de Atribuição

Cada template tem regras que definem onde se aplica:

- **Genérica:** "Todo o site", "Todos os artigos", "Todos os produtos".
- **Taxonomia:** "Artigos da categoria X", "Produtos com tag Y".
- **Específica:** "Post #42", "Página 'Sobre'".
- **Papel de usuário:** "Apenas para administradores".
- **Detecção de conflitos:** Quando dois templates competem pela mesma localização, o mais específico vence.

### Componentes de Tema

| Componente         | Dados exibidos              |
| ------------------ | --------------------------- |
| Logo do site       | Logotipo configurado no Kit |
| Nome do site       | Nome dinâmico do site       |
| Título da página   | Título da página atual      |
| Título do artigo   | Título do post atual        |
| Conteúdo do artigo | Corpo completo do post      |
| Excerto do artigo  | Resumo do post              |
| Imagem destacada   | Miniatura/hero do post      |
| Título do arquivo  | Nome da categoria/tag/data  |
| Posts do arquivo   | Listagem com paginação      |

### Renderização

Templates de cabeçalho/rodapé são renderizados globalmente. Templates de conteúdo substituem o template padrão do CMS. Condições são avaliadas a cada requisição para determinar qual template aplicar.

---

## 12. Condições de Exibição

### Operadores

| Operador                 | Significado                    |
| ------------------------ | ------------------------------ |
| `==`                     | Igual                          |
| `!==`                    | Diferente                      |
| `===`                    | Estritamente igual             |
| `in` / `!in`             | Contido / não contido em lista |
| `contains` / `!contains` | String contém / não contém     |
| `<`, `<=`, `>`, `>=`     | Comparações numéricas          |

### Relações

Combinação com `AND` (todas devem ser verdadeiras) ou `OR` (pelo menos uma).

### Usos

- Atribuição de templates de tema a localizações (seção 11).
- Visibilidade condicional de qualquer elemento na página.
- Regras de exibição de popups (seção 23).
- Condições de injeção de código customizado (seção 28).
- Visibilidade de controles no painel do editor.

---

## 13. Inventário Completo de Componentes

O sistema inclui **100+ componentes visuais** nativos, organizados nas seções 14 a 20. Resumo por categoria:

| Categoria             | Qtd | Exemplos                                                                      |
| --------------------- | --- | ----------------------------------------------------------------------------- |
| Texto e tipografia    | 5   | Título, título animado, editor de texto, citação, destaque de código          |
| Mídia                 | 10  | Imagem, vídeo, galeria avançada, carrossel, playlist, Lottie, hotspot         |
| Interativos e layout  | 12  | Botão, abas, acordeão, toggle, divisor, espaçador, off-canvas, HTML           |
| Marketing e conversão | 10  | Tabela de preços, CTA, contagem regressiva, progresso, flip box, link-in-bio  |
| Navegação             | 6   | Menu, mega menu, busca, sumário, âncora, breadcrumb                           |
| Social                | 5   | Botões de compartilhamento, embed social, página social, comentários sociais  |
| E-commerce            | 30+ | Título/preço/galeria/estoque/avaliação/carrinho/checkout/conta do produto     |
| Formulários           | 2   | Formulário completo, formulário de login                                      |
| Tema                  | 9   | Logo, nome do site, título do post, conteúdo, excerto, imagem destacada, etc. |
| Loop                  | 3   | Grade de loop, carrossel de loop, filtro por taxonomia                        |
| Elementos flutuantes  | 3   | Botões flutuantes, barras flutuantes, link-in-bio                             |
| Pagamento             | 2   | Botão de cartão, botão de pagamento alternativo                               |

---

## 14. Componentes de Texto e Tipografia

**Título (heading)**

- Níveis H1 a H6. Tamanho, cor, alinhamento, link.
- Opção de tag HTML customizada.

**Título animado**

- Texto com efeitos: rotação de palavras, digitação (typewriter), morphing.
- Múltiplos estilos de animação configuráveis.

**Editor de texto (WYSIWYG)**

- Conteúdo rico com formatação completa.
- Tipografia, cores, espaçamento configuráveis globalmente.

**Citação estilizada (blockquote)**

- Texto citado com autor e atribuição.
- Estilos customizáveis.

**Destaque de código (code highlight)**

- Bloco de código-fonte com syntax highlighting para 20+ linguagens.
- Numeração de linhas, botão copiar, destaque de linhas específicas.

---

## 15. Componentes de Mídia

**Imagem**

- Upload, dimensões, link, legenda, lightbox.
- Tamanhos de imagem registrados no CMS.

**Vídeo**

- Fontes: serviço de streaming, hospedagem própria.
- Controles: autoplay, mudo, loop, capa customizada, overlay de play.

**Galeria avançada**

- Grade com espaçamento e proporção configuráveis.
- Filtro por tags.
- Lightbox integrado.
- Animações de transição entre imagens.

**Carrossel de mídia**

- Slider de imagens/vídeos com navegação seta + pontos.
- Autoplay com delay, loop, lazy loading.
- Touch/swipe em mobile.
- Keyboard navigation.

**Carrossel de depoimentos**

- Slider de citações com foto, nome e cargo do autor.

**Carrossel de avaliações**

- Slider de reviews com estrelas e texto.

**Slides customizados**

- Cada slide é um contêiner de conteúdo livre (título + texto + botão + fundo).
- Animações de transição por slide.

**Carrossel aninhado**

- Carrossel cujos itens podem conter outros elementos compostos.

**Playlist de vídeo**

- Lista lateral de vídeos com reprodutor principal.
- Navegação entre vídeos, thumbnails.

**Animação Lottie**

- Player de animações JSON (formato Lottie).
- Triggers: ao carregar, ao scroll, ao hover.
- Controles de velocidade e direção.

**Pontos interativos (hotspot)**

- Imagem de fundo com pontos clicáveis posicionados.
- Cada ponto exibe tooltip com conteúdo customizado.
- Trigger: hover ou clique.

---

## 16. Componentes Interativos e de Layout

**Botão**

- Texto, link, ícone (antes/depois do texto), efeito hover.
- Tamanhos pré-definidos ou customizados.

**Abas**

- N abas com título + conteúdo rico por aba.
- Suporta elementos aninhados dentro de cada aba.
- Orientação horizontal ou vertical.

**Acordeão**

- N itens expansíveis/colapsáveis.
- Apenas um aberto por vez (ou múltiplos).
- Suporta conteúdo rico e elementos aninhados.

**Toggle**

- Similar ao acordeão mas sem restrição de exclusividade.

**Divisor**

- Linha horizontal/vertical com estilo, peso, cor e largura configuráveis.

**Espaçador**

- Espaço vertical com altura responsiva.

**HTML personalizado**

- Bloco de código HTML arbitrário renderizado diretamente.

**Código curto**

- Renderiza shortcodes do CMS (compatibilidade com extensões terceiras).

**Barra lateral**

- Renderiza uma área de widget registrada no CMS.

**Ícone**

- Ícone de biblioteca com tamanho, cor e link.

**Caixa de ícone**

- Ícone + título + descrição em layout estruturado.

**Lista de ícones**

- Lista vertical de itens com ícone e texto.

**Off-canvas (painel lateral)**

- Painel que desliza da borda da tela.
- Contém qualquer conteúdo visual.
- Animação de entrada/saída, overlay de fundo.
- Usado para menus mobile, filtros, detalhes.

---

## 17. Componentes de Marketing e Conversão

**Tabela de preços**

- Plano com cabeçalho, preço, lista de recursos, botão CTA.
- Faixa de destaque (ribbon) configurável.
- Layout de comparação entre planos.

**Lista de preços**

- Lista de itens com nome, descrição, preço (estilo cardápio).

**Chamada para ação (CTA)**

- Banner de conversão: imagem + título + texto + botão.
- Layout empilhado ou lado a lado.
- Efeito hover na imagem.

**Contagem regressiva (countdown)**

- Timer até data/hora específica.
- Formato: dias:horas:minutos:segundos.
- Ações ao expirar: redirecionar, mostrar mensagem, ocultar elemento.
- Suporte a timezone.
- Modo evergreen (reinicia para cada visitante).

**Rastreador de progresso**

- Visualização multi-etapa com ícones/números.
- Passo atual destacado.
- Configuração de descrição por etapa.

**Caixa giratória (flip box)**

- Cartão com frente e verso. Hover revela o verso com animação de flip.
- Conteúdo independente em cada face.

**Contador numérico**

- Número que anima de X a Y ao entrar na viewport.
- Prefixo, sufixo, separador de milhares.

**Barra de progresso**

- Barra de preenchimento horizontal com percentual animado.
- Cor, tipografia, título configuráveis.

**Alerta**

- Caixa de mensagem com ícone, cor por tipo (info, sucesso, aviso, erro).
- Botão de fechar.

**Avaliação (rating)**

- Estrelas (ou outra escala) com valor configurável.

**Link-in-bio**

- Landing page estilo "link na bio" com 6 variantes de layout.
- Lista de links com ícones.
- Ideal para redes sociais.

---

## 18. Componentes de Navegação

**Menu de navegação**

- Renderiza menus do CMS com dropdown e submenus.
- Menu mobile com toggle hamburger.
- Animações de dropdown.
- Tipografia e cores configuráveis.

**Mega menu**

- Dropdown de múltiplas colunas com conteúdo visual (imagens, ícones, descrições).
- Layout em grade dentro do dropdown.
- Suporte a elementos aninhados nos itens de menu.

**Busca**

- Formulário de busca do site com estilo configurável.

**Sumário (table of contents)**

- Gerado automaticamente a partir dos títulos (H1-H6) da página.
- Links com rolagem suave para cada seção.
- Hierarquia aninhada.

**Âncora de menu**

- Ponto invisível na página que serve como destino de links de rolagem.

**Breadcrumb**

- Trilha de navegação hierárquica (Início > Categoria > Post).

---

## 19. Componentes Sociais

**Botões de compartilhamento**

- 20+ redes: Facebook, Twitter/X, LinkedIn, Pinterest, Reddit, Telegram, WhatsApp, Email, Print, Threads, Tumblr, Pocket, e mais.
- Contadores de compartilhamento.
- Layout em linha, grade ou dropdown.

**Botão de rede social**

- Botão de curtir/seguir de plataforma específica.

**Comentários de rede social**

- Integra sistema de comentários de rede social (ex.: Facebook Comments).

**Embed de rede social**

- Incorpora post de rede social.

**Página de rede social**

- Incorpora widget de página/perfil.

---

## 20. Componentes de Comércio Eletrônico

### Página do Produto (30+ componentes)

| Componente             | Dados exibidos                                |
| ---------------------- | --------------------------------------------- |
| Título do produto      | Nome dinâmico                                 |
| Preço                  | Preço com formatação de moeda, preço de venda |
| Galeria de imagens     | Slider com zoom, thumbnails                   |
| Avaliação              | Estrelas + contagem de reviews                |
| Status de estoque      | Disponível, indisponível, quantidade          |
| Descrição curta        | Resumo do produto                             |
| Metadados              | SKU, categorias, tags                         |
| Informações adicionais | Tabela de atributos (peso, dimensões, etc.)   |
| Abas de dados          | Descrição / Avaliações / Atributos em tabs    |
| Produtos relacionados  | Grade de produtos da mesma categoria          |
| Upsell                 | Produtos sugeridos como upgrade               |
| Botão de compra        | Adicionar ao carrinho com seleção de variação |
| Breadcrumb             | Navegação hierárquica na loja                 |
| Conteúdo do produto    | Descrição completa                            |

### Listagem de Produtos

| Componente           | Função                         |
| -------------------- | ------------------------------ |
| Grade de produtos    | Lista com filtros e paginação  |
| Categorias           | Grade de categorias com imagem |
| Descrição do arquivo | Texto da categoria/loja        |

### Páginas de Compra

| Componente       | Função                                                     |
| ---------------- | ---------------------------------------------------------- |
| Carrinho         | Tabela editável de itens com quantidades                   |
| Checkout         | Formulário de dados + pagamento                            |
| Minha conta      | Dashboard do cliente (pedidos, endereços, dados)           |
| Resumo de compra | Totais do pedido                                           |
| Mensagens        | Erros, sucessos e avisos                                   |
| Mini-carrinho    | Ícone no header com preview do carrinho (atualização AJAX) |

### Tags Dinâmicas de Comércio

Preço, título, SKU, estoque, avaliação, galeria, termos, imagem da categoria, link de compra — todos acessíveis como tags dinâmicas em qualquer controle que aceite conteúdo dinâmico.

---

## 21. Construtor de Formulários

### Tipos de Campo

| Campo              | Comportamento                          |
| ------------------ | -------------------------------------- |
| Texto              | Input simples                          |
| Email              | Com validação                          |
| Área de texto      | Multi-linha                            |
| URL                | Com validação                          |
| Telefone           | Formato livre                          |
| Número             | Com min/max/step                       |
| Data               | Seletor de data                        |
| Hora               | Seletor de hora                        |
| Seleção (dropdown) | Lista de opções                        |
| Rádio              | Seleção exclusiva                      |
| Checkbox           | Seleção múltipla                       |
| Toggle             | Switch on/off                          |
| Upload de arquivo  | Validação de tipo e tamanho            |
| Aceitação          | Checkbox de termos com link            |
| Oculto             | Valor pré-definido invisível           |
| HTML               | Conteúdo estático dentro do formulário |
| Senha              | Input mascarado                        |

### Proteção contra Spam

- **Honeypot:** Campo invisível que apenas bots preenchem.
- **CAPTCHA v2:** Desafio visual ("selecione as imagens com...").
- **CAPTCHA v3:** Pontuação de comportamento invisível.
- **Detecção de spam:** Integração com serviço externo anti-spam.

### Submissão

- Submissão via AJAX sem recarregar a página.
- Validação client-side e server-side.
- Registro de cada submissão no banco para consulta posterior.
- Dashboard administrativo com listagem, filtragem e exportação de submissões.

### Formulário de Login

Componente dedicado que integra com o sistema de autenticação do CMS. Campos de usuário, senha, "lembrar-me", link de recuperação de senha.

---

## 22. Ações Pós-Submissão e Integrações

Após a submissão de um formulário, uma ou mais ações executam em sequência:

| Ação                           | Comportamento                                                                          |
| ------------------------------ | -------------------------------------------------------------------------------------- |
| **Email**                      | Envia notificação configurável (destinatários, assunto, corpo HTML, reply-to, CC, BCC) |
| **Email de confirmação**       | Segundo email ao remetente (ex.: "Recebemos sua mensagem")                             |
| **Webhook**                    | HTTP POST com dados do formulário para URL customizada                                 |
| **Registro em banco**          | Salva submissão para consulta no dashboard                                             |
| **Redirecionamento**           | Redireciona para URL após submissão                                                    |
| **Serviço de email marketing** | Adiciona contato a lista/sequência (6+ provedores suportados)                          |
| **Mensageria**                 | Envia dados para canal de chat (2+ provedores)                                         |
| **Processador de pagamento**   | Cobra via cartão ou pagamento alternativo                                              |

### Provedores de Integração

| Categoria                              | Capacidade                                                 |
| -------------------------------------- | ---------------------------------------------------------- |
| Email marketing (6+ provedores)        | Adicionar contato a lista, aplicar tags, iniciar sequência |
| Mensageria corporativa (2+ provedores) | Enviar dados formatados para canal                         |
| Webhook genérico                       | POST para qualquer URL com payload JSON                    |
| Anti-spam (1+ provedor)                | Verificar conteúdo contra base de spam                     |
| Pagamentos (2 provedores)              | Processar transação com dados do formulário                |

---

## 23. Construtor de Popups

### Tipo de Documento

Popup é um tipo de documento dedicado, editado no mesmo editor visual que páginas — arrastar componentes, configurar estilos, definir animações.

### Gatilhos

| Gatilho                | Quando dispara                                     |
| ---------------------- | -------------------------------------------------- |
| Carregamento da página | Após delay configurável                            |
| Rolagem                | Ao atingir percentual de rolagem da página         |
| Clique em elemento     | Ao clicar em botão/link específico                 |
| Intenção de saída      | Quando cursor move para fora da viewport (desktop) |
| Inatividade            | Após tempo sem interação do usuário                |

### Condições de Exibição

- Em quais páginas/posts/categorias mostrar.
- Para quais papéis de usuário.
- Em quais dispositivos (mobile/desktop/tablet).
- Agendamento (data de início e fim).
- Frequência (uma vez, sempre, a cada N dias, N vezes no total).

### Configurações do Popup

- Overlay de fundo com cor/opacidade.
- Animação de entrada e saída (fade, slide, zoom, etc.).
- Botão de fechar customizável (posição, ícone).
- Fechamento automático após timer.
- Prevenção de scroll no fundo.
- Controle de z-index.
- Largura e posição (centro, topo, lateral).
- Fechamento ao clicar no overlay.
- Integração com formulários (fechar popup após submissão bem-sucedida).

---

## 24. Efeitos de Movimento e Animações

### Efeitos de Rolagem

| Efeito                  | Comportamento                                 |
| ----------------------- | --------------------------------------------- |
| Deslocamento horizontal | Elemento desliza lateralmente conforme scroll |
| Deslocamento vertical   | Parallax vertical clássico                    |
| Opacidade               | Fade in/out conforme posição de scroll        |
| Desfoque (blur)         | Nitidez varia com scroll                      |
| Rotação                 | Elemento gira conforme scroll                 |
| Escala                  | Zoom in/out conforme scroll                   |

Cada efeito tem: velocidade, direção, faixa de viewport (início e fim do efeito).

### Efeitos de Mouse

| Efeito               | Comportamento                                                        |
| -------------------- | -------------------------------------------------------------------- |
| Inclinação 3D (tilt) | Elemento inclina na direção do cursor                                |
| Seguir cursor        | Elemento desloca seguindo o mouse                                    |
| Parallax de mouse    | Camadas movem em velocidades diferentes baseado na posição do cursor |

### Controles Globais

- Sensibilidade e velocidade por efeito.
- Breakpoints onde o efeito está ativo (desabilitar em mobile, por exemplo).
- Seletor CSS customizado.
- Efeitos separados para fundo vs. conteúdo do elemento.

---

## 25. Transições de Página

### Conceito

Efeito visual de loading durante a transição entre páginas do site.

### Funcionalidades

- Tela de carregamento com overlay.
- Tipos de indicador: círculos, pontos, spinners, barras de progresso.
- Conteúdo customizável do loader (ícone, imagem, animação).
- Animação de saída quando o conteúdo está carregado.
- Delay mínimo configurável.

---

## 26. Elementos Fixos e Scroll Snap

### Elementos Fixos (Sticky)

- Qualquer contêiner, seção ou componente pode ter posição sticky.
- Posição: topo ou base da viewport.
- Offset configurável.
- Configuração responsiva (sticky apenas em certos dispositivos).
- Casos de uso: cabeçalho fixo, barra de navegação, CTA persistente.

### Scroll Snap

- Contêineres que "encaixam" a viewport ao rolar.
- Posição de encaixe: topo, centro ou base do contêiner.
- Experiência de rolagem por seção (full-page scroll).
- Rolagem suave com parada precisa.

---

## 27. Kit de Design (Estilos Globais)

### Conceito

O Kit é um documento especial que armazena configurações de design aplicáveis a todo o site. Um Kit ativo por site.

### Configurações do Kit

| Seção                    | Conteúdo                                                               |
| ------------------------ | ---------------------------------------------------------------------- |
| **Cores globais**        | Paleta completa: primária, secundária, texto, acento, + customizadas   |
| **Tipografia global**    | Fontes: principal, secundária, texto, acento — com tamanho/peso/estilo |
| **Botões**               | Estilo global de botões (cores, tipografia, bordas, hover)             |
| **Campos de formulário** | Estilo global de inputs                                                |
| **Identidade**           | Logo, favicon, nome do site                                            |
| **Lightbox**             | Configurações do visualizador de imagens em overlay                    |
| **CSS global**           | CSS personalizado aplicado a todo o site                               |
| **Breakpoints**          | Valores customizados dos pontos de quebra responsivos                  |

### Variáveis de Design

- Variáveis de cor: paleta compartilhada entre todos os elementos e componentes.
- Variáveis de tipografia: conjuntos de fonte reutilizáveis.
- Classes CSS globais: classes reutilizáveis definíveis pelo administrador.

### Armazenamento

Kit ativo referenciado pela opção `builder_active_kit`. Rastreamento do Kit anterior para reversão.

---

## 28. CSS e Código Personalizado

### CSS por Elemento

- Campo de código CSS com syntax highlighting em cada elemento.
- Seletor `selector` mapeia automaticamente para o wrapper do elemento.

### CSS Global

- CSS personalizado definido no Kit de Design.
- Compilado junto com o CSS global do site.

### Trechos de Código (Snippets)

- Tipo de conteúdo dedicado para trechos de HTML, CSS e JavaScript.
- Injeção por localização: `<head>`, `<body>` (início), antes do `</body>`.
- Condições de exibição por página, post, tipo de conteúdo.
- Versionamento integrado.

### Atributos HTML Personalizados

- Qualquer elemento pode receber atributos HTML arbitrários.
- Suporte a `data-*`, `aria-*` e atributos customizados.

---

## 29. Componentes Globais Reutilizáveis

### Conceito

Qualquer componente pode ser salvo como "componente global". Diferente de templates salvos, componentes globais são **sincronizados**: editar o original atualiza todas as instâncias.

### Funcionamento

- O original é armazenado na biblioteca de modelos.
- Cada uso é uma referência ao original (não cópia).
- Alterações propagam automaticamente para todas as instâncias.
- CSS regenerado para todas as páginas que usam o componente.
- Rastreamento de quais páginas incluem cada componente global.

---

## 30. Biblioteca de Modelos

### Fontes

1. **Local:** Tipo de conteúdo customizado com taxonomias de tipo e categoria.
2. **Remota:** Catálogo online de modelos prontos.
3. **Nuvem:** Biblioteca na nuvem sincronizada com a conta.

### Operações

- Salvar qualquer seção, contêiner ou página como modelo.
- Importar modelo (JSON ou ZIP com mídia).
- Exportar modelo (JSON com referências de mídia ou ZIP com mídia inclusa).
- Busca e filtragem na biblioteca.
- Categorização por tipo e tags.

---

## 31. Histórico e Revisões

### Desfazer/Refazer

- Pilha de ações no cliente.
- Cada alteração de controle, adição/remoção de elemento, movimentação gera entrada na pilha.
- Navegação livre pela pilha.

### Revisões

- Cada salvamento gera revisão no CMS.
- Painel com até 50 revisões, autor e timestamp.
- Restauração de qualquer revisão anterior.
- Comparação visual entre versões.

---

## 32. Navegador de Elementos

- Árvore hierárquica de todos os elementos da página.
- Clique para selecionar, shift/ctrl para multi-seleção.
- Arrastar-e-soltar para reordenar na árvore.
- Toggle de visibilidade por elemento.
- Busca e filtragem.
- Expandir/colapsar ramos.

---

## 33. Sistema de Módulos e Feature Flags

### Módulos

60+ módulos independentes, cada um encapsulando funcionalidade:

- Podem ser habilitados/desabilitados.
- Podem depender de feature flags (experimentos).
- Ciclo de vida gerenciado centralmente.

### Feature Flags

Propriedades: nome, status de release (dev/alfa/beta/estável), estado (ativo/inativo/padrão), dependências, visibilidade, mutabilidade.

Armazenados como opções do CMS. Permitem lançamento gradual de funcionalidades.

---

## 34. Gerenciamento de Papéis

- Controle de quais papéis do CMS podem usar o editor visual.
- Exclusão de papéis específicos (exceto administradores).
- Modo de acesso restrito: apenas edição de conteúdo (sem acesso a design/layout).
- Controle por papel de quais componentes ficam disponíveis no editor.
- Permissão base: "editar posts" (ou equivalente).

---

## 35. Importação e Exportação

### Templates

- Exportação: JSON com árvore + settings + referências de mídia.
- Importação: Parse, download de mídia, recriação local.
- Suporte a ZIP com mídia inclusa.

### Kit de Design

- Kit completo exportável/importável com cores, tipografia, configurações.
- Sincronização com biblioteca na nuvem.

### Classes e Variáveis Globais

- Sistema de snapshot que preserva definições de classes e variáveis.
- Exportado/importado junto com templates.

---

## 36. Cache de Elementos

### Mecanismo

- Componentes pesados podem ter saída HTML cacheada.
- Armazenamento como shortcode interno resolvido sem re-renderização.
- Invalidação: ao salvar documento ou limpar cache.

---

## Apêndice A — Fluxo de Renderização

```
Requisição HTTP
       │
       ▼
CMS Bootstrap + Editor Bootstrap
       │
       ▼
Documento usa o editor visual?
       │
       ├─ NÃO → Renderização padrão do CMS
       │
       └─ SIM
              │
              ▼
       Carregar JSON (_builder_data)
              │
              ▼
       CSS em cache válido?
       ├─ SIM → Enfileirar CSS
       └─ NÃO → Regenerar CSS
              │
              ▼
       Para cada elemento na árvore:
       │
       ├─ Resolver tags dinâmicas
       ├─ Renderizar componente (server-side)
       ├─ Renderizar filhos (recursivo)
       ├─ Aplicar wrapper HTML + atributos de dados
       └─ Enfileirar assets condicionais
              │
              ▼
       Template de tema ativo? (cabeçalho, rodapé, etc.)
       ├─ SIM → Avaliar condições → Renderizar templates
       └─ NÃO → Usar template padrão do CMS
              │
              ▼
       Popups com condições ativas?
       ├─ SIM → Renderizar popups no footer
       └─ NÃO → Pular
              │
              ▼
       HTML + CSS + JS → Navegador
```

---

## Apêndice B — Modelo de Dados

```
┌─────────────────────┐     ┌────────────────────────────┐
│   Post do CMS       │     │   Metadados do Post        │
│─────────────────────│     │────────────────────────────│
│ ID                  │◄────┤ _builder_data (JSON tree)  │
│ type                │     │ _builder_page_settings     │
│ status              │     │ _builder_edit_mode         │
│ title               │     │ _builder_version           │
└─────────────────────┘     │ _builder_css (cache info)  │
                            │ _builder_template_type     │
                            │ _builder_conditions        │
                            └────────────────────────────┘

┌──────────────────────────────────┐
│ Opções do CMS                    │
│──────────────────────────────────│
│ builder_active_kit → Kit ID      │
│ builder_experiment-* → flags     │
│ builder_exclude_roles → roles    │
└──────────────────────────────────┘

┌──────────────────────────────────┐
│ Arquivo de CSS gerado            │
│──────────────────────────────────│
│ uploads/builder/css/post-{id}.css│
└──────────────────────────────────┘
```

---

## Apêndice C — Compatibilidade com Template Kits do Ecossistema Existente

> **Requisito crítico:** O sistema DEVE ser capaz de importar e utilizar template kits existentes do ecossistema do construtor visual original. Isso significa que o formato de dados descrito abaixo é um **contrato de compatibilidade** que a reimplementação precisa honrar.

### Formato do Kit (ZIP)

Um template kit é um arquivo ZIP com a seguinte estrutura:

```
kit.zip
├── manifest.json                    # Metadados do kit e índice de conteúdo
├── site-settings.json               # Estilos globais (cores, tipografia, botões, etc.)
├── templates/
│   ├── {template-id}.json           # Cada template de tema (header, footer, single, etc.)
│   └── ...
├── content/
│   ├── {post-type}/
│   │   ├── {post-id}.json           # Conteúdo (páginas, artigos)
│   │   └── ...
│   └── ...
└── wp-content/
    └── {post-type}/
        └── {post-type}.xml          # Conteúdo nativo do CMS em formato XML de exportação
```

### Manifest.json

O manifesto é o índice do kit. Estrutura:

```json
{
  "name": "nome-do-kit-sanitizado",
  "title": "Nome de Exibição do Kit",
  "description": "Descrição do kit",
  "author": "Autor",
  "version": "2.0",
  "elementor_version": "X.X.X",
  "created": "YYYY-MM-DD HH:ii:ss (GMT)",
  "thumbnail": "URL da thumbnail do kit",
  "site": "https://url-do-site-original.com",

  "site-settings": ["global-colors", "global-typography", "theme-style-buttons", ...],

  "templates": {
    "id-do-template": {
      "title": "Título do Template",
      "doc_type": "header|footer|single-post|archive|error-404|search-results|page|section",
      "thumbnail": "URL",
      "conditions": [["localização", "sub-localização", "página-específica"]],
      "location": "header|footer|archive|single"
    }
  },

  "content": {
    "post": {
      "id-original": {
        "title": "Título",
        "excerpt": "Excerto",
        "doc_type": "post",
        "thumbnail": "URL",
        "url": "URL original",
        "terms": [
          { "term_id": "id", "taxonomy": "category", "slug": "slug" }
        ],
        "show_on_front": true
      }
    },
    "page": { ... }
  },

  "taxonomies": {
    "category": {
      "id-do-termo": {
        "name": "Nome",
        "slug": "slug",
        "parent": 0,
        "description": ""
      }
    }
  },

  "plugins": [
    {
      "name": "Nome da Extensão",
      "plugin": "pasta/arquivo.php",
      "pluginUri": "URL",
      "version": "X.X.X"
    }
  ],

  "experiments": {
    "nome-do-experimento": {
      "name": "nome",
      "title": "Título",
      "state": "active|inactive",
      "default": "active|inactive",
      "release_status": "stable|beta|alpha"
    }
  }
}
```

### Site-Settings.json

Contém os estilos globais do kit:

```json
{
  "settings": {
    "custom_colors": [
      { "_id": "id-unico", "title": "Primary", "color": "#6EC1E4" }
    ],
    "custom_typography": [
      {
        "_id": "id-unico",
        "title": "Nome",
        "typography_font_family": "Roboto",
        "typography_font_size": { "size": 16, "unit": "px" },
        "typography_font_weight": "400",
        "typography_line_height": { "size": 1.5, "unit": "em" },
        "typography_letter_spacing": { "size": 0, "unit": "px" }
      }
    ],
    "space_between_widgets": { "size": 20, "unit": "px", "column": "20", "row": "20", "isLinked": true },
    "body_typography": { ... },
    "buttons_border_radius": { ... },
    "lightbox_content_animation": "fade"
  }
}
```

**Abas exportadas:** `global-colors`, `global-typography`, `settings-background`, `settings-layout`, `settings-page-transitions`, `settings-lightbox`, `theme-style-typography`, `theme-style-buttons`, `theme-style-form-fields`, `theme-style-images`, `settings-custom-css`.

**Excluída da exportação:** `settings-site-identity` (logo, favicon — preserva identidade do site destino).

### Template/Content JSON

Cada template ou conteúdo é um JSON com a árvore de elementos:

```json
{
  "content": [
    {
      "id": "uuid-string",
      "elType": "container|section|widget",
      "widgetType": "heading|image|form|etc",
      "settings": {
        "title": "Valor",
        "image": { "url": "https://...", "id": 123 },
        "__dynamic__": {
          "title": "[elementor-tag id=abc name=post-title settings={}]"
        }
      },
      "elements": [ ... ]
    }
  ],
  "settings": {
    "page_title": "Título da Página",
    "custom_css": ".selector { ... }"
  },
  "metadata": {
    "_elementor_data": "string JSON",
    "_elementor_edit_mode": "builder"
  }
}
```

### Tags Dinâmicas (formato de serialização)

```
[elementor-tag id="abc123" name="post-title" settings="encoded-json"]
```

O sistema DEVE parsear este formato e mapear para seus próprios provedores de dados dinâmicos.

### Referências de Mídia

- Imagens são referenciadas por **URL** no JSON (não embutidas no ZIP).
- Na importação, o sistema DEVE:
  1. Fazer download de cada URL de mídia referenciada.
  2. Criar um anexo local (upload).
  3. Substituir todas as referências (URLs e IDs) no JSON pelos novos valores locais.
  4. Marcar anexos importados com ID de sessão para permitir rollback.

### Condições de Template de Tema

Formato no manifesto:

```json
"conditions": [["include", "general"]],
"location": "header"
```

O sistema DEVE mapear essas condições para seu próprio sistema de exibição condicional (seção 12).

### Processo de Importação

1. Extrair ZIP para diretório temporário.
2. Parsear `manifest.json` e adaptar para compatibilidade de formato.
3. Parsear `site-settings.json` e aplicar ao Kit de Design ativo.
4. Para cada template: parsear JSON, regenerar IDs de elemento, importar mídia, criar documento.
5. Para cada conteúdo: parsear JSON, importar mídia, criar posts/páginas.
6. Para taxonomias: criar termos ausentes.
7. Aplicar condições de templates de tema.
8. Registrar sessão de importação para possibilitar rollback.
9. Limpar diretório temporário.

### Processo de Exportação (formato compatível)

O sistema DEVE exportar kits no mesmo formato acima, permitindo que kits criados no novo CMS sejam importáveis no ecossistema original.

1. Coletar site settings do Kit ativo.
2. Para cada template/conteúdo: serializar árvore de elementos como JSON.
3. Gerar `manifest.json` com índice completo.
4. Empacotar em ZIP com a mesma estrutura de diretórios.
5. Referenciar mídia por URL (não embutir).

### Mapeamento de Tipos

Na importação, os seguintes mapeamentos devem ser resolvidos:

| Campo no kit                  | Mapeamento no novo CMS                              |
| ----------------------------- | --------------------------------------------------- |
| `elType: "container"`         | Elemento contêiner nativo                           |
| `elType: "section"`           | Elemento seção (legado) ou converter para contêiner |
| `elType: "column"`            | Coluna (filho de seção)                             |
| `elType: "widget"`            | Componente visual correspondente pelo `widgetType`  |
| `widgetType: "heading"`       | Componente de título                                |
| `widgetType: "image"`         | Componente de imagem                                |
| `widgetType: "form"`          | Componente de formulário                            |
| `widgetType: "woocommerce-*"` | Componentes de e-commerce                           |
| `doc_type: "header"`          | Template de cabeçalho                               |
| `doc_type: "footer"`          | Template de rodapé                                  |
| `doc_type: "single-post"`     | Template de artigo individual                       |
| `doc_type: "archive"`         | Template de arquivo                                 |

Componentes não reconhecidos DEVEM ser importados como placeholder com os dados brutos preservados, em vez de descartados — permitindo que extensões futuras os reconheçam.

### Sessão de Importação (Rollback)

O sistema armazena metadados de cada importação para permitir reversão:

```json
{
	"session_id": "uuid",
	"kit_title": "Nome do Kit",
	"kit_source": "local|cloud",
	"user_id": 123,
	"start_timestamp": 1234567890,
	"end_timestamp": 1234567900,
	"imported_attachments": [101, 102, 103],
	"imported_posts": [201, 202],
	"imported_templates": [301, 302],
	"previous_kit_id": 50
}
```

Rollback: restaura o kit anterior e opcionalmente remove conteúdo importado.

---

_Este documento mapeia o comportamento funcional completo do editor visual de conteúdo — nativo e integrado ao CMS. Toda funcionalidade descrita é parte do sistema, sem separação em tiers ou licenciamento. A compatibilidade de importação com template kits do ecossistema existente é um requisito de primeira classe._
