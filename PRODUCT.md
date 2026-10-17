# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
Fãs de automobilismo, principalmente brasileiros (interface em português e inglês), que acompanham mais de uma categoria ao mesmo tempo, não só a Fórmula 1. Abrem o site no celular (PWA instalado ou navegador) e no computador, em proporção parecida, e o produto precisa funcionar bem nos dois.

Os trabalhos que fazem ali: saber qual é a próxima corrida de cada categoria e a que horas ela acontece no seu fuso; ver a classificação e o grid da temporada; abrir o perfil de um piloto, de uma equipe ou de uma corrida; entender como a categoria funciona (formato do fim de semana, pontuação, regras); seguir categorias, equipes e pilotos e receber avisos.

O site é uma versão web aberta ao público, para quem não instala o app Android: não é página de apresentação do app nem uso restrito a conhecidos.

## Product Purpose
PitStopHub reúne em um só lugar 14 categorias do automobilismo (Fórmula 1, F2, F3, F1 Academy, IndyCar, NASCAR, WEC, IMSA, DTM, GT World Challenge Europa/América/Ásia, Endurance Brasil e WRC): calendário, resultados, classificação, grid, perfis, previsão do tempo da corrida e um guia de regras por categoria. Existe para que alguém acompanhe o automobilismo inteiro sem abrir um site por categoria e sem precisar já entender cada regulamento. Sucesso é a pessoa saber o que vem a seguir e entender o que está vendo.

## Positioning
Cobre séries que os sites de F1 ignoram ou tratam como secundárias (Endurance Brasil, WEC, IMSA, GT World Challenge, DTM, WRC) ao lado da F1, em português, com horários no fuso de quem abre e com o guia "Como funciona" de cada categoria. A mesma conta, os mesmos favoritos e os mesmos dados valem no site e no app Android.

## Operating Context
- Dados: F1 ao vivo pela Jolpica; GT World Challenge e Endurance Brasil pela api-motorsports (projeto próprio); F2, F3, DTM, WRC e demais categorias pelo Supabase, alimentado todo dia pelo repositório `pitstophub-data` (TheSportsDB); previsão do tempo pela Open-Meteo; catálogo estático (pilotos, equipes, biografias, circuitos, regras, campeões) como base e plano B.
- Contas e favoritos: Supabase Auth e a tabela `user_settings`, compartilhados com o app Android.
- Hospedagem: Vercel (produção em pitstophub.vercel.app, site de teste em pitstophub-teste.vercel.app). Código em `ailtoncja/pitstophub`, branch `main`.
- Existe o app Android nativo (repositório `pitstophub-android`) com a mesma informação.

## Capabilities and Constraints
- Idiomas: português (padrão) e inglês. Horários mostrados no fuso do aparelho.
- Funcionalidades confirmadas: escolha de categoria que comanda Início, Calendário, Classificação e Grid; menu de categorias; páginas de piloto, equipe, corrida (com circuito, clima e sessões), campeões da F1, busca, favoritos com prioridade, alertas, exportar corridas para a agenda (.ics), página "Como funciona" por categoria, instalação como PWA.
- Retirado de propósito, não reintroduzir sem o dono pedir: seção de notícias; notificações push do site (as chaves se perderam; o app Android usa avisos locais); página de privacidade e exclusão de conta (guardadas em `pitstophub-playstore-arquivo` para uma futura publicação na Play Store).
- Limites dos dados: a classificação de WEC, IMSA, IndyCar, NASCAR e F1 Academy vem do catálogo estático e pode estar desatualizada; só F1, F2, F3, DTM, WRC e as GT têm classificação ao vivo. Previsão do tempo só para corridas até uns 15 dias à frente e só quando há coordenadas (F1).
- Técnico: React 19, Vite, Tailwind v4, React Router, Supabase JS; PWA com service worker; tipografia Archivo (uma família só). O CSP do `vercel.json` restringe scripts a `'self'` e imagens a hosts listados.
- Easter eggs de homenagem a pessoas queridas do dono (Thata, Nay, Lucas e Brunão) são parte do produto e devem ser preservados com os mesmos gatilhos: 5 toques na foto do Hamilton, segurar essa foto por 5 s, 5 toques na marca no rodapé e 5 toques no brasão da equipe AF Corse (WEC).
- Sem vínculo com a Fórmula 1, a FIA, equipes ou pilotos: é um projeto independente e não oficial.

## Brand Commitments
Nome PitStopHub (escrito assim). Logo em escudo com capacete e carro, com a marca "pitstophub" em vermelho, preto e branco (`public/icons/source.png`). O vermelho de corrida #E10600 é a cor de marca. O dono já usou como referência as telas do Stitch ("Velocity Control") e o app Android; qualquer visual novo parte do produto, não obriga a mantê-los.

## Evidence on Hand
Conteúdo real e em volume: 14 categorias com equipes, pilotos, fotos, circuitos (24 mapas de pista em `public/circuits`), biografias, títulos, regras por categoria, galeria de campeões da F1 (`public/champions`) e dados ao vivo das fontes acima. Não existem depoimentos, números de audiência, avaliações nem material de imprensa: nada disso deve ser inventado.

## Product Principles
1. A próxima corrida vem primeiro: a pergunta "o que acontece a seguir e quando?" se responde sem rolar nem clicar, no fuso de quem olha.
2. Toda categoria é cidadã de primeira classe: a F1 não é o padrão que as outras tentam imitar.
3. Explicar o esporte: regras e formato de cada categoria ficam à mão, sem pressupor que a pessoa já conhece.
4. Dado honesto: quando a informação é estática, está desatualizada ou não existe, a tela diz isso em vez de parecer ao vivo.
5. Uma conta, um conjunto de dados: o que a pessoa segue vale igual no site e no app.

## Accessibility & Inclusion
Sem requisito específico confirmado pelo dono. Decisão em aberto: adotar um padrão (por exemplo WCAG 2.1 AA) para contraste, navegação por teclado e movimento reduzido.
