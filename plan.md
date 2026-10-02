# GastoCerto — plano de implementação

## Escopo e decisão de plataforma

O produto será um aplicativo Expo/React Native com foco em **celular em retrato e uso com uma mão**, mas com a mesma base renderizando no Expo Web para uso em PC. O starter móvel gerenciado permanece intacto: Metro/Expo Web em 8081, API Express em 3000, TypeScript, NativeWind, Drizzle e banco MySQL gerenciado.

O fluxo de integração C6 será preparado por Open Finance através da Pluggy: as credenciais ficam exclusivamente no servidor; o app solicita um Connect Token e abre o fluxo do provedor. Na ausência de credenciais, o usuário pode explorar o modo demonstração e importar OFX/CSV do C6. A experiência não finge estar conectada: mostra claramente o estado da conexão e o próximo passo.

## Direção de produto

- Home com resposta imediata para “quanto posso gastar?” e “sobrou ou faltou?”;
- lançamentos manuais rápidos, em poucos campos;
- análise por categoria com barras e percentuais, orçamento e diagnóstico em linguagem simples;
- fatura do cartão separada do fluxo de caixa;
- integrações e importação em uma tela curta, com sincronização manual visível.

## Direção visual

**Movimento:** dashboard financeiro editorial / neo-brutalismo suave, traduzido para um app escuro e calmo.

**Princípios:** hierarquia numérica forte; contraste sem ruído; cartões como blocos de decisão; ações com feedback curto e explícito.

**Filosofia de cor:** base grafite quase preta para reduzir a sensação de planilha; verde-lima “Pulse” para saldo e ações positivas; âmbar para alertas de orçamento; coral reservado para excesso/saída. A cor principal é o verde-lima próprio do GastoCerto (#C7F36B), que sinaliza controle sem parecer um banco.

**Paradigma de layout:** uma coluna vertical com um “painel de comando” no topo e trilhas de detalhe abaixo; no PC, a coluna continua compacta e recebe mais respiro, sem virar uma grade de cards genérica.

**Elementos assinatura:** marca em forma de “C” com seta ascendente; cápsula de status de sincronização; barras de orçamento com trilho escuro e porcentagem alinhada à direita.

**Interação:** toque sempre revela consequência: adicionar lançamento atualiza o saldo; sincronizar retorna quantos lançamentos chegaram; trocar mês altera todos os números. Ações destrutivas pedem confirmação controlada.

**Animação:** entrada suave do painel; barras crescem em 220ms; feedback de sync usa mudança de ícone/texto, sem loops chamativos. Respeitar reduced motion quando o ambiente oferecer.

**Tipografia:** System/Inter-like para leitura rápida; títulos em peso 800, números em 800, labels em 500 e caixa alta apenas para metadados curtos.

**Essência:** “Seu dinheiro explicado em uma tela, sem culpa e sem planilha.” Personalidade: direto, cuidadoso, encorajador.

**Voz:** headlines curtas e honestas; CTAs verbais e concretos. Exemplos: “Você está no controle.” / “Adicionar gasto agora”.

**Wordmark/logo:** um monograma “G” formado por um círculo aberto e uma seta diagonal ascendente, acompanhado do wordmark GastoCerto.

## Arquitetura e estrutura

- `app/(tabs)/_layout.tsx`: navegação inferior Home, Lançamentos, Planejar e Conectar.
- `app/(tabs)/index.tsx`: painel mensal, saldo, fatura, análise, diagnóstico e últimos lançamentos.
- `app/(tabs)/entries.tsx`: lista, filtros, cadastro manual, edição/exclusão e parcelamento.
- `app/(tabs)/planning.tsx`: renda mensal e limites de categoria.
- `app/(tabs)/connect.tsx`: conexão C6 via Open Finance/Pluggy, sincronização e importação OFX/CSV em modo demonstrativo.
- `lib/finance-store.ts`: tipos, dados demonstrativos e persistência local AsyncStorage; camada futura para hidratar/mesclar o backend.
- `server/routers.ts`, `server/db.ts`, `drizzle/schema.ts`: tabelas e endpoints de lançamentos, metas, conexão e sincronização; Pluggy permanece server-side.
- `assets/images/*`: identidade visual e ícones nativos.

## Dados e integrações

O banco gerenciado mantém lançamentos, categorias/orçamentos, perfil mensal, conexões e cursor de sincronização. Os dados fictícios e lançamentos manuais continuam disponíveis localmente para o primeiro uso. O endpoint de sincronização usa `PLUGGY_CLIENT_ID` e `PLUGGY_CLIENT_SECRET` quando configurados, seguindo o fluxo API Key → Connect Token/Item → transações; sem essas chaves, responde com estado de configuração pendente e preserva o modo demonstração.

## Entrega

A aplicação será entregue como código do projeto mobile gerenciado, com Preview web verificável no PC e QR/Expo Go preparado para celular. A publicação não será ativada automaticamente.
