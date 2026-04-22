# Documentação do PitStopHub

---

## Estrutura do Projeto

```
pitstophub/
├── index.html          → Ponto de entrada HTML
├── vite.config.ts      → Configuração do Vite (build e servidor)
├── package.json        → Dependências e scripts
├── src/
│   ├── main.tsx        → Inicializa o React na página
│   ├── index.css       → Estilos globais e tema
│   ├── supabase.ts     → Conexão com o banco de dados
│   ├── auth.ts         → Login, cadastro e configurações do usuário
│   ├── types.ts        → Todos os dados do automobilismo (categorias, equipes, pilotos, corridas)
│   ├── AuthGate.tsx    → Controla se o usuário está logado e exibe o modal de login
│   ├── App.tsx         → Toda a interface do site
│   └── lib/
│       └── utils.ts    → Função auxiliar para combinar classes CSS
```

---

## `index.html`

```html
<!doctype html>
```
Declara que o documento é HTML5.

```html
<html lang="en">
```
Abre o documento HTML. `lang="en"` informa ao navegador o idioma base (afeta leitores de tela e SEO).

```html
<meta charset="UTF-8" />
```
Define a codificação de caracteres como UTF-8, necessário para exibir acentos, emojis e caracteres especiais corretamente.

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
```
Faz o site se adaptar ao tamanho da tela do dispositivo (responsividade). Sem isso, o celular mostraria a versão desktop reduzida.

```html
<title>PitStopHub - Tudo sobre automobilismo.</title>
```
Define o título que aparece na aba do navegador.

```html
<link rel="icon" ...>
```
Define o favicon (ícone da aba) usando um emoji de troféu embutido diretamente como SVG.

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
```
Instrui o navegador a abrir a conexão com os servidores do Google Fonts antes mesmo de precisar deles, reduzindo o tempo de carregamento das fontes.

```html
<link rel="dns-prefetch" href="https://i.imgur.com" />
```
Faz o navegador resolver o DNS do Imgur antecipadamente, pois imagens de pilotos são carregadas de lá.

```html
<div id="root"></div>
```
O elemento onde o React injeta toda a interface do site.

```html
<script type="module" src="/src/main.tsx"></script>
```
Carrega o arquivo de entrada do React. `type="module"` permite usar `import`/`export` modernos.

---

## `vite.config.ts`

```ts
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
```
Importa os plugins e utilitários necessários para configurar o Vite.

```ts
export default defineConfig(() => ({
```
Exporta a configuração do Vite. A forma de função permite acessar variáveis de ambiente se necessário.

```ts
plugins: [react(), tailwindcss()],
```
Habilita suporte ao React (JSX, Fast Refresh) e ao Tailwind CSS v4 dentro do Vite.

```ts
resolve: { alias: { '@': path.resolve(__dirname, '.') } },
```
Permite usar `@/` como atalho para a raiz do projeto em imports.

```ts
server: { hmr: process.env.DISABLE_HMR !== 'true' },
```
Habilita o Hot Module Replacement (atualização ao vivo no navegador durante desenvolvimento), podendo ser desativado pela variável de ambiente `DISABLE_HMR`.

```ts
build: { rollupOptions: { output: { manualChunks: { ... } } } }
```
Divide o bundle de produção em múltiplos arquivos separados. O navegador baixa e armazena em cache cada chunk independentemente — nas visitas seguintes, só recarrega o código que mudou.

- `react-vendor` → React e ReactDOM
- `motion` → biblioteca de animações
- `icons` → ícones Lucide
- `supabase` → SDK do banco de dados

---

