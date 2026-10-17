---
version: 1
slug: "src-pages-homepage-tsx"
primary_target: "src/pages/HomePage.tsx"
related_targets: ["src/app/AppShell.tsx","src/pages/CategoryPage.tsx","src/pages/CalendarPage.tsx","src/pages/StandingsPage.tsx","src/pages/GridPage.tsx","src/components/ui.tsx"]
---

# Surface brief: PitStopHub, site inteiro (redesign)

## Escopo e modo
Site público inteiro (Início, Agenda, Categorias e a página de cada categoria com Calendário, Classificação, Grid e Como funciona, piloto, equipe, corrida, Campeões, busca/avisos/perfil). Modo Operate: a pessoa abre para saber o que acontece a seguir e para consultar dados. Celular e computador pesam igual. Substitui o visual "Telemetry Dark Speed" do site e do app; a identidade antiga é evidência e anti-referência.

## Visitante e tarefa
Fã de automobilismo, brasileiro na maioria, que acompanha várias categorias. Em segundos: qual a próxima largada de cada categoria, a que horas no seu fuso, e onde está cada campeonato. Depois: classificação, grid, perfis, "como funciona". Tem de poder fazer tudo isso no computador sem parecer o app esticado.

## Decisões de arquitetura
- A categoria vira lugar na URL e na tela: cada página de categoria tem o mesmo cabeçalho (nome, seguir, abas Resumo, Calendário, Classificação, Grid, Como funciona). Acabou a categoria escondida em estado global.
- Computador: trilho lateral fixo com Início, Agenda e as 14 categorias (agrupadas, com a forma do estado do dado). Celular: barra no topo e navegação inferior (Início, Agenda, Categorias, Perfil).
- Estado do dado vai na forma, não só na cor: linha cheia = ao vivo, tracejada = atualiza todo dia, meia linha = classificação do catálogo (pode estar desatualizada).
- Vermelho de marca reservado: só a próxima largada/ao vivo e o estado "seguindo". Equipes só aparecem como filete fino de dado, nunca como fundo (o dono pediu monocromático).

## Direction contract

THESIS: o PitStopHub é um reel das próximas largadas: uma corrida ocupa a tela inteira, a seguinte já está carregada logo abaixo, e quatro glifos empilhados à direita agem sobre ela. Recusa o arranjo padrão de portal esportivo (hero + chips + cartões iguais) e o app esticado.
OWN-WORLD: fundo preto de mídia; mídia sangrando até a borda (mapa do circuito sobre campo de cor da categoria, silhueta do carro quando não há mapa); só branco puro nos glifos e no texto, cinza só para apoio; Archivo em uma família só, sentença com peso 800 nas legendas, algarismos tabulares; botões redondos de 44 px, pílulas, raios grandes; vermelho #E10600 só para largada e seguir. Cada categoria tem um tom próprio que tinge só o campo do reel.
STORY: a pessoa entende em um olhar o que vem a seguir e a que horas, passa o dedo para a próxima, segue ou salva na agenda sem sair do lugar, e entra na categoria quando quer mais.
FIRST VIEWPORT: computador, trilho de 264 px à esquerda; coluna do reel cobrindo a altura com o item atual, título 56 px embaixo à esquerda, horário em 24 px, circuito e categoria abaixo, glifos Seguir, Agenda, Compartilhar e Abrir à direita, uma faixa "A seguir" de 80 px na base mostrando o próximo item; a partir de 1280 px, painel de 380 px com Classificação da categoria do item e Agenda das próximas largadas. Celular: o item preenche a tela menos a faixa "A seguir".
FORM: challenger 4 (superfície de mídia vertical em tela cheia), escolhido pelo dono no lugar da direção sorteada; seed: seed:8f0271b50da9e171. Movimento assinatura: encaixe vertical duro entre itens completos, o glifo ativo preenche; sem rolagem parcial no reel.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Decisões em aberto
- Tamanho final do reel no celular (item cheio vs. item com faixa) depende do teste em tela real.
- Imagens: usamos mapas de circuito e silhuetas já no projeto; fotos de pilotos só onde já existem.
