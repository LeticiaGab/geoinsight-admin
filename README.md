---

# 🌐 **Geo-Cidades — README Oficial**

Sistema desenvolvido para apoiar a **Revisão dos Planos Diretores Participativos Municipais**, permitindo a coleta, análise e visualização de dados territoriais, combinando tecnologias modernas de frontend, backend e serviços em nuvem.

---

# 📦 **Como Rodar o Projeto no Seu Computador**

## ✅ **Pré-requisitos**

Antes de iniciar, você precisa ter instalado:

* **Node.js** (recomendado: versão 18+)
* **npm**, **yarn**, **pnpm** ou **bun**
  → O projeto utiliza *bun.lockb*, então *Bun* é recomendado:

  ```sh
  curl -fsSL https://bun.sh/install | bash
  ```
* Acesso ao **Projeto no Supabase** (variáveis de ambiente)

---

## 🔧 **1. Clone o Repositório**

```sh
git clone <URL_DO_REPOSITORIO>
cd <NOME_DO_PROJETO>
```

---

## 📁 **2. Instale as Dependências**

Se estiver usando **Bun** (recomendado):

```sh
bun install
```

Ou use:

```sh
npm install
```

---

## 🔐 **3. Configure as Variáveis de Ambiente**

Crie um arquivo:

```sh
cp .env.example .env
```

E preencha com as chaves do Supabase:

```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=chave_anon
```

---

## 🚀 **4. Execute o Servidor de Desenvolvimento**

Com Bun:

```sh
bun dev
```

Ou:

```sh
npm run dev
```

O sistema abrirá em:

```
http://localhost:5173
```

---

## 🏁 **5. Build Para Produção**

```sh
bun run build
```

Os arquivos finais ficarão em `/dist`.

---

# 🧠 **Explicação Completa das Tecnologias Utilizadas**

## 🖥️ **FRONTEND**

O frontend é construído com uma stack moderna, focada em performance e acessibilidade.

---

## 🔹 **Core:**

### **React 18**

Biblioteca principal para construir interfaces dinâmicas, rápidas e modulares.

### **TypeScript**

Garante segurança de tipos, reduz erros e melhora a manutenção do código.

### **Vite**

Ferramenta extremamente rápida para desenvolvimento e build.

---

## 🔹 **Estilização & Design:**

### **Tailwind CSS**

Framework CSS utilitário para criar interfaces responsivas rapidamente.

### **shadcn/ui**

Coleção de componentes estilizados baseados em Radix UI.

### **Radix UI**

Componentes acessíveis e sem estilo, possibilitando criar uma UI consistente.

### **Lucide React**

Biblioteca moderna de ícones SVG.

### **Recharts**

Biblioteca de gráficos usada para visualizar dados urbanos.

### **Vaul (Drawer)**

Componente para criar *bottom sheets* e interações mobile-friendly.

### **Embla Carousel**

Cria carrosséis performáticos (útil para cards e galerias).

---

## 🔹 **Formulários e Validação:**

### **React Hook Form**

Controle leve e eficiente de formulários.

### **Zod**

Validação de schemas sincronizada com TypeScript.

### **@hookform/resolvers**

Ponte entre React Hook Form e Zod.

---

## 🔹 **Gerenciamento de Dados & Estado:**

### **TanStack React Query**

Gerencia cache, sincronização e estado de dados vindo do backend.

---

## 🔹 **Utilidades:**

* **date-fns** — manipulação de datas
* **clsx**, **tailwind-merge** — gerenciamento dinâmico de classes
* **react-resizable-panels** — layouts ajustáveis
* **next-themes** — gerenciamento de temas (dark/light)
* **Sonner** — sistema de notificações

---

# 🗄️ **BACKEND (Supabase)**

O projeto utiliza **Supabase**, uma plataforma Backend-as-a-Service que oferece:

---

## ⚙️ **Banco de Dados — PostgreSQL**

O Supabase fornece um Postgres totalmente gerenciado.

Tabelas principais do Geo-Cidades:

* `municipalities`
* `reports`
* `profiles`
* `user_roles`
* Outras tabelas auxiliares para auditoria e logs

### **RLS — Row Level Security**

Camada de segurança nativa do PostgreSQL que controla quem pode acessar cada dado.

---

## ⛓️ **Edge Functions (Serverless no Deno)**

### Funções utilizadas:

* `export-data` → exporta relatórios em CSV/PDF
* `seed-users` → cria usuários iniciais para o sistema
* `send-user-notification` → envia e-mails de notificação

Executadas com baixa latência diretamente na borda.

---

## ✉️ **Serviços Externos**

### **Resend**

Serviço usado para enviar:

* Notificações de criação
* Atualização
* Exclusão de registros

Integrado nas edge functions.

---

# 🔐 **Autenticação & Segurança**

### **Supabase Auth**

O sistema usa:

* Login por e-mail/senha
* Controle de sessão via localStorage
* Tokens JWT
* Fluxo de redefinição de senha

### **Controle de Acesso por Papéis (RBAC)**

Papéis disponíveis:

* **Administrador**
* **Pesquisador**
* **Analista**
* **Coordenador**

Cada papel possui permissões específicas controladas por políticas RLS.

---

# 🏛️ **Arquitetura do Projeto**

* Componentes React reutilizáveis e tipados
* Hooks personalizados (`useTheme`, `useDataExport`, `use-toast`, etc.)
* CSS tokens com variáveis semânticas
* Design responsivo + Mobile First
* Dark Mode como padrão