## `src/main.tsx`

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import AuthGate from './AuthGate.tsx';
import './index.css';
```
Importa React, a função de inicialização, o componente raiz e os estilos globais.

```tsx
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthGate />
  </StrictMode>,
);
```
Encontra o `<div id="root">` no HTML e renderiza o React dentro dele. `StrictMode` ativa verificações extras durante o desenvolvimento para detectar problemas.

---

## `src/index.css`

```css
@import url('https://fonts.googleapis.com/...');
```
Carrega as fontes Inter (textos) e Outfit (títulos) do Google Fonts.

```css
@import "tailwindcss";
```
Ativa o Tailwind CSS v4.

```css
@theme { ... }
```
Define variáveis de design do projeto: fontes customizadas (`--font-sans`, `--font-display`) e as cores da marca (`--color-brand-red`, `--color-brand-dark`, `--color-brand-light`).

```css
@layer base { html { scroll-behavior: smooth; ... } }
```
Aplica scroll suave ao rolar a página, suavização de fontes e otimização de renderização de texto globalmente.

```css
:root { --bg-main, --text-main, --card-bg, --card-border, --header-bg }
```
Variáveis CSS do tema claro. Todos os componentes usam essas variáveis para que a troca de tema funcione instantaneamente.

```css
.dark { ... }
```
Sobrescreve as variáveis do tema com os valores do modo escuro. O JavaScript adiciona a classe `dark` ao `<html>` para ativar.

```css
body { background-color: var(--bg-main); color: var(--text-main); ... }
```
Define a cor de fundo e de texto padrão do site usando as variáveis de tema.

```css
.glass-card { background-color: var(--card-bg); backdrop-filter: blur(8px); ... }
```
Estilo base dos cartões com efeito de vidro fosco. `backdrop-filter: blur` desfoca o que está atrás do elemento. Usado em toda a interface.

```css
button, [role="button"] { -webkit-tap-highlight-color: transparent; }
```
Remove o destaque azul/cinza que aparece ao tocar em botões em dispositivos iOS/Android.

```css
.no-scrollbar { scrollbar-width: none; ... }
```
Esconde a barra de rolagem visualmente em navegadores que suportam isso, mantendo a rolagem funcional.

---

## `src/supabase.ts`

```ts
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
```
Lê as credenciais do Supabase das variáveis de ambiente do projeto (arquivo `.env`). Sem elas, o banco de dados não funciona, mas o site ainda abre.

```ts
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
```
Exporta um booleano indicando se o Supabase está configurado. Usado em várias partes do código para decidir se tenta conectar ao banco.

```ts
if (!isSupabaseConfigured) { console.warn(...) }
```
Avisa no console durante o desenvolvimento se as variáveis de ambiente não estão definidas.

```ts
export const supabase: SupabaseClient | null = isSupabaseConfigured ... ? createClient(...) : null;
```
Cria e exporta o cliente do Supabase se as credenciais existirem, ou exporta `null` se não existirem. Todo o código que usa o Supabase verifica se não é `null` antes de usá-lo.

---

## `src/auth.ts`

### Tipos

```ts
export type AuthUser = { id, name, email, createdAt }
```
Define a estrutura do usuário logado no app.

```ts
export type UserSettings = { theme, language, favoriteCategoryId, followedCategoryIds, followedTeamIds, followedDriverIds }
```
Define a estrutura das preferências do usuário salvas no banco.

### `mapUser(user)`

Converte o objeto bruto do Supabase para o formato `AuthUser` do app. O nome do usuário é extraído dos metadados (`display_name`) ou do email como fallback.

### `ensureUserSettingsRow(userId)`

Cria uma linha de configurações no banco quando um usuário se registra, usando `upsert` (insere se não existe, ignora se já existe).

### `getCurrentSession()`

Verifica se já existe uma sessão ativa no navegador (usuário já estava logado antes). Retorna o usuário ou `null`.

### `registerUser({ name, email, password })`

Cria uma conta nova no Supabase Auth. Valida nome, email e senha antes de tentar. Retorna `{ ok: true, user }` em caso de sucesso ou `{ ok: false, message }` em caso de erro.

### `loginUser({ email, password })`

Autentica o usuário com email e senha via Supabase. Retorna o mesmo padrão de `{ ok, ... }`.

### `logoutUser()`

Encerra a sessão do usuário no Supabase.

### `getUserSettings(userId)`

Busca as preferências salvas do usuário no banco (tema, idioma, categoria favorita, listas de seguidos). Retorna os dados normalizados ou `null`.

### `saveUserSettings(userId, settings)`

Salva as preferências atuais no banco usando `upsert` (cria ou atualiza). Chamado com debounce de 250ms no App para não sobrecarregar o banco com cada clique.

### `getAuthTheme()` / `setAuthTheme()`

Lê e salva o tema preferido no `localStorage` — usado antes da sessão carregar para evitar flash de tema errado.

---

## `src/types.ts`

Contém todos os dados estáticos do automobilismo. Exporta:

- **`Category`** — tipo que descreve uma categoria (F1, WEC, etc.) com todas as suas propriedades: nome, descrição, equipes, pilotos, calendário e classificação.
- **`MOTORSPORT_DATA`** — array com todos os dados de todas as categorias (F1, F2, F3, F1 Academy, Fórmula E, WEC, IMSA, DTM, GT World Challenge, IndyCar, NASCAR, WRC, Stock Car, Formula Truck).

Cada categoria contém:
- `id` → identificador único (ex: `'f1'`)
- `name`, `fullName` → nomes em português
- `enFullName`, `enDescription`, `enLongDescription` → versões em inglês
- `icon` → nome do ícone Lucide a usar
- `teams[]` → equipes com `id`, `name`, `color`, `car`, `class`
- `drivers[]` → pilotos com `id`, `name`, `teamId`, `number`, `nationality`, `image`
- `calendar[]` → corridas com `id`, `name`, `date`, `location`, `circuit`, `status`, `winner`
- `standings` → classificação atual (opcional), com `drivers[]`, `constructors[]` ou `teams[]`

---

## `src/lib/utils.ts`

```ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
```
Importa duas bibliotecas: `clsx` aceita qualquer mistura de strings, arrays e objetos para montar uma lista de classes; `twMerge` resolve conflitos entre classes Tailwind (ex: `p-2 p-4` → fica `p-4`).

```ts
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```
Exporta a função `cn()` usada em todo o projeto para combinar classes CSS de forma segura, com suporte a condicionais: `cn("base", isActive && "active", { hidden: !show })`.

---

## `src/AuthGate.tsx`

Componente raiz que envolve o `App`. Gerencia o estado de autenticação e exibe o modal de login/cadastro.

### Estado

- `user` → usuário logado ou `null`
- `bootLoading` → `true` enquanto verifica a sessão inicial
- `authOpen` → se o modal de login está aberto
- `mode` → `'login'` ou `'register'`
- `name`, `email`, `password` → campos do formulário
- `error` → mensagem de erro do servidor
- `busy` → `true` enquanto a requisição está em andamento

### `useEffect` (linha 20)

Ao montar, verifica se o usuário já tinha sessão ativa (`getCurrentSession()`). Se sim, preenche `user` e fecha o loading.

### `closeAuth()`

Fecha o modal e limpa o erro e a senha (mantém email por conveniência).

### `submit(e)`

Chamado ao enviar o formulário. Executa `loginUser` ou `registerUser` dependendo do `mode`. Se der erro, exibe a mensagem. Se der certo, busca a sessão atualizada e fecha o modal.

### Renderização

- **Loading**: Exibe `"Carregando..."` enquanto a sessão inicial é verificada.
- **App**: Sempre renderiza o `App`, passando `currentUser`, `onLoginRequest` (abre o modal) e `onLogout` (chama `logoutUser` e limpa o estado).
- **Modal**: Renderizado fora do `App` com `z-[120]` para ficar acima de tudo. Contém o toggle Login/Cadastro e o formulário com os campos necessários.

---

## `src/App.tsx`

O componente principal. Contém toda a interface: header, home, página de categoria, footer e modal de regras.

### Constantes de módulo (fora do componente)

```ts
const IconMap
```
Mapa de nome → componente de ícone. Permite usar `cat.icon` (string dos dados) para renderizar o ícone correto.

```ts
const SPRING = { type: 'spring', stiffness: 380, damping: 32 }
const SPRING_SOFT = { type: 'spring', stiffness: 280, damping: 28 }
```
Configurações de animação spring reutilizadas. `SPRING` é mais rígido e rápido; `SPRING_SOFT` é mais suave para expansões de altura.

```ts
const CATEGORY_BY_ID = new Map(MOTORSPORT_DATA.map(c => [c.id, c]))
```
Índice das categorias por ID. Criado uma vez na inicialização do módulo. Permite buscar qualquer categoria em O(1) em vez de percorrer o array inteiro a cada render.

```ts
const NAV_GROUPS
```
Define os grupos do menu de navegação, com os IDs das categorias que pertencem a cada grupo.

```ts
const UI_TRANSLATIONS
```
Objeto com todas as strings da interface em português e inglês. Acessado como `UI_TRANSLATIONS[language].chave` em todo o JSX.

### Props do componente

```ts
type AppProps = { currentUser, onLogout, onLoginRequest }
```
- `currentUser` → usuário logado ou `null`, vindo do `AuthGate`
- `onLogout` → função para deslogar, definida no `AuthGate`
- `onLoginRequest` → abre o modal de login no `AuthGate`

### Estado do componente

| State | Tipo | Descrição |
|---|---|---|
| `language` | `'pt' \| 'en'` | Idioma ativo da interface |
| `isDarkMode` | `boolean` | Modo escuro ativo ou não |
| `isMobileMenuOpen` | `boolean` | Menu hambúrguer aberto |
| `activeDropdown` | `string \| null` | Qual grupo do nav tem dropdown visível |
| `view` | `'home' \| 'category'` | Qual "página" está sendo exibida |
| `selectedCategory` | `Category` | Categoria selecionada para ver detalhes |
| `activeTab` | `string` | Aba ativa na página de categoria |
| `showRules` | `boolean` | Modal de regras visível |
| `expandedCategoryId` | `string \| null` | Card expandido na home |
| `settingsLoaded` | `boolean` | Se as configurações do usuário já foram carregadas |
| `followedCategoryIds` | `string[]` | IDs das categorias seguidas |
| `followedTeamIds` | `string[]` | IDs das equipes seguidas (formato `catId::teamId`) |
| `followedDriverIds` | `string[]` | IDs dos pilotos seguidos (formato `catId::driverId`) |

### Efeitos (`useEffect`)

**Efeito 1 — Carregar configurações do usuário**
Quando `currentUser` muda (login/logout), busca as configurações salvas no banco e aplica ao estado local. Usa flag `isMounted` para evitar atualizar o estado se o componente for desmontado antes da resposta chegar.

**Efeito 2 — Aplicar tema**
Quando `isDarkMode` muda, adiciona ou remove a classe `dark` do `<html>`, ativando o tema escuro via CSS.

**Efeito 3 — Salvar configurações com debounce**
Sempre que o usuário muda idioma, tema ou listas de seguidos, espera 250ms e salva no banco. O debounce evita muitas requisições seguidas ao banco.

**Efeito 4 — Fechar card expandido ao clicar fora**
Quando um card está expandido, adiciona um listener de clique global no `window`. O primeiro clique fora do card (que não foi parado por `e.stopPropagation()`) fecha o card.

### Handlers (com `useCallback`)

**`handleCategorySelect(cat)`**
Navega para a página de categoria: reseta o card expandido, define a categoria e a view, fecha menus abertos, e rola para o topo sincronizado com o próximo frame de pintura (`requestAnimationFrame`).

**`toggleFollowCategory(categoryId)`**
Adiciona ou remove uma categoria da lista de seguidos. Verifica login antes.

**`toggleFollowTeam(categoryId, teamId)`**
Adiciona ou remove uma equipe. A chave é `catId::teamId` para saber de qual categoria aquela equipe pertence.

**`toggleFollowDriver(categoryId, driverId)`**
Mesmo padrão de `toggleFollowTeam`, mas para pilotos.

### Valores computados (com `useMemo`)

| Memo | Dependências | Descrição |
|---|---|---|
| `followedCategorySet` | `followedCategoryIds` | Set para verificação O(1) de categoria seguida |
| `followedTeamSet` | `followedTeamIds` | Set para verificação O(1) de equipe seguida |
| `followedDriverSet` | `followedDriverIds` | Set para verificação O(1) de piloto seguido |
| `upcomingFollowedRaces` | três listas de seguidos | Próximas corridas das categorias/equipes/pilotos que o usuário segue, ordenadas por data |
| `nextUpcomingRace` | `selectedCategory.calendar` | Próxima corrida da categoria selecionada |
| `teamClasses` | `selectedCategory.teams` | Lista de classes únicas das equipes (ex: LMH, LMGT3) |
| `driversByTeamId` | `selectedCategory.drivers` | Map de `teamId → pilotos` para busca O(1) na aba Equipes |
| `driverByName` | `selectedCategory.drivers` | Map de `nome → piloto` para busca O(1) na aba Calendário (vencedor) |

### Estrutura do JSX renderizado

#### Header (`<header>`)
- `sticky top-0 z-50` → fica fixo no topo durante o scroll, acima de todo conteúdo
- `backdrop-blur-xl` → efeito de vidro translúcido no header
- Layout interno usa `flex` com três seções sem sobreposição:
  - **Logo** → `shrink-0` à esquerda, botão que volta para a home
  - **Nav desktop** → `hidden xl:flex flex-1 justify-center` — ocupa todo o espaço do meio e centraliza os itens, visível apenas em telas ≥ 1280px. Contém botão Início + separador + grupos com dropdown
  - **Controles** → `ml-auto xl:ml-0 shrink-0` — no mobile fica à direita via `ml-auto`; no desktop fica naturalmente após a nav
- **Dropdown** → `AnimatePresence` com `motion.div` que anima entrada/saída ao hover. Posicionado com `left-0` (alinhado à esquerda do gatilho) e `z-[200]` (garante que sempre aparece acima de qualquer conteúdo da página)
- **Widget de usuário** (`hidden xl:flex`) → visível em telas ≥ 1280px quando logado: inicial em círculo vermelho + nome truncado + botão Sair
- **Botão login** (`hidden xl:flex`) → visível em telas ≥ 1280px quando deslogado
- **Hambúrguer** (`xl:hidden`) → visível apenas em mobile/tablet

#### Menu Mobile (`AnimatePresence` + `motion.div`)
- Abre com animação de altura (0 → auto) com spring suave; `overflow-hidden` na div animada para clipar durante a transição
- Seção de usuário no topo: se logado mostra avatar + nome + email + botão Sair; se deslogado mostra botão Entrar
- Botão Início em linha completa
- Grupos de categorias: título com linhas decorativas laterais, lista de categorias com ícone e seta; todos os elementos têm `shrink-0` para não distorcer em nomes longos

#### Main — Home (`view === 'home'`)
- Título "PitStopHub" com animação de entrada spring
- Seção de próximas corridas seguidas (só para usuários logados)
- Grupos de categorias com animação staggered (cada grupo aparece com 70ms de delay)
- Cards de categoria: div com CSS hover (scale 102%, active 98%), efeito de vidro, ícone e nome. Ao clicar uma vez expande com `AnimatePresence`; ao clicar novamente navega para a categoria

#### Main — Categoria (`view === 'category'`)
- **Hero** com nome grande, descrição, botões de seguir/calendário/regras, e card da próxima corrida rotacionado 3°
- **Abas** (Visão Geral, Equipes, Calendário, Classificação) com `AnimatePresence mode="wait"` para transição entre elas
- **Aba Visão Geral**: cards com número de equipes, pilotos e etapas, mais descrição longa
- **Aba Equipes**: agrupadas por classe, cada equipe com cor, nome, carro e lista de pilotos com foto, número, botão de seguir
- **Aba Calendário**: tabela de corridas com data, nome, local, circuito, status e vencedor
- **Aba Classificação**: tabela de pilotos, construtores ou equipes dependendo do que a categoria tem

#### Footer
- Logo, copyright, links rápidos para todas as categorias
- Controles de idioma (PT/EN) e tema (claro/escuro)

#### Modal de Regras (`AnimatePresence`)
- `z-[100]` para ficar acima do header mas abaixo do modal de login
- Backdrop escuro com blur ao clicar fecha o modal
- Exibe o `longDescription` da categoria selecionada
