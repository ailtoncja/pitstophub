import type { Team } from './types';

export type TeamBio = { pt: string; en: string };

function b(pt: string, en: string): TeamBio {
  return { pt, en };
}

const PREMA = b(
  'A Prema Racing, fundada em 1983 em Grisignano di Zocco, na Itália, é uma das equipes de formação mais vitoriosas do automobilismo — de Charles Leclerc e Oscar Piastri a dezenas de títulos em F2, F3 e F4. O vermelho italiano segue como referência de ritmo e desenvolvimento de jovens talentos.',
  'Prema Racing, founded in 1983 in Grisignano di Zocco, Italy, is one of motorsport’s most successful junior teams — from Charles Leclerc and Oscar Piastri to dozens of F2, F3 and F4 titles. The Italian red remains a benchmark for pace and young-driver development.',
);

const CAMPOS = b(
  'A Campos Racing nasceu em 1998 com o ex-piloto de Fórmula 1 Adrián Campos, em Valência. A equipe espanhola formou nomes como Fernando Alonso ainda no kart/F3 e segue no grid das categorias de acesso da FIA, misturando rotina de fábrica com um olho permanente no salto para a F1.',
  'Campos Racing was founded in 1998 by former Formula 1 driver Adrián Campos, in Valencia. The Spanish team helped shape names such as Fernando Alonso in the junior ranks and remains on the FIA feeder-series grid, mixing a factory routine with a constant eye on the step up to F1.',
);

const MP = b(
  'A MP Motorsport, holandesa, cresceu das fórmulas de acesso europeias até se tornar presença fixa em F2, F3 e F1 Academy. A operação é conhecida por extrair rendimento consistente do pacote Dallara e por abrir espaço a talentos de vários continentes.',
  'Dutch squad MP Motorsport grew from the European junior formulae into a regular in F2, F3 and F1 Academy. The operation is known for extracting consistent pace from the Dallara package and for opening seats to talent from every continent.',
);

const RODIN = b(
  'A Rodin Motorsport, de capital neozelandês, herdou a estrutura da histórica Carlin e compete nas principais categorias de formação da FIA. O nome homenageia o projeto Rodin Cars, e a equipe aposta em um ambiente técnico fechado para acelerar estreantes.',
  'New Zealand-backed Rodin Motorsport inherited the historic Carlin operation and contests the FIA’s main junior championships. The name nods to the Rodin Cars project, and the team bets on a tightly run technical environment to accelerate rookies.',
);

const HITECH = b(
  'A Hitech, fundada no Reino Unido por David Hay, é uma das operações mais agressivas das fórmulas de acesso. Em 2026 segue no grid com a identidade Pulse-Eight — e, na F3, com o apoio da Toyota Gazoo Racing (TGR) no desenvolvimento de pilotos.',
  'Hitech, founded in the United Kingdom by David Hay, is one of the most aggressive operations in the junior formulae. In 2026 it remains on the grid under the Pulse-Eight identity — and, in F3, with Toyota Gazoo Racing (TGR) backing its driver development.',
);

const ART = b(
  'A ART Grand Prix, francesa, é uma das equipes mais tituladas da história da GP2/F2 e da F3: Lewis Hamilton, Nico Rosberg e Nico Hülkenberg passaram por ali. A operação de Nicolas Todt segue como escola clássica de setup e disciplina de fim de semana.',
  'France’s ART Grand Prix is one of the most decorated teams in GP2/F2 and F3 history: Lewis Hamilton, Nico Rosberg and Nico Hülkenberg all came through it. Nicolas Todt’s operation remains a classic school of setup work and weekend discipline.',
);

const DAMS = b(
  'A DAMS, fundada em 1988 por Jean-Paul Driot, é uma instituição francesa das fórmulas de acesso — campeã de GP2/F2 com nomes como Pastor Maldonado e Nyck de Vries. Em 2026 corre como DAMS Lucas Oil, mantendo a base em Le Mans.',
  'DAMS, founded in 1988 by Jean-Paul Driot, is a French junior-formulae institution — a GP2/F2 champion with names such as Pastor Maldonado and Nyck de Vries. In 2026 it races as DAMS Lucas Oil, still based in Le Mans.',
);

const TRIDENT = b(
  'A Trident, italiana, está no grid da F2 desde a era GP2 e é presença constante na F3. A equipe de San Pietro Mosezzo costuma misturar estreantes rápidos com um segundo carro mais experiente, e vive de acertar o ritmo de classificação.',
  'Italy’s Trident has been on the F2 grid since the GP2 era and is a constant in F3. The San Pietro Mosezzo team typically pairs a quick rookie with a more experienced second car, and lives or dies by qualifying pace.',
);

const AIX = b(
  'A AIX Racing é a continuação da operação que já passou por Charouz e PHM nas fórmulas de acesso. O time alemão busca estabilidade depois de várias mudanças de identidade, com foco em dar quilometragem a jovens do leste europeu e da Ásia.',
  'AIX Racing is the continuation of the operation that previously ran as Charouz and PHM in the junior formulae. The German team is chasing stability after several identity changes, with a focus on giving mileage to young drivers from Eastern Europe and Asia.',
);

const VAR = b(
  'A Van Amersfoort Racing, holandesa, é uma das escolas clássicas do kart e da F3 europeia — Max Verstappen deu seus primeiros passos de monoposto por ali. A VAR segue no grid de F2 e F3 com um estilo direto, de pouco marketing e muito acerto de pista.',
  'Dutch team Van Amersfoort Racing is one of the classic schools of karting and European F3 — Max Verstappen took his first single-seater steps there. VAR remains on the F2 and F3 grid with a straightforward style: little marketing, a lot of track setup.',
);

const INVICTA = b(
  'A Invicta Racing é a identidade comercial da Virtuosi nas cores douradas do patrocinador Invicta. A operação britânica já foi campeã de F2 com Stoffel Vandoorne e Nyck de Vries, e segue como uma das estruturas mais estáveis do grid.',
  'Invicta Racing is the commercial identity of Virtuosi in the gold colours of sponsor Invicta. The British operation has already been F2 champion with Stoffel Vandoorne and Nyck de Vries, and remains one of the most stable structures on the grid.',
);

function inSeries(base: TeamBio, ptTail: string, enTail: string): TeamBio {
  return b(`${base.pt} ${ptTail}`, `${base.en} ${enTail}`);
}

const PFAFF = b(
  'A Pfaff Motorsports, canadense, é uma das referências Porsche no IMSA, com títulos em GTD e passagens pela classe Pro. A operação de Ontario mistura programa de clientes e ambição de fábrica, sempre com o 911 GT3 R no centro do projeto.',
  'Canada’s Pfaff Motorsports is one of the IMSA Porsche benchmarks, with GTD titles and stints in the Pro class. The Ontario operation mixes a customer programme with factory ambition, always with the 911 GT3 R at the centre of the project.',
);

const VASSER_SULLIVAN = b(
  'A Vasser Sullivan Racing leva a Lexus ao IMSA em GTD e GTD Pro. Nascida da parceria de Jimmy Vasser e James Sullivan, a equipe californiana é o braço mais visível da marca japonesa no sportscar americano.',
  'Vasser Sullivan Racing takes Lexus into IMSA in both GTD and GTD Pro. Born from the partnership of Jimmy Vasser and James Sullivan, the Californian team is the Japanese brand’s most visible sportscar arm in America.',
);

const WINWARD = b(
  'A Winward Racing, operação germano-americana de Mercedes-AMG, corre no IMSA e no DTM com o GT3 Evo. O time é conhecido por alinhar gentleman drivers a profissionais de fábrica e por um acerto agressivo em classificação.',
  'Winward Racing, a German-American Mercedes-AMG operation, contests IMSA and DTM with the GT3 Evo. The team is known for pairing gentleman drivers with factory professionals and for an aggressive qualifying setup.',
);

const TRIARSI = b(
  'A Triarsi Competizione é uma equipe familiar americana de Ferrari, com base na Flórida. Corre no IMSA em GTD e GTD Pro com o 296 GT3, misturando tradição de clientes da marca de Maranello com um programa de endurance nos EUA.',
  'Triarsi Competizione is an American family-run Ferrari team, based in Florida. It contests IMSA in GTD and GTD Pro with the 296 GT3, mixing Maranello customer tradition with a U.S. endurance programme.',
);

const CAR_BLANCHE = b(
  'A Car Blanche é um programa americano de Mercedes-AMG no IMSA, presente em GTD e GTD Pro. O time aposta em um visual limpo e em um lineup misto para as provas longas do WeatherTech Championship.',
  'Car Blanche is an American Mercedes-AMG programme in IMSA, present in both GTD and GTD Pro. The team bets on a clean look and a mixed lineup for the WeatherTech Championship’s endurance races.',
);

const HEART_OF_RACING = b(
  'O Heart of Racing Team é o programa oficial da Aston Martin no IMSA e também aparece no WEC em LMGT3. Com o Vantage AMR GT3 Evo, a equipe americana mistura piloto de fábrica e endurance clássico, com forte presença em Daytona e Sebring.',
  'Heart of Racing Team is Aston Martin’s official IMSA programme and also appears in the WEC in LMGT3. With the Vantage AMR GT3 Evo, the American squad mixes factory drivers and classic endurance racing, with a strong presence at Daytona and Sebring.',
);

const AO_RACING = b(
  'A AO Racing, de Overland Park, é uma das equipes Porsche mais visíveis do IMSA graças ao 911 “Rexy”. O time compete em GTD Pro e GTD e virou favorito de torcida pelo visual e pelas 24 Horas de Daytona.',
  'AO Racing, from Overland Park, is one of the most visible Porsche teams in IMSA thanks to the “Rexy” 911. The squad contests GTD Pro and GTD and has become a fan favourite for its livery and its Daytona 24 Hours campaigns.',
);

const MANTHEY = b(
  'A Manthey Racing, de Meuspath, ao lado de Nürburgring, é a operação de clientes mais vitoriosa da Porsche em GT3. Além do Nordschleife, o time aparece no WEC, no IMSA e no DTM, quase sempre como referência de acerto do 911.',
  'Manthey Racing, from Meuspath beside the Nürburgring, is Porsche’s most successful GT3 customer operation. Beyond the Nordschleife, the team appears in the WEC, IMSA and DTM, almost always as the 911 setup benchmark.',
);

export const TEAM_BIOS: Record<string, TeamBio> = {
  'f1:mercedes': b(
    'A Mercedes-AMG Petronas está na Fórmula 1 como equipe de fábrica desde 2010 e dominou a era híbrida com oito títulos de construtores seguidos, entre 2014 e 2021. Em 2026, com o novo regulamento de motores, alinha George Russell e o fenômeno Kimi Antonelli no W17, tentando voltar ao topo depois de temporadas mais apertadas.',
    'Mercedes-AMG Petronas has been in Formula 1 as a works team since 2010 and dominated the hybrid era with eight consecutive constructors’ titles, from 2014 to 2021. In 2026, under the new engine regulations, it fields George Russell and prodigy Kimi Antonelli in the W17, chasing a return to the top after tighter seasons.',
  ),
  'f1:ferrari': b(
    'A Scuderia Ferrari é a única equipe presente em todas as temporadas da Fórmula 1 desde 1950, com 16 títulos de construtores e uma identidade inseparável do vermelho de Maranello. Em 2026 o SF-26 é guiado por Charles Leclerc e Lewis Hamilton, a dupla mais badalada da categoria, em busca do primeiro título mundial da equipe no século desde 2008.',
    'Scuderia Ferrari is the only team present in every Formula 1 season since 1950, with 16 constructors’ titles and an identity inseparable from Maranello red. In 2026 the SF-26 is driven by Charles Leclerc and Lewis Hamilton, the grid’s most-watched pairing, chasing the team’s first world title of the century since 2008.',
  ),
  'f1:mclaren': b(
    'A McLaren, fundada por Bruce McLaren em 1963, soma oito títulos de construtores e uma história que passa por Senna, Hunt e Hakkinen. Campeã de 2024 e 2025, chega a 2026 com o MCL40 e a dupla Lando Norris e Oscar Piastri, tentando se adaptar ao novo ciclo técnico sem perder a liderança recém-conquistada.',
    'McLaren, founded by Bruce McLaren in 1963, has eight constructors’ titles and a history that runs through Senna, Hunt and Häkkinen. Champion in 2024 and 2025, it arrives in 2026 with the MCL40 and the Lando Norris–Oscar Piastri pairing, trying to adapt to the new technical cycle without losing its newly won lead.',
  ),
  'f1:haas': b(
    'A Haas F1 Team, fundada por Gene Haas, estreou em 2016 como a primeira equipe americana na categoria no século. Opera em Banbury, no Reino Unido, com ligação técnica histórica à Ferrari. Em 2026 o VF-26 é guiado por Esteban Ocon e Oliver Bearman, num projeto de crescimento incremental.',
    'Haas F1 Team, founded by Gene Haas, debuted in 2016 as the first American team in the category this century. It operates out of Banbury, UK, with a historic technical link to Ferrari. In 2026 the VF-26 is driven by Esteban Ocon and Oliver Bearman, in a project of incremental growth.',
  ),
  'f1:alpine': b(
    'A Alpine é o braço de Fórmula 1 da Renault, herdeira dos títulos de 2005 e 2006 com Fernando Alonso. Com sede em Enstone e motores em Viry-Châtillon, a equipe francesa busca estabilidade depois de anos turbulentos. Em 2026 alinha Pierre Gasly e Franco Colapinto no A526.',
    'Alpine is Renault’s Formula 1 arm, heir to the 2005 and 2006 titles with Fernando Alonso. Based at Enstone with engines at Viry-Châtillon, the French team is chasing stability after turbulent years. In 2026 it fields Pierre Gasly and Franco Colapinto in the A526.',
  ),
  'f1:redbull': b(
    'A Red Bull Racing nasceu em 2005 sobre a antiga Jaguar e virou potência com Adrian Newey: seis títulos de construtores e a era Verstappen. Em 2026, já no ciclo pós-Newey e com motores próprios, alinha Max Verstappen e o promovido Isack Hadjar no RB22.',
    'Red Bull Racing was born in 2005 from the former Jaguar team and became a powerhouse with Adrian Newey: six constructors’ titles and the Verstappen era. In 2026, now in the post-Newey cycle and with its own engines, it fields Max Verstappen and promoted Isack Hadjar in the RB22.',
  ),
  'f1:rb': b(
    'A Racing Bulls é a segunda equipe do grupo Red Bull, sucessora de Toro Rosso, AlphaTauri e RB. Com base em Faenza, na Itália, serve de ponte para jovens do programa e de banco de testes. Em 2026 o VCARB 03 é guiado por Liam Lawson e Arvid Lindblad.',
    'Racing Bulls is the Red Bull group’s second team, successor to Toro Rosso, AlphaTauri and RB. Based in Faenza, Italy, it is a bridge for junior-programme drivers and a test bed. In 2026 the VCARB 03 is driven by Liam Lawson and Arvid Lindblad.',
  ),
  'f1:audi': b(
    'A Audi estreia como equipe de fábrica na Fórmula 1 em 2026, absorvendo a Sauber de Hinwil. O projeto alemão chega com o regulamento novo de motores e a dupla Nico Hülkenberg e Gabriel Bortoleto, o primeiro brasileiro titular na categoria desde 2017.',
    'Audi arrives as a Formula 1 works team in 2026, absorbing the Sauber operation in Hinwil. The German project lands with the new engine regulations and the pairing of Nico Hülkenberg and Gabriel Bortoleto, the first Brazilian race driver in the category since 2017.',
  ),
  'f1:williams': b(
    'A Williams, fundada por Frank Williams e Patrick Head em 1977, tem nove títulos de construtores e uma das histórias mais românticas da F1. Depois de anos no fundo do grid, o projeto de James Vowles tenta reconstruir a fábrica de Grove. Em 2026 o FW48 é de Carlos Sainz e Alexander Albon.',
    'Williams, founded by Frank Williams and Patrick Head in 1977, has nine constructors’ titles and one of F1’s most romantic histories. After years at the back of the grid, James Vowles’s project is trying to rebuild the Grove factory. In 2026 the FW48 belongs to Carlos Sainz and Alexander Albon.',
  ),
  'f1:cadillac': b(
    'A Cadillac entra na Fórmula 1 em 2026 como 11ª equipe, projeto da GM com a Andretti no DNA político da inscrição. É a primeira fabricante americana de fábrica na categoria moderna. O carro de estreia é guiado por Sergio Pérez e Valtteri Bottas.',
    'Cadillac joins Formula 1 in 2026 as the 11th team, a GM project with Andretti in the political DNA of the entry. It is the first American manufacturer to arrive as a works team in the modern era. The debut car is driven by Sergio Pérez and Valtteri Bottas.',
  ),
  'f1:astonmartin': b(
    'A Aston Martin voltou à Fórmula 1 em 2021 sobre a antiga Racing Point/Force India, com campus novo em Silverstone e motores Honda em 2026. Fernando Alonso e Lance Stroll guiam o AMR26, num projeto de longo prazo que ainda busca sua primeira vitória na era atual.',
    'Aston Martin returned to Formula 1 in 2021 on the former Racing Point/Force India entry, with a new campus at Silverstone and Honda engines in 2026. Fernando Alonso and Lance Stroll drive the AMR26, in a long-term project still chasing its first win of the current era.',
  ),

  'f2:invicta': INVICTA,
  'f2:campos': inSeries(CAMPOS, 'Na F2 de 2026, é uma das estruturas mais regulares do grid.', 'In the 2026 F2 season, it is one of the most consistent structures on the grid.'),
  'f2:mp': inSeries(MP, 'Na F2, costuma brigar no pelotão da frente quando o acerto de classificação entra na janela.', 'In F2, it usually fights at the front of the midfield when the qualifying setup falls into the window.'),
  'f2:prema': inSeries(PREMA, 'Na F2, segue como uma das favoritas naturais ao título de equipes.', 'In F2, it remains a natural favourite for the teams’ title.'),
  'f2:rodin': inSeries(RODIN, 'Na F2 de 2026, o pacote Dallara da equipe busca se firmar no grupo da frente.', 'In 2026 F2, the team’s Dallara package is chasing a foothold among the front-runners.'),
  'f2:hitech': inSeries(HITECH, 'Na F2, a Hitech Pulse-Eight costuma ser imprevisível: um fim de semana de pole, outro de recuperação.', 'In F2, Hitech Pulse-Eight is often unpredictable: one weekend on pole, the next spent recovering.'),
  'f2:art': inSeries(ART, 'Na F2, a ART continua sendo o endereço clássico de quem chega da F3 com fome de título.', 'In F2, ART remains the classic address for drivers arriving from F3 hungry for a title.'),
  'f2:dams': inSeries(DAMS, 'Na F2 de 2026, a DAMS Lucas Oil tenta reencontrar o ritmo de suas temporadas de título.', 'In 2026 F2, DAMS Lucas Oil is trying to rediscover the rhythm of its title-winning seasons.'),
  'f2:trident': inSeries(TRIDENT, 'Na F2, vive de classificar bem no sábado e gerenciar o desgaste do pneu no domingo.', 'In F2, it lives by qualifying well on Saturday and managing tyre wear on Sunday.'),
  'f2:aix': inSeries(AIX, 'Na F2, a AIX ainda constrói consistência corrida a corrida.', 'In F2, AIX is still building consistency race by race.'),
  'f2:var': inSeries(VAR, 'Na F2, a Van Amersfoort Racing leva o mesmo espírito direto da F3 para o segundo degrau da pirâmide.', 'In F2, Van Amersfoort Racing takes the same straightforward F3 spirit onto the second step of the ladder.'),

  'f3:prema-f3': inSeries(PREMA, 'Na F3 de 2026, continua sendo o time a ser batido no grid Dallara 2025.', 'In 2026 F3, it remains the team to beat on the 2025-spec Dallara grid.'),
  'f3:trident-f3': inSeries(TRIDENT, 'Na F3, a Trident costuma aparecer forte em circuitos de classificação, como Silverstone e Monza.', 'In F3, Trident often looks strong at qualifying circuits such as Silverstone and Monza.'),
  'f3:art-f3': inSeries(ART, 'Na F3, a ART Grand Prix segue como escola de referência para a F2.', 'In F3, ART Grand Prix remains a reference school for F2.'),
  'f3:campos-f3': inSeries(CAMPOS, 'Na F3 de 2026, a Campos mistura estreantes com um carro já conhecido da casa.', 'In 2026 F3, Campos mixes rookies with a car the team already knows well.'),
  'f3:hitech-f3': inSeries(HITECH, 'Na F3, o pacote Hitech TGR entra no grupo que briga por poles e sprints.', 'In F3, the Hitech TGR package sits in the group fighting for poles and sprint wins.'),
  'f3:mp-f3': inSeries(MP, 'Na F3, a MP Motorsport costuma ser regular nas duas corridas do fim de semana.', 'In F3, MP Motorsport is usually consistent across both weekend races.'),
  'f3:var-f3': inSeries(VAR, 'Na F3, a VAR continua fiel ao estilo holandês de pouco holofote e muito dado de pista.', 'In F3, VAR stays true to the Dutch style of little spotlight and a lot of track data.'),
  'f3:rodin-f3': inSeries(RODIN, 'Na F3 de 2026, a Rodin usa o grid como vitrine para sua operação global de formação.', 'In 2026 F3, Rodin uses the grid as a showcase for its global junior operation.'),
  'f3:aix-f3': inSeries(AIX, 'Na F3, a AIX Racing dá quilometragem a uma geração nova no Dallara 2025.', 'In F3, AIX Racing is giving mileage to a new generation in the 2025 Dallara.'),
  'f3:dams-f3': inSeries(DAMS, 'Na F3, a DAMS Lucas Oil leva a tradição de Le Mans para o terceiro degrau da pirâmide FIA.', 'In F3, DAMS Lucas Oil takes its Le Mans tradition onto the third step of the FIA ladder.'),

  'f1-academy:prema-academy': inSeries(PREMA, 'Na F1 Academy, a Prema é presença de fábrica no grid Tatuus F4, formando a próxima geração de mulheres no monoposto.', 'In F1 Academy, Prema is a works presence on the Tatuus F4 grid, developing the next generation of women in single-seaters.'),
  'f1-academy:campos-academy': inSeries(CAMPOS, 'Na F1 Academy, a Campos Racing leva a escola espanhola para o campeonato exclusivo da F1.', 'In F1 Academy, Campos Racing takes the Spanish school into F1’s dedicated championship.'),
  'f1-academy:mp-academy': inSeries(MP, 'Na F1 Academy, a MP Motorsport replica no Tatuus o mesmo método direto que usa na F2 e na F3.', 'In F1 Academy, MP Motorsport replicates on the Tatuus the same straightforward method it uses in F2 and F3.'),
  'f1-academy:rodin-academy': inSeries(RODIN, 'Na F1 Academy, a Rodin Motorsport amplia o programa de formação para o grid feminino da F1.', 'In F1 Academy, Rodin Motorsport extends its junior programme onto F1’s female grid.'),
  'f1-academy:art-academy': inSeries(ART, 'Na F1 Academy, a ART Grand Prix aplica décadas de F3/F2 ao Tatuus F4-T421.', 'In F1 Academy, ART Grand Prix applies decades of F3/F2 know-how to the Tatuus F4-T421.'),
  'f1-academy:hitech-academy': inSeries(HITECH, 'Na F1 Academy, a Hitech Pulse-Eight entra como uma das estruturas britânicas do pelotão.', 'In F1 Academy, Hitech Pulse-Eight lines up as one of the British structures in the field.'),

  'wec:toyota-racing': b(
    'A Toyota Gazoo Racing é a potência do WEC na era Hypercar: pentacampeã mundial recente e dona de uma sequência histórica em Le Mans com o GR010 Hybrid. O prototipo japonês segue como o carro a ser batido em ritmo de prova longa.',
    'Toyota Gazoo Racing is the WEC’s Hypercar powerhouse: a recent run of world titles and a historic Le Mans streak with the GR010 Hybrid. The Japanese prototype remains the car to beat over a full endurance distance.',
  ),
  'wec:cadillac-jota': b(
    'A Cadillac Hertz Team Jota une a fábrica americana ao expertise britânico da Jota Sport no V-Series.R. O programa é um dos mais competitivos do Hypercar fora das marcas japonesas e italianas, com olho permanente em Le Mans.',
    'Cadillac Hertz Team Jota pairs the American factory with British Jota Sport expertise on the V-Series.R. The programme is one of the most competitive Hypercar entries outside the Japanese and Italian marques, with a permanent eye on Le Mans.',
  ),
  'wec:bmw-wrt': b(
    'A BMW M Team WRT leva o M Hybrid V8 ao WEC com a estrutura belga da WRT, campeã de GT3 e agora no protótipo de Stuttgart–Munique. O time mistura disciplina de fábrica alemã com o feeling de endurance da casa de WRT.',
    'BMW M Team WRT takes the M Hybrid V8 to the WEC with the Belgian WRT organisation, a GT3 champion now running the Stuttgart–Munich prototype. The team mixes German factory discipline with WRT’s endurance feel.',
  ),
  'wec:ferrari-af': b(
    'A Ferrari AF Corse é o programa de fábrica da 499P, bicampeã de Le Mans em 2023 e 2024. A parceria entre Maranello e a AF Corse de Amato Ferrari devolveu a Ferrari ao topo dos protótipos depois de décadas afastada da classe principal.',
    'Ferrari AF Corse is the works 499P programme, Le Mans winner in 2023 and 2024. The partnership between Maranello and Amato Ferrari’s AF Corse returned Ferrari to the top of prototype racing after decades away from the top class.',
  ),
  'wec:genesis-magma': b(
    'A Genesis Magma Racing é o projeto de endurance da marca premium da Hyundai, estreando no Hypercar com um LMDh. O time coreano chega ao WEC para construir um programa de longo prazo, ainda em fase de aprendizado na classe principal.',
    'Genesis Magma Racing is the endurance project of Hyundai’s premium brand, arriving in Hypercar with an LMDh. The Korean team joins the WEC to build a long-term programme, still in a learning phase in the top class.',
  ),
  'wec:alpine-endurance': b(
    'A Alpine Endurance Team corre com o A424, o LMDh francês da marca de Dieppe. Depois de anos no LMP2, a Alpine voltou à classe principal do WEC para brigar com as fábricas alemãs e japonesas em Le Mans.',
    'Alpine Endurance Team races the A424, the French brand’s LMDh from Dieppe. After years in LMP2, Alpine returned to the WEC’s top class to fight the German and Japanese factories at Le Mans.',
  ),
  'wec:aston-martin-thor': b(
    'A Aston Martin Thor Team leva a Valkyrie AMR-LMH ao WEC, um Hypercar de arquitetura diferente dos LMDh rivais. O programa britânico, com a THOR, tenta transformar o halo car de rua em arma de endurance.',
    'Aston Martin Thor Team takes the Valkyrie AMR-LMH to the WEC, a Hypercar of a different architecture from rival LMDhs. The British programme, with THOR, is trying to turn the road-going halo car into an endurance weapon.',
  ),
  'wec:af-corse-wec': b(
    'A AF Corse, de Piacenza, é a equipe cliente mais ligada à Ferrari no mundo: décadas de GT e, agora, a 499P também em um segundo carro no Hypercar. O time de Amato Ferrari é o braço operacional da marca no WEC além do programa oficial.',
    'AF Corse, from Piacenza, is the customer team most closely tied to Ferrari worldwide: decades of GT racing and, now, a 499P as a second Hypercar. Amato Ferrari’s squad is the brand’s operational arm in the WEC beyond the works programme.',
  ),
  'wec:peugeot-totalenergies': b(
    'A Peugeot TotalEnergies voltou a Le Mans com o 9X8, um Hypercar de visual radical e motor V6 híbrido. O programa francês busca regularidade depois de um início difícil, ainda caçando o primeiro grande resultado na era atual.',
    'Peugeot TotalEnergies returned to Le Mans with the 9X8, a radical-looking Hypercar with a hybrid V6. The French programme is chasing consistency after a difficult start, still hunting its first major result of the current era.',
  ),
  'wec:garage-59': b(
    'A Garage 59, britânica, é uma das operações McLaren mais respeitadas do GT3 europeu. No WEC corre em LMGT3 com o 720S Evo, levando para as 24 Horas o mesmo pacote que já brilhou no GT World Challenge.',
    'Britain’s Garage 59 is one of the most respected McLaren GT3 operations in Europe. In the WEC it contests LMGT3 with the 720S Evo, taking to the 24 Hours the same package that has already shone in GT World Challenge.',
  ),
  'wec:vista-af': b(
    'A Vista AF Corse é o programa LMGT3 da AF Corse com a Ferrari 296. O time italiano transfere para a classe de GT o mesmo método de fábrica que usa no Hypercar, com gentleman drivers ao lado de oficiais da marca.',
    'Vista AF Corse is AF Corse’s LMGT3 programme with the Ferrari 296. The Italian team transfers to the GT class the same works method it uses in Hypercar, pairing gentleman drivers with factory professionals.',
  ),
  'wec:heart-of-racing': HEART_OF_RACING,
  'wec:team-wrt-gt3': b(
    'A Team WRT, belga, é pentacampeã do GT World Challenge e braço da BMW no WEC em LMGT3 com o M4 GT3. Poucas equipes no mundo equilibram tão bem programa de clientes e ritmo de fábrica.',
    'Belgium’s Team WRT is a multiple GT World Challenge champion and BMW’s WEC LMGT3 arm with the M4 GT3. Few teams in the world balance a customer programme and works pace so well.',
  ),
  'wec:tf-sport': b(
    'A TF Sport, britânica, fez nome com Aston Martin e hoje corre no WEC em LMGT3 com a Chevrolet Corvette Z06 GT3.R. O time de Tom Ferrier é especialista em provas longas e em gerenciar o desgaste em Le Mans.',
    'Britain’s TF Sport made its name with Aston Martin and now contests the WEC in LMGT3 with the Chevrolet Corvette Z06 GT3.R. Tom Ferrier’s team specialises in long races and managing wear at Le Mans.',
  ),
  'wec:racing-team-turkey': b(
    'A Racing Team Turkey by TF é o programa turco associado à TF Sport no WEC, também com a Corvette Z06 GT3.R. Leva as cores da Turquia ao grid de LMGT3 e compartilha engenharia com a operação britânica.',
    'Racing Team Turkey by TF is the Turkish programme associated with TF Sport in the WEC, also with the Corvette Z06 GT3.R. It takes Turkey’s colours onto the LMGT3 grid and shares engineering with the British operation.',
  ),
  'wec:iron-lynx': b(
    'A Iron Lynx, italiana, passou de Lamborghini a Mercedes-AMG no WEC em LMGT3. O time é conhecido pelo visual marcante e por alinhar line-ups internacionais nas 24 Horas de Le Mans.',
    'Italy’s Iron Lynx moved from Lamborghini to Mercedes-AMG in the WEC’s LMGT3 class. The team is known for a striking livery and for lining up international crews at the 24 Hours of Le Mans.',
  ),
  'wec:proton-competition': b(
    'A Proton Competition, alemã, é uma das equipes clientes mais longevas do endurance moderno — de Porsche a Ford Mustang GT3 Evo no WEC. A operação de Uwe Patz é presença constante em Le Mans e no WEC desde os anos 1990.',
    'Germany’s Proton Competition is one of the longest-running customer teams in modern endurance racing — from Porsche to the Ford Mustang GT3 Evo in the WEC. Uwe Patz’s operation has been a constant at Le Mans and in the WEC since the 1990s.',
  ),
  'wec:akkodis-asp': b(
    'A Akkodis ASP Team é o braço francês da Lexus/Toyota no GT3 europeu e no WEC, com o RC F GT3. A ASP, de Mulhouse, é especialista em Mercedes-AMG e Lexus e vive das 24 Horas de Spa tanto quanto de Le Mans.',
    'Akkodis ASP Team is Lexus/Toyota’s French GT3 arm in Europe and the WEC, with the RC F GT3. ASP, from Mulhouse, specialises in Mercedes-AMG and Lexus and lives for the 24 Hours of Spa as much as for Le Mans.',
  ),
  'wec:manthey-dk': inSeries(MANTHEY, 'No WEC, o programa Manthey EMA / DK Engineering leva o 911 GT3 R à classe LMGT3.', 'In the WEC, the Manthey EMA / DK Engineering programme takes the 911 GT3 R into LMGT3.'),
  'wec:bend-manthey': inSeries(MANTHEY, 'The Bend Manthey é o recorte australiano da operação, ligando o circuito de Tailem Bend ao pacote Porsche de Meuspath.', 'The Bend Manthey is the Australian slice of the operation, linking Tailem Bend’s circuit to the Porsche package from Meuspath.'),

  'imsa:porsche-penske': b(
    'A Porsche Penske Motorsport é o programa de fábrica da Porsche no IMSA GTP com o 963. A união da marca de Weissach com a Penske é uma das mais poderosas do sportscar americano, com títulos e vitórias em Daytona e Sebring.',
    'Porsche Penske Motorsport is Porsche’s IMSA GTP works programme with the 963. The Weissach–Penske union is one of the most powerful in American sportscar racing, with titles and wins at Daytona and Sebring.',
  ),
  'imsa:cadillac-wtr': b(
    'A Cadillac Wayne Taylor Racing é o time mais vitorioso da marca no IMSA moderno, com o V-Series.R na GTP. A família Taylor transformou a operação da Flórida em referência de endurance americano.',
    'Cadillac Wayne Taylor Racing is the brand’s most successful team in the modern IMSA era, with the V-Series.R in GTP. The Taylor family turned the Florida operation into a benchmark of American endurance racing.',
  ),
  'imsa:aston-martin-thor-imsa': b(
    'A Aston Martin THOR Team leva a Valkyrie ao IMSA GTP, o mesmo Hypercar LMH do WEC adaptado ao WeatherTech Championship. É o programa mais ambicioso da marca britânica no sportscar americano em décadas.',
    'Aston Martin THOR Team takes the Valkyrie into IMSA GTP, the same LMH Hypercar as in the WEC, adapted to the WeatherTech Championship. It is the British brand’s most ambitious American sportscar programme in decades.',
  ),
  'imsa:bmw-wrt-imsa': b(
    'A BMW M Team WRT replica no IMSA o programa Hypercar do WEC, com o M Hybrid V8 na GTP. A WRT belga opera o protótipo da BMW também em Daytona, Sebring e nas sprints americanas.',
    'BMW M Team WRT replicates its WEC Hypercar programme in IMSA, with the M Hybrid V8 in GTP. Belgian WRT also runs the BMW prototype at Daytona, Sebring and the American sprints.',
  ),
  'imsa:cadillac-whelen': b(
    'A Cadillac Whelen é o segundo programa GTP da marca no IMSA, com as cores da Whelen Engineering. O time amplia a presença da GM na classe de protótipos ao lado da Wayne Taylor Racing.',
    'Cadillac Whelen is the brand’s second IMSA GTP programme, in Whelen Engineering colours. The team expands GM’s prototype-class presence alongside Wayne Taylor Racing.',
  ),
  'imsa:acura-msr': b(
    'A Acura Meyer Shank Racing with Curb-Agajanian é o time de fábrica da Honda no IMSA GTP, com o ARX-06. Já venceu Daytona e o título de 2023, e segue como a principal ameaça japonesa às Cadillacs e Porsches.',
    'Acura Meyer Shank Racing with Curb-Agajanian is Honda’s IMSA GTP works team, with the ARX-06. It has already won Daytona and the 2023 title, and remains the main Japanese threat to the Cadillacs and Porsches.',
  ),
  'imsa:jdc-miller': b(
    'A JDC–Miller MotorSports é uma das equipes independentes mais respeitadas do IMSA, com história em LMP2 e protótipos. O time de Mid-Ohio vive de engenharia enxuta e de provas longas no WeatherTech Championship.',
    'JDC–Miller MotorSports is one of IMSA’s most respected independent teams, with a history in LMP2 and prototypes. The Mid-Ohio squad lives on lean engineering and the WeatherTech Championship’s long races.',
  ),
  'imsa:crowdstrike-apr': b(
    'A CrowdStrike Racing by APR leva a Oreca LMP2 ao IMSA com o apoio da marca de cibersegurança. A American Promise Racing opera o protótipo no grid de endurance americano ao lado das fábricas da GTP.',
    'CrowdStrike Racing by APR takes an Oreca LMP2 into IMSA with backing from the cybersecurity brand. American Promise Racing runs the prototype on the American endurance grid alongside the GTP factories.',
  ),
  'imsa:united-autosports': b(
    'A United Autosports USA é o braço americano da equipe de Zak Brown e Richard Dean, referência mundial de LMP2. No IMSA, o time britânico-americano corre na classe de protótipos de cliente com o mesmo padrão de Le Mans.',
    'United Autosports USA is the American arm of Zak Brown and Richard Dean’s team, a global LMP2 benchmark. In IMSA, the British-American squad contests the customer prototype class to the same standard as at Le Mans.',
  ),
  'imsa:tower-motorsports': b(
    'A Tower Motorsports é uma equipe americana de LMP2 no IMSA, presença regular em Daytona e nas 12 Horas de Sebring. O time opera Orecas de cliente num grid cada vez mais profissional.',
    'Tower Motorsports is an American LMP2 team in IMSA, a regular at Daytona and the 12 Hours of Sebring. The squad runs customer Orecas in an increasingly professional grid.',
  ),
  'imsa:tds-racing': b(
    'A TDS Racing, francesa, é uma das operações LMP2 mais tituladas da Europa e também corre no IMSA. O time de Sausset-les-Pins leva para os EUA o mesmo pacote Oreca que já brilhou em Le Mans e no ELMS.',
    'France’s TDS Racing is one of Europe’s most decorated LMP2 operations and also contests IMSA. The Sausset-les-Pins team takes to the U.S. the same Oreca package that has already shone at Le Mans and in the ELMS.',
  ),
  'imsa:era-motorsport': b(
    'A Era Motorsport é uma equipe americana de LMP2 no WeatherTech Championship, com base no meio-oeste. Vive das provas de endurance do IMSA, em especial o Rolex 24 e Sebring.',
    'Era Motorsport is an American LMP2 team in the WeatherTech Championship, based in the Midwest. It lives for IMSA’s endurance races, especially the Rolex 24 and Sebring.',
  ),
  'imsa:intersport-racing': b(
    'A Intersport Racing é uma das equipes independentes mais antigas do sportscar americano, com décadas de IMSA e American Le Mans Series. Segue no LMP2 como operação enxuta e familiar.',
    'Intersport Racing is one of the oldest independent teams in American sportscar racing, with decades of IMSA and American Le Mans Series history. It remains in LMP2 as a lean, family-run operation.',
  ),
  'imsa:inter-europol': b(
    'A Inter Europol Competition, polonesa, é campeã do WEC em LMP2 e também aparece no IMSA. O time de Dawid Gołębiowski levou o vermelho-e-branco da Polônia ao topo da classe de protótipos de cliente.',
    'Poland’s Inter Europol Competition is a WEC LMP2 champion and also appears in IMSA. Dawid Gołębiowski’s team took Polish red-and-white to the top of the customer prototype class.',
  ),
  'imsa:triarsi-competizione-gtdp': TRIARSI,
  'imsa:paul-miller-racing-gtdp': b(
    'A Paul Miller Racing é uma instituição do IMSA, com títulos em GTD e GTD Pro. A equipe de Nova Jersey correu com Lamborghini e BMW e segue como uma das operações independentes mais sólidas da classe GT.',
    'Paul Miller Racing is an IMSA institution, with titles in GTD and GTD Pro. The New Jersey team has raced Lamborghini and BMW and remains one of the most solid independent operations in the GT class.',
  ),
  'imsa:corvette-racing-by-pratt-miller-motorsports-gtdp': b(
    'A Corvette Racing by Pratt Miller é o programa de fábrica da Chevrolet no IMSA GTD Pro, com a Z06 GT3.R. Herdeira de décadas de vitórias em Le Mans e Daytona na classe GT, a operação de Michigan continua sendo o time a ser batido em casa.',
    'Corvette Racing by Pratt Miller is Chevrolet’s IMSA GTD Pro works programme, with the Z06 GT3.R. Heir to decades of Le Mans and Daytona GT wins, the Michigan operation remains the team to beat on home soil.',
  ),
  'imsa:pfaff-motorsports-gtdp': PFAFF,
  'imsa:vasser-sullivan-racing-gtdp': VASSER_SULLIVAN,
  'imsa:winward-racing-gtdp': WINWARD,
  'imsa:rll-team-mclaren-gtdp': b(
    'A RLL Team McLaren une a Rahal Letterman Lanigan ao 720S GT3 no IMSA GTD Pro. A estrutura de Bobby Rahal, histórica na Indy, leva o padrão de fábrica da McLaren para o sportscar americano.',
    'RLL Team McLaren pairs Rahal Letterman Lanigan with the 720S GT3 in IMSA GTD Pro. Bobby Rahal’s organisation, steeped in Indy history, takes McLaren’s works standard into American sportscar racing.',
  ),
  'imsa:risi-competizione-gtdp': b(
    'A Risi Competizione é a Ferrari mais vitoriosa do IMSA: décadas de 24 Horas de Daytona e 12 Horas de Sebring. Com base no Texas, o time de Giuseppe Risi corre em GTD Pro com o 296 GT3.',
    'Risi Competizione is IMSA’s most successful Ferrari team: decades of Daytona 24 Hours and Sebring 12 Hours wins. Based in Texas, Giuseppe Risi’s squad contests GTD Pro with the 296 GT3.',
  ),
  'imsa:ford-racing-gtdp': b(
    'A Ford Racing leva o Mustang GT3 Evo ao IMSA GTD Pro como programa de fábrica. Depois de anos afastada do GT de ponta nos EUA, a marca volta a brigar em Daytona com um cupê nascido na mesma família do carro de rua.',
    'Ford Racing takes the Mustang GT3 Evo into IMSA GTD Pro as a works programme. After years away from top-level U.S. GT racing, the brand is back fighting at Daytona with a coupe born from the same family as the road car.',
  ),
  'imsa:car-blanche-gtdp': CAR_BLANCHE,
  'imsa:bartone-bros-with-getspeed-gtdp': b(
    'A Bartone Bros with GetSpeed une um programa americano a uma das operações Mercedes-AMG mais fortes da Europa. No IMSA GTD Pro, o time busca o ritmo de Spa e Nürburgring nas pistas americanas.',
    'Bartone Bros with GetSpeed pairs an American programme with one of Europe’s strongest Mercedes-AMG operations. In IMSA GTD Pro, the team is chasing Spa and Nürburgring pace on American tracks.',
  ),
  'imsa:75-express-gtdp': b(
    'A 75 Express é um programa americano de GT no IMSA GTD Pro, focado nas provas de endurance do calendário WeatherTech. O time entra no pelotão Pro para ganhar quilometragem contra as fábricas.',
    '75 Express is an American GT programme in IMSA GTD Pro, focused on the WeatherTech calendar’s endurance races. The team joins the Pro field to gain mileage against the factories.',
  ),
  'imsa:ao-racing-gtdp': AO_RACING,
  'imsa:manthey-racing-gtdp': inSeries(MANTHEY, 'No IMSA GTD Pro, a Manthey leva o pacote de Nürburgring para Daytona e Sebring.', 'In IMSA GTD Pro, Manthey takes the Nürburgring package to Daytona and Sebring.'),
  'imsa:triarsi-competizione-gtd': TRIARSI,
  'imsa:car-blanche-gtd': CAR_BLANCHE,
  'imsa:vasser-sullivan-racing-gtd': VASSER_SULLIVAN,
  'imsa:13-autosport-gtd': b(
    'A 13 Autosport é uma equipe americana de GTD no IMSA, parte do pelotão de clientes que vive das 24 Horas de Daytona e das sprints do WeatherTech Championship.',
    '13 Autosport is an American GTD team in IMSA, part of the customer field that lives for the Daytona 24 Hours and the WeatherTech Championship sprints.',
  ),
  'imsa:myers-riley-motorsports-gtd': b(
    'A Myers Riley Motorsports é uma operação familiar americana no IMSA GTD. O time combina piloto-proprietário e endurance clássico no grid de GT3 dos Estados Unidos.',
    'Myers Riley Motorsports is an American family operation in IMSA GTD. The team combines owner-drivers and classic endurance racing on the United States GT3 grid.',
  ),
  'imsa:van-der-steur-racing-gtd': b(
    'A van der Steur Racing é uma equipe americana de GTD com raízes na costa leste. Corre o WeatherTech Championship como operação independente, focada nas provas longas.',
    'van der Steur Racing is an American GTD team with East Coast roots. It contests the WeatherTech Championship as an independent operation, focused on the long races.',
  ),
  'imsa:af-corse-usa-gtd': b(
    'A AF Corse USA leva o método da equipe de Piacenza para o IMSA GTD com a Ferrari 296 GT3. É o braço americano da operação que também corre o WEC e o Hypercar.',
    'AF Corse USA takes the Piacenza team’s method into IMSA GTD with the Ferrari 296 GT3. It is the American arm of the operation that also contests the WEC and Hypercar.',
  ),
  'imsa:heart-of-racing-team-gtd': HEART_OF_RACING,
  'imsa:rs1-gtd': b(
    'A RS1 é uma equipe americana de Porsche no IMSA GTD, típica operação de clientes do 911 GT3 R. Vive do calendário WeatherTech e das 24 Horas de Daytona.',
    'RS1 is an American Porsche team in IMSA GTD, a typical 911 GT3 R customer operation. It lives on the WeatherTech calendar and the Daytona 24 Hours.',
  ),
  'imsa:conquest-racing-gtd': b(
    'A Conquest Racing, histórica na Indy e no sportscar, volta ao IMSA GTD como operação independente. O nome remete aos anos 2000 de Champ Car e Grand-Am.',
    'Conquest Racing, with a history in Indy and sportscars, is back in IMSA GTD as an independent operation. The name recalls its 2000s Champ Car and Grand-Am years.',
  ),
  'imsa:dxdt-racing-gtd': b(
    'A DXDT Racing é uma equipe americana de Mercedes-AMG no IMSA GTD. O time do meio-oeste dos EUA aposta no GT3 Evo para o calendário de endurance e sprints.',
    'DXDT Racing is an American Mercedes-AMG team in IMSA GTD. The Midwestern squad bets on the GT3 Evo for the endurance and sprint calendar.',
  ),
  'imsa:magnus-racing-gtd': b(
    'A Magnus Racing é uma das equipes Porsche mais tradicionais do IMSA, com títulos em GTD. A operação da Pensilvânia é presença constante em Daytona e no campeonato WeatherTech.',
    'Magnus Racing is one of IMSA’s most traditional Porsche teams, with GTD titles. The Pennsylvania operation is a constant at Daytona and in the WeatherTech Championship.',
  ),
  'imsa:wayne-taylor-racing-gtd': b(
    'A Wayne Taylor Racing também aparece no GTD, além do programa GTP da Cadillac. A família Taylor usa a classe de GT para ampliar a operação da Flórida no IMSA.',
    'Wayne Taylor Racing also appears in GTD, on top of its Cadillac GTP programme. The Taylor family uses the GT class to expand the Florida operation in IMSA.',
  ),
  'imsa:pfaff-motorsports-gtd': PFAFF,
  'imsa:winward-racing-gtd': WINWARD,
  'imsa:gradient-racing-gtd': b(
    'A Gradient Racing, do Texas, é uma das operações Acura/Honda mais visíveis do IMSA GTD. O time de Austin vive das 24 Horas de Daytona e de um programa de clientes bem estruturado.',
    'Texas-based Gradient Racing is one of the most visible Acura/Honda operations in IMSA GTD. The Austin team lives for the Daytona 24 Hours and a well-structured customer programme.',
  ),
  'imsa:inception-racing-gtd': b(
    'A Inception Racing é um programa britânico de McLaren no GT3, presente no IMSA GTD. O time mistura gentleman drivers e profissionais em provas de endurance dos dois lados do Atlântico.',
    'Inception Racing is a British McLaren GT3 programme, present in IMSA GTD. The team mixes gentleman drivers and professionals in endurance races on both sides of the Atlantic.',
  ),
  'imsa:lone-star-racing-gtd': b(
    'A Lone Star Racing, do Texas, corre no IMSA GTD com Mercedes-AMG. O nome e as cores remetem ao estado, e o time é presença regular no Rolex 24.',
    'Lone Star Racing, from Texas, contests IMSA GTD with Mercedes-AMG. The name and colours nod to the state, and the team is a regular at the Rolex 24.',
  ),
  'imsa:dragonspeed-gtd': b(
    'A DragonSpeed, de Elton Julian, fez nome em LMP1 e LMP2 e também aparece no IMSA GTD. A operação americana-europeia é conhecida por line-ups internacionais e por Le Mans.',
    'DragonSpeed, Elton Julian’s team, made its name in LMP1 and LMP2 and also appears in IMSA GTD. The American-European operation is known for international lineups and for Le Mans.',
  ),
  'imsa:turner-motorsport-gtd': b(
    'A Turner Motorsport é a equipe BMW mais titulada do IMSA moderno, com uma coleção de vitórias em GTD. Com base em Massachusetts, o time de Will Turner é referência de M4 GT3 nos EUA.',
    'Turner Motorsport is the most decorated BMW team of the modern IMSA era, with a collection of GTD wins. Based in Massachusetts, Will Turner’s squad is the M4 GT3 benchmark in the United States.',
  ),
  'imsa:wright-motorsports-gtd': b(
    'A Wright Motorsports é uma operação Porsche da costa oeste americana, regular no IMSA GTD. O time de Lake Forest, Califórnia, vive do 911 GT3 R e das provas longas do calendário.',
    'Wright Motorsports is a West Coast American Porsche operation, a regular in IMSA GTD. The Lake Forest, California team lives on the 911 GT3 R and the calendar’s long races.',
  ),
  'imsa:muhlner-motorsport-gtd': b(
    'A Mühlner Motorsport, belga, é uma especialista Porsche de GT3 que também corre no IMSA GTD. A operação de Saint-Vith leva para os EUA o mesmo pacote de Spa e do Nürburgring.',
    'Belgium’s Mühlner Motorsport is a Porsche GT3 specialist that also contests IMSA GTD. The Saint-Vith operation takes to the U.S. the same package it runs at Spa and the Nürburgring.',
  ),
  'imsa:ao-racing-gtd': AO_RACING,
  'imsa:manthey-1st-phorm-gtd': inSeries(MANTHEY, 'No IMSA GTD, o recorte Manthey 1st Phorm mistura o pacote alemão a um programa americano de clientes.', 'In IMSA GTD, the Manthey 1st Phorm entry mixes the German package with an American customer programme.'),

  'wrc:hyundai-wrc': b(
    'A Hyundai Shell Mobis WRT é a equipe de fábrica da Hyundai no WRC, com base na Alemanha. Desde 2014 a marca coreana brigou por títulos com Neuville, Tänak e agora uma nova geração no i20 N Rally1 híbrido.',
    'Hyundai Shell Mobis WRT is Hyundai’s factory WRC team, based in Germany. Since 2014 the Korean brand has fought for titles with Neuville, Tänak and now a new generation in the i20 N Rally1 hybrid.',
  ),
  'wrc:toyota-wrc': b(
    'A Toyota Gazoo Racing WRT, dirigida por Jari-Matti Latvala, é a potência atual do WRC: títulos de marcas e a era Ogier/Evans/Rovanperä no GR Yaris Rally1. A operação finlandesa de Jyväskylä é o time a ser batido no mundial.',
    'Toyota Gazoo Racing WRT, led by Jari-Matti Latvala, is the WRC’s current powerhouse: manufacturers’ titles and the Ogier/Evans/Rovanperä era in the GR Yaris Rally1. The Finnish operation in Jyväskylä is the team to beat in the world championship.',
  ),
  'wrc:msport-ford': b(
    'A M-Sport Ford WRT, de Cockermouth, é a equipe privada mais vitoriosa do WRC moderno — títulos com Colin McRae, Burns, Solberg e Ogier. Sem o orçamento das fábricas, o Puma Rally1 segue como a porta de entrada mais romântica do mundial.',
    'M-Sport Ford WRT, from Cockermouth, is the most successful privateer team of the modern WRC — titles with Colin McRae, Burns, Solberg and Ogier. Without the factory budgets, the Puma Rally1 remains the world championship’s most romantic way in.',
  ),

  'indy:foyt': b(
    'A A. J. Foyt Enterprises é a equipe mais antiga ainda ativa na IndyCar, fundada pelo tetracampeão das 500 Milhas. A operação texana atravessou Champ Car, IRL e a unificação, e segue como um dos nomes mais identitários de Indianápolis.',
    'A. J. Foyt Enterprises is the oldest team still active in IndyCar, founded by the four-time 500 champion. The Texas operation has come through Champ Car, the IRL and reunification, and remains one of Indianapolis’s most distinctive names.',
  ),
  'indy:andretti': b(
    'A Andretti Global, de Michael Andretti, é uma das superpotências da IndyCar, com vitórias na 500 e títulos. A equipe de Indianápolis também é o braço político do projeto Cadillac/F1 e forma pilotos para o oval e o misto.',
    'Andretti Global, Michael Andretti’s team, is one of IndyCar’s superpowers, with 500 wins and titles. The Indianapolis squad is also the political arm of the Cadillac/F1 project and develops drivers for both ovals and road courses.',
  ),
  'indy:mclaren-indy': b(
    'A Arrow McLaren é o programa de IndyCar da McLaren Racing, herdeiro da Andretti Autosport em parte do grid e da tradição de Bruce McLaren em Indianápolis. O papaya também quer as 500 Milhas, não só a F1.',
    'Arrow McLaren is McLaren Racing’s IndyCar programme, heir to part of the Andretti Autosport grid and to Bruce McLaren’s Indianapolis tradition. The papaya wants the 500 as well, not just F1.',
  ),
  'indy:ganassi': b(
    'A Chip Ganassi Racing é a equipe mais titulada da IndyCar moderna, com uma coleção de 500 Milhas e campeonatos. De Dixon a Palou, a operação de Indianápolis é o padrão de consistência da categoria.',
    'Chip Ganassi Racing is the most decorated team of the modern IndyCar era, with a collection of 500s and championships. From Dixon to Palou, the Indianapolis operation is the category’s consistency benchmark.',
  ),
  'indy:dalecoyne': b(
    'A Dale Coyne Racing é a clássica equipe independente da IndyCar, porta de entrada para talentos sem orçamento de fábrica. O time de Illinois já colocou estreantes no pódio e vive de engenharia criativa no pelotão do meio.',
    'Dale Coyne Racing is IndyCar’s classic independent team, a way in for talent without a factory budget. The Illinois squad has already put rookies on the podium and lives on creative engineering in the midfield.',
  ),
  'indy:dreyer': b(
    'A Dreyer & Reinbold Racing é uma operação indiana clássica, mais visível nas 500 Milhas de Indianápolis do que no calendário completo. O time de Dennis Reinbold vive do mês de maio em Speedway.',
    'Dreyer & Reinbold Racing is a classic Indiana operation, more visible at the Indianapolis 500 than across the full calendar. Dennis Reinbold’s team lives for May in Speedway.',
  ),
  'indy:carpenter': b(
    'A Ed Carpenter Racing é a equipe do próprio piloto-proprietário, especialista em ovais. Com base em Indianápolis, o time costuma ser ameaça nas 500 e nas provas de alta velocidade da IndyCar.',
    'Ed Carpenter Racing is the owner-driver’s own team, an oval specialist. Based in Indianapolis, the squad is often a threat at the 500 and IndyCar’s high-speed races.',
  ),
  'indy:juncos': b(
    'A Juncos Hollinger Racing nasceu da Fórmula 3 e da Indy Lights argentinas de Ricardo Juncos e chegou à IndyCar com o apoio de Brad Hollinger. O time de Indianápolis é um dos projetos de crescimento mais claros do grid.',
    'Juncos Hollinger Racing grew out of Ricardo Juncos’s Argentine Formula 3 and Indy Lights programmes and reached IndyCar with Brad Hollinger’s backing. The Indianapolis team is one of the grid’s clearest growth projects.',
  ),
  'indy:msr-indy': b(
    'A Meyer Shank Racing compete na IndyCar além do IMSA, com vitória nas 500 Milhas de 2022. A operação de Ohio mistura o know-how de endurance da Acura com o oval americano.',
    'Meyer Shank Racing contests IndyCar as well as IMSA, with a 2022 Indianapolis 500 win. The Ohio operation mixes Acura endurance know-how with American oval racing.',
  ),
  'indy:rahal': b(
    'A Rahal Letterman Lanigan Racing une Bobby Rahal, David Letterman e Mike Lanigan numa das equipes mais tradicionais da IndyCar. O time de Indianápolis vive de Honda, de ovais e de uma identidade muito americana.',
    'Rahal Letterman Lanigan Racing brings together Bobby Rahal, David Letterman and Mike Lanigan in one of IndyCar’s most traditional teams. The Indianapolis squad lives on Honda, ovals and a distinctly American identity.',
  ),
  'indy:penske-indy': b(
    'A Team Penske é a equipe mais vitoriosa das 500 Milhas de Indianápolis e um dos impérios de Roger Penske ao lado da NASCAR e do IMSA. Na IndyCar, o vermelho-e-branco segue como o padrão de ouro da categoria.',
    'Team Penske is the most successful team in Indianapolis 500 history and one of Roger Penske’s empires alongside NASCAR and IMSA. In IndyCar, the red-and-white remains the category’s gold standard.',
  ),

  'nascar:23xi': b(
    'A 23XI Racing, de Michael Jordan e Denny Hamlin, é uma das equipes novas mais ambiciosas da NASCAR Cup. Com Toyota, o time já venceu corridas e quer brigar com as dinastias de Hendrick, Gibbs e Penske.',
    '23XI Racing, owned by Michael Jordan and Denny Hamlin, is one of the Cup Series’ most ambitious new teams. With Toyota, the squad has already won races and wants to fight the Hendrick, Gibbs and Penske dynasties.',
  ),
  'nascar:penske-nascar': b(
    'A Team Penske na NASCAR é tricampeã da Cup com Joey Logano e histórica em ovais curtos e superspeedways. O mesmo império de Indianápolis aplica na stock car a mesma obsessão por detalhe da IndyCar.',
    'Team Penske in NASCAR is a Cup champion with Joey Logano and a historic force on short tracks and superspeedways. The same Indianapolis empire applies the same obsession with detail to stock cars as it does to IndyCar.',
  ),
  'nascar:jgr': b(
    'A Joe Gibbs Racing é uma das dinastias Toyota da Cup Series, com dezenas de títulos e uma academia de jovens que alimenta o grid. A operação de Carolina do Norte é presença constante no Championship 4.',
    'Joe Gibbs Racing is one of the Toyota dynasties of the Cup Series, with a stack of titles and a junior academy that feeds the grid. The North Carolina operation is a Championship 4 regular.',
  ),
  'nascar:hendrick': b(
    'A Hendrick Motorsports é a equipe mais vitoriosa da história da NASCAR Cup, casa de Jeff Gordon, Jimmie Johnson e agora Chase Elliott e Kyle Larson. O império de Rick Hendrick, com Chevrolet, é o time a ser batido em qualquer oval.',
    'Hendrick Motorsports is the most successful team in NASCAR Cup history, home to Jeff Gordon, Jimmie Johnson and now Chase Elliott and Kyle Larson. Rick Hendrick’s Chevrolet empire is the team to beat on any oval.',
  ),
  'nascar:rfk': b(
    'A RFK Racing, de Jack Roush e Brad Keselowski, é a herdeira da Roush Fenway. A equipe Ford tenta reencontrar o ritmo de título dos anos 2000 com um modelo de piloto-proprietário na liderança.',
    'RFK Racing, owned by Jack Roush and Brad Keselowski, is the heir to Roush Fenway. The Ford team is trying to recapture its 2000s title rhythm with an owner-driver at the helm.',
  ),
  'nascar:trackhouse': b(
    'A Trackhouse Racing, de Justin Marks, virou fenômeno da Cup ao misturar marketing agressivo e vitórias com Chevrolet. O time também toca o projeto Project91 de convidados internacionais.',
    'Trackhouse Racing, Justin Marks’s team, became a Cup phenomenon by mixing aggressive marketing with Chevrolet wins. The squad also runs the Project91 programme for international guests.',
  ),
  'nascar:spire': b(
    'A Spire Motorsports cresceu de uma operação pequena de Chevrolet no meio do pelotão para um time de vários carros na Cup. Vive de ovais e de um modelo de negócio mais enxuto que as dinastias.',
    'Spire Motorsports grew from a small Chevrolet midfield operation into a multi-car Cup team. It lives on ovals and a leaner business model than the dynasties.',
  ),
  'nascar:kaulig': b(
    'A Kaulig Racing, de Matt Kaulig, subiu da Xfinity para a Cup com Chevrolet e um estilo ofensivo. O time de Carolina do Norte é conhecido por arriscar estratégia e por formar pilotos no segundo degrau.',
    'Kaulig Racing, Matt Kaulig’s team, stepped up from Xfinity to Cup with Chevrolet and an aggressive style. The North Carolina squad is known for gambling on strategy and for developing drivers on the second tier.',
  ),
  'nascar:frontrow': b(
    'A Front Row Motorsports é uma equipe Ford da Cup, independente, que já venceu superspeedways. O time de Carolina do Norte vive de acertar o pacote em Daytona e Talladega.',
    'Front Row Motorsports is an independent Ford Cup team that has already won on superspeedways. The North Carolina squad lives by nailing the package at Daytona and Talladega.',
  ),
  'nascar:legacy': b(
    'A Legacy Motor Club, ligada a Richard Petty e Jimmie Johnson, tenta reconstruir uma identidade clássica da NASCAR com Toyota. O time mistura o 43 histórico a um projeto de médio prazo na Cup.',
    'Legacy Motor Club, linked to Richard Petty and Jimmie Johnson, is trying to rebuild a classic NASCAR identity with Toyota. The team mixes the historic 43 with a medium-term Cup project.',
  ),
  'nascar:rcr': b(
    'A Richard Childress Racing é uma das equipes fundadoras da NASCAR moderna, casa de Dale Earnhardt. Com Chevrolet, a RCR segue no grid da Cup como um nome inseparável da história da categoria.',
    'Richard Childress Racing is one of the founding teams of modern NASCAR, Dale Earnhardt’s home. With Chevrolet, RCR remains on the Cup grid as a name inseparable from the sport’s history.',
  ),
  'nascar:wood': b(
    'A Wood Brothers Racing é a equipe mais antiga ainda ativa na NASCAR, com o histórico número 21 da Ford. A operação da Virgínia é um pedaço vivo da história das 500 Milhas de Daytona.',
    'Wood Brothers Racing is the oldest team still active in NASCAR, with Ford’s historic No. 21. The Virginia operation is a living piece of Daytona 500 history.',
  ),
  'nascar:haas-factory': b(
    'A Haas Factory Team é o braço NASCAR de Gene Haas, paralelo à Haas F1. Com Ford, o time da Cup busca o mesmo pragmatismo da operação de Fórmula 1, agora sob identidade de fábrica.',
    'Haas Factory Team is Gene Haas’s NASCAR arm, parallel to Haas F1. With Ford, the Cup squad is chasing the same pragmatism as the Formula 1 operation, now under a factory identity.',
  ),
  'nascar:hyak': b(
    'A Hyak Motorsports é uma das operações mais novas da Cup Series, ainda construindo identidade no pelotão. O time entra no grid para crescer corrida a corrida contra as estruturas estabelecidas.',
    'Hyak Motorsports is one of the Cup Series’ newest operations, still building an identity in the field. The team is on the grid to grow race by race against the established structures.',
  ),
  'nascar:rwr': b(
    'A Rick Ware Racing é uma equipe de vários carros da Cup conhecida por abrir o grid a convidados e a pilotos sem superorçamento. A operação de Carolina do Norte vive da profundidade do pelotão, não da briga pelo título.',
    'Rick Ware Racing is a multi-car Cup team known for opening the grid to guests and drivers without a super-budget. The North Carolina operation lives in the depth of the field, not the title fight.',
  ),

  'dtm:comtoyou': b(
    'A Comtoyou Racing, belga, é uma das operações Audi mais fortes do GT3 europeu e leva o RS3 LMS ao DTM. O time de Bruxelas fez nome no WTCR e no GT World Challenge antes de se firmar no campeonato alemão.',
    'Belgium’s Comtoyou Racing is one of the strongest Audi GT3 operations in Europe and takes the RS3 LMS to DTM. The Brussels team made its name in WTCR and GT World Challenge before establishing itself in the German championship.',
  ),
  'dtm:schubert': b(
    'A Schubert Motorsport, alemã, é o principal cliente BMW no DTM, com o M4 GT3. A equipe de Motorsport Arena Oschersleben já foi campeã e segue como referência de ritmo da marca bávara no campeonato.',
    'Germany’s Schubert Motorsport is BMW’s leading DTM customer, with the M4 GT3. The Motorsport Arena Oschersleben team has already been champion and remains the Bavarian brand’s pace benchmark in the championship.',
  ),
  'dtm:emil-frey': b(
    'A Emil Frey Racing, suíça, corre no DTM com Ferrari e um histórico longo de GT3 na Europa. A operação de Safenwil mistura programa de clientes da 296 com o sprint do campeonato alemão.',
    'Switzerland’s Emil Frey Racing contests DTM with Ferrari and a long GT3 history in Europe. The Safenwil operation mixes a 296 customer programme with the German championship’s sprint format.',
  ),
  'dtm:hrt-ford': b(
    'A HRT Ford Racing leva o Mustang GT3 ao DTM como o braço mais visível da Ford no campeonato. A Haupt Racing Team, alemã, já foi potência Mercedes-AMG e agora trabalha o cupê americano no grid GT3.',
    'HRT Ford Racing takes the Mustang GT3 to DTM as Ford’s most visible arm in the championship. Germany’s Haupt Racing Team was already a Mercedes-AMG force and now works the American coupe on the GT3 grid.',
  ),
  'dtm:abt-dtm': b(
    'A Red Bull Team ABT é a herdeira da Abt Sportsline, a equipe mais identitária da Audi no DTM clássico. Com o apoio da Red Bull, o time alemão segue no grid GT3 como um dos nomes mais pesados do campeonato.',
    'Red Bull Team ABT is the heir to Abt Sportsline, Audi’s most distinctive team in classic DTM. With Red Bull backing, the German squad remains on the GT3 grid as one of the championship’s heaviest names.',
  ),
  'dtm:grt': b(
    'A TGI Team by GRT é o braço da Grasser Racing Team no DTM, operação austríaca histórica de Lamborghini. O time leva o Huracán GT3 Evo2 ao campeonato alemão com o mesmo DNA de Blancpain/GTWC.',
    'TGI Team by GRT is Grasser Racing Team’s DTM arm, a historic Austrian Lamborghini operation. The squad takes the Huracán GT3 Evo2 to the German championship with the same Blancpain/GTWC DNA.',
  ),
  'dtm:landgraf': b(
    'A Mercedes-AMG Team Landgraf é um dos clientes oficiais da estrela no DTM. A operação alemã trabalha o GT3 Evo no formato sprint, com forte ligação à fábrica de Affalterbach.',
    'Mercedes-AMG Team Landgraf is one of the star’s official DTM customers. The German operation works the GT3 Evo in sprint format, with a strong link to the Affalterbach factory.',
  ),
  'dtm:winward': WINWARD,
  'dtm:dorr': b(
    'A Dörr Motorsport, alemã, corre no DTM com McLaren e um perfil de equipe de clientes bem enxuto. O time busca espaço no pelotão GT3 contra as estruturas de fábrica da BMW, Audi e Mercedes.',
    'Germany’s Dörr Motorsport contests DTM with McLaren and a lean customer-team profile. The squad is chasing space in the GT3 field against the BMW, Audi and Mercedes factory structures.',
  ),
  'dtm:land-motorsport': b(
    'A Land-Motorsport é uma especialista Porsche de GT3 na Alemanha, regular no ADAC GT Masters e no DTM. A operação de Nürburgring vive do 911 e das pistas nacionais.',
    'Land-Motorsport is a German Porsche GT3 specialist, a regular in ADAC GT Masters and DTM. The Nürburgring operation lives on the 911 and the domestic tracks.',
  ),
  'dtm:manthey-racing': inSeries(MANTHEY, 'No DTM, a Manthey aplica o acerto de Nürburgring ao formato sprint do campeonato alemão.', 'In DTM, Manthey applies its Nürburgring setup to the German championship’s sprint format.'),

  'endurance-brasil:foresti-sports': b(
    'A Foresti Sports, dirigida por Pedro Henrique Moises, é uma das operações do Endurance Brasil. O time alinha um elenco amplo no campeonato nacional de resistência, que mistura protótipos e GTs em provas de 3 e 4 horas.',
    'Foresti Sports, led by Pedro Henrique Moises, is one of the Endurance Brasil operations. The team fields a large roster in the national endurance championship, which mixes prototypes and GTs in 3- and 4-hour races.',
  ),
  'endurance-brasil:ftr-motorsport': b(
    'A FTR Motorsport, de Cassiano Frigieri, compete no Endurance Brasil. A equipe entra no grid nacional de resistência ao lado de programas de GT e protótipo nos autódromos brasileiros.',
    'FTR Motorsport, led by Cassiano Frigieri, contests Endurance Brasil. The team joins the national endurance grid alongside GT and prototype programmes at Brazilian circuits.',
  ),
  'endurance-brasil:gforce-autorsport': b(
    'A GForce Autorsport, dirigida por Guilherme Ferro, é uma das equipes do Endurance Brasil. O time leva um grupo fechado de pilotos ao campeonato nacional de endurance.',
    'GForce Autorsport, led by Guilherme Ferro, is one of the Endurance Brasil teams. The squad takes a closed group of drivers to the national endurance championship.',
  ),
  'endurance-brasil:acme-racing': b(
    'A MC Tubarão, dirigida por Geciel de Andrade, representa o programa catarinense no Endurance Brasil. O time mistura identidade regional com o grid nacional de GT e protótipo.',
    'MC Tubarão, led by Geciel de Andrade, is the Santa Catarina programme in Endurance Brasil. The team mixes regional identity with the national GT and prototype grid.',
  ),
  'endurance-brasil:mottin-racing': b(
    'A Mottin Racing, de Luciano Mottin, é uma das operações mais visíveis do GT brasileiro. No Endurance Brasil, o time gaúcho leva a rotina de cliente Porsche/GT3 para as provas longas do calendário nacional.',
    'Mottin Racing, Luciano Mottin’s team, is one of the most visible operations in Brazilian GT racing. In Endurance Brasil, the Rio Grande do Sul squad takes its Porsche/GT3 customer routine into the national calendar’s long races.',
  ),
  'endurance-brasil:stuttgart-motorsport-gt3': b(
    'A Stuttgart Motorsport GT3, dirigida por Felipe Grizzi, é o braço de ponta da operação Porsche no Endurance Brasil. O time separa o programa GT3 do GT4 para disputar a classe mais rápida dos GTs nacionais.',
    'Stuttgart Motorsport GT3, led by Felipe Grizzi, is the sharp end of the Porsche operation in Endurance Brasil. The team splits its GT3 programme from GT4 to contest the fastest national GT class.',
  ),
  'endurance-brasil:stuttgart-motorsport-gt4': b(
    'A Stuttgart Motorsport GT4, também de Felipe Grizzi, é o programa de acesso da mesma operação Porsche no Endurance Brasil. A classe GT4 abre o grid de endurance a gentleman drivers e a estreantes em prova longa.',
    'Stuttgart Motorsport GT4, also led by Felipe Grizzi, is the same Porsche operation’s access programme in Endurance Brasil. The GT4 class opens the endurance grid to gentleman drivers and long-race rookies.',
  ),
  'endurance-brasil:tech-force': b(
    'A Tech Force, dirigida por Ariel Luis Schaellenberger, compete no Endurance Brasil. A equipe entra no campeonato nacional de resistência com um elenco enxuto nas classes de GT e protótipo.',
    'Tech Force, led by Ariel Luis Schaellenberger, contests Endurance Brasil. The team joins the national endurance championship with a lean roster across the GT and prototype classes.',
  ),
  'endurance-brasil:tmg-racing': b(
    'A TMG Racing, de Thiago Meneghel, é uma das estruturas mais conhecidas do automobilismo brasileiro de turismo e GT. No Endurance Brasil, o time leva a mesma disciplina de Stock Car e GT Sprint Race para as provas de 3 e 4 horas.',
    'TMG Racing, Thiago Meneghel’s team, is one of the best-known structures in Brazilian touring-car and GT racing. In Endurance Brasil, the squad takes the same Stock Car and GT Sprint Race discipline into the 3- and 4-hour races.',
  ),
};

const AF_CORSE_BADGE = 'https://r2.thesportsdb.com/images/media/team/badge/duhqtg1705867755.png';
const AF_CORSE_296 = 'https://r2.thesportsdb.com/images/media/team/equipment/n89ezn1746910564.png';
const WRT_BADGE = 'https://r2.thesportsdb.com/images/media/team/badge/0jrxwn1705580515.png';
const WRT_M4 = 'https://r2.thesportsdb.com/images/media/team/equipment/allcr81747131210.png';

const AF_CORSE_GT3 = b(
  'A AF Corse, de Piacenza, é a equipe cliente mais ligada à Ferrari no GT3 mundial. No GT World Challenge corre com a 296 GT3 Evo, o mesmo método de fábrica que usa no WEC — gentleman drivers ao lado de oficiais da marca.',
  'AF Corse, from Piacenza, is the customer team most closely tied to Ferrari in worldwide GT3. In GT World Challenge it races the 296 GT3 Evo, the same works method it uses in the WEC — gentleman drivers alongside factory professionals.',
);

const WRT_GT3 = b(
  'A Team WRT, belga, é uma das operações BMW mais tituladas do GT3 europeu e pentacampeã do GT World Challenge. Poucas equipes no mundo equilibram tão bem programa de clientes e ritmo de fábrica no M4 GT3.',
  'Belgium’s Team WRT is one of BMW’s most decorated GT3 operations in Europe and a multiple GT World Challenge champion. Few teams in the world balance a customer programme and works pace so well in the M4 GT3.',
);

const GARAGE_59_GT3 = b(
  'A Garage 59, britânica, é uma das operações McLaren mais respeitadas do GT3 europeu. No GT World Challenge leva o 720S Evo ao grid da SRO, o mesmo pacote que já brilhou no WEC.',
  'Britain’s Garage 59 is one of the most respected McLaren GT3 operations in Europe. In GT World Challenge it takes the 720S Evo onto the SRO grid, the same package that has already shone in the WEC.',
);

const GETSPEED = b(
  'A GetSpeed é uma das operações Mercedes-AMG mais presentes no GT World Challenge Europe, com vários carros e parcerias (Bartone Bros, Dubai, Noble, PCX). A estrutura alemã vive de Spa e das sprints da SRO.',
  'GetSpeed is one of the Mercedes-AMG operations most present in GT World Challenge Europe, with several cars and partnerships (Bartone Bros, Dubai, Noble, PCX). The German structure lives for Spa and the SRO sprints.',
);

const ROWE = b(
  'A Rowe Racing é o programa BMW de endurance mais clássico da Alemanha, vencedor das 24 Horas de Spa e de Nürburgring. No GT World Challenge o M4 GT3 Evo segue como uma das referências da classe Pro.',
  'Rowe Racing is Germany’s most classic BMW endurance programme, a winner of the 24 Hours of Spa and the Nürburgring. In GT World Challenge the M4 GT3 Evo remains one of the Pro class benchmarks.',
);

const KESSEL = b(
  'A Kessel Racing, suíça, é uma das equipes Ferrari mais tradicionais do GT3 europeu. No GT World Challenge corre com a 296 GT3 Evo, misturando gentleman drivers e profissionais nas classes Bronze e Silver.',
  'Switzerland’s Kessel Racing is one of the most traditional Ferrari teams in European GT3. In GT World Challenge it races the 296 GT3 Evo, mixing gentleman drivers and professionals in the Bronze and Silver classes.',
);

const RUTRONIK = b(
  'A Rutronik Racing, alemã, passou de Porsche a Lamborghini no GT World Challenge e corre na classe Pro com o Temerario GT3. O time de Winnenden é conhecido por um pacote agressivo de classificação.',
  'Germany’s Rutronik Racing moved from Porsche to Lamborghini in GT World Challenge and contests the Pro class with the Temerario GT3. The Winnenden team is known for an aggressive qualifying package.',
);

const VERSTAPPEN_GT = b(
  'A Mercedes-AMG Team Verstappen Racing é o programa GT da família Verstappen no GT World Challenge. O time holandês alinha o GT3 Evo na classe Pro, no mesmo grupo Red Bull que a Fórmula 1 já conhece.',
  'Mercedes-AMG Team Verstappen Racing is the Verstappen family’s GT programme in GT World Challenge. The Dutch team fields the GT3 Evo in the Pro class, in the same Red Bull orbit already familiar from Formula 1.',
);

const CRAFT_BAMBOO = b(
  'A Craft-Bamboo Racing, de Hong Kong, é uma das operações Mercedes-AMG mais fortes da Ásia. No GT World Challenge Asia o time mistura endurance local com o pacote GT3 Evo usado na Europa.',
  'Hong Kong’s Craft-Bamboo Racing is one of Asia’s strongest Mercedes-AMG operations. In GT World Challenge Asia the team mixes local endurance racing with the GT3 Evo package used in Europe.',
);

export type TeamAssets = {
  badge?: string;
  clearart?: string;
  bio?: TeamBio;
};

function normName(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

const KNOWN_LIVE_TEAMS: { needle: string; assets: TeamAssets }[] = [
  { needle: 'af corse usa', assets: { badge: AF_CORSE_BADGE, clearart: AF_CORSE_296, bio: AF_CORSE_GT3 } },
  { needle: 'af corse', assets: { badge: AF_CORSE_BADGE, clearart: AF_CORSE_296, bio: AF_CORSE_GT3 } },
  { needle: 'team wrt', assets: { badge: WRT_BADGE, clearart: WRT_M4, bio: WRT_GT3 } },
  { needle: 'wrt', assets: { badge: WRT_BADGE, clearart: WRT_M4, bio: WRT_GT3 } },
  { needle: 'garage 59', assets: { bio: GARAGE_59_GT3 } },
  { needle: 'comtoyou', assets: { badge: 'https://r2.thesportsdb.com/images/media/team/badge/n44t3f1757929207.png', clearart: 'https://r2.thesportsdb.com/images/media/team/equipment/y2xoo41779805600.png', bio: TEAM_BIOS['dtm:comtoyou'] } },
  { needle: 'emil frey', assets: { badge: 'https://r2.thesportsdb.com/images/media/team/badge/a6usmg1711453030.png', clearart: 'https://r2.thesportsdb.com/images/media/team/equipment/7pe86l1779553314.png', bio: TEAM_BIOS['dtm:emil-frey'] } },
  { needle: 'hrt ford', assets: { badge: 'https://r2.thesportsdb.com/images/media/team/badge/loigud1757931732.png', clearart: 'https://r2.thesportsdb.com/images/media/team/equipment/90fh9m1779805985.png', bio: TEAM_BIOS['dtm:hrt-ford'] } },
  { needle: 'winward', assets: { badge: 'https://r2.thesportsdb.com/images/media/team/badge/66sakt1711454724.png', clearart: 'https://r2.thesportsdb.com/images/media/team/equipment/437u5n1779806766.png', bio: WINWARD } },
  { needle: 'tgi team', assets: { badge: 'https://r2.thesportsdb.com/images/media/team/badge/foi45v1560270079.png', bio: TEAM_BIOS['dtm:grt'] } },
  { needle: 'getspeed', assets: { bio: GETSPEED } },
  { needle: 'bartone', assets: { bio: GETSPEED } },
  { needle: 'rowe racing', assets: { bio: ROWE } },
  { needle: 'kessel', assets: { bio: KESSEL } },
  { needle: 'rutronik', assets: { bio: RUTRONIK } },
  { needle: 'verstappen racing', assets: { bio: VERSTAPPEN_GT } },
  { needle: 'craft bamboo', assets: { bio: CRAFT_BAMBOO } },
  { needle: 'turner motorsport', assets: { badge: 'https://r2.thesportsdb.com/images/media/team/badge/eyoonu1589117766.png', clearart: 'https://r2.thesportsdb.com/images/media/team/equipment/lnmagf1589117806.png', bio: TEAM_BIOS['imsa:turner-motorsport-gtd'] } },
  { needle: 'wright motorsports', assets: { badge: 'https://r2.thesportsdb.com/images/media/team/badge/mhpwu31588604957.png', clearart: 'https://r2.thesportsdb.com/images/media/team/equipment/m3ap641768427038.png', bio: TEAM_BIOS['imsa:wright-motorsports-gtd'] } },
  { needle: 'triarsi', assets: { bio: TRIARSI } },
  { needle: 'muehlner', assets: { bio: TEAM_BIOS['imsa:muhlner-motorsport-gtd'] } },
  { needle: 'muhlner', assets: { bio: TEAM_BIOS['imsa:muhlner-motorsport-gtd'] } },
  { needle: 'lone star', assets: { bio: TEAM_BIOS['imsa:lone-star-racing-gtd'] } },
  { needle: 'rs1', assets: { bio: TEAM_BIOS['imsa:rs1-gtd'] } },
  { needle: 'manthey', assets: { badge: 'https://r2.thesportsdb.com/images/media/team/badge/n1o0eq1711454879.png', clearart: 'https://r2.thesportsdb.com/images/media/team/equipment/wdxgtd1779806327.png', bio: MANTHEY } },
];

export function lookupTeamAssets(name: string): TeamAssets | undefined {
  const n = normName(name);
  return KNOWN_LIVE_TEAMS.find((row) => n.includes(row.needle) || n === row.needle)?.assets;
}

const LIVE_SERIES: Record<string, { pt: string; en: string }> = {
  'gtwc-europe': { pt: 'GT World Challenge Europe', en: 'GT World Challenge Europe' },
  'gtwc-america': { pt: 'GT World Challenge America', en: 'GT World Challenge America' },
  'gtwc-asia': { pt: 'GT World Challenge Asia', en: 'GT World Challenge Asia' },
  'endurance-brasil': { pt: 'Endurance Brasil', en: 'Endurance Brasil' },
};

function generateLiveTeamBio(categoryId: string, team: Team): TeamBio {
  const series = LIVE_SERIES[categoryId];
  const classPt = team.class ? ` na classe ${team.class}` : '';
  const classEn = team.class ? ` in the ${team.class} class` : '';
  const carPt = team.car ? ` com o ${team.car}` : '';
  const carEn = team.car ? ` with the ${team.car}` : '';
  const principalPt = team.principal ? `, dirigida por ${team.principal}` : '';
  const principalEn = team.principal ? `, led by ${team.principal}` : '';

  if (categoryId === 'endurance-brasil') {
    return b(
      `A ${team.name}${principalPt} compete no Endurance Brasil${classPt}. O campeonato nacional reúne protótipos e GTs em provas de 3 e 4 horas nos principais autódromos do país.`,
      `${team.name}${principalEn} contests Endurance Brasil${classEn}. The national championship mixes prototypes and GTs in 3- and 4-hour races at Brazil’s main circuits.`,
    );
  }

  if (!series) {
    return b(
      `A ${team.name} compete nesta categoria${classPt}${carPt}.`,
      `${team.name} contests this championship${classEn}${carEn}.`,
    );
  }

  return b(
    `A ${team.name} compete no ${series.pt}${classPt}${carPt}. O grid da SRO reúne fabricantes de GT3 de todo o mundo, com Balance of Performance entre os modelos.`,
    `${team.name} contests ${series.en}${classEn}${carEn}. The SRO grid brings together GT3 manufacturers from around the world, with Balance of Performance between the models.`,
  );
}

export function getTeamBio(categoryId: string, team: Team): TeamBio | undefined {
  const exact = TEAM_BIOS[`${categoryId}:${team.id}`];
  if (exact) return exact;
  const known = lookupTeamAssets(team.name)?.bio;
  if (known) return known;
  if (LIVE_SERIES[categoryId]) return generateLiveTeamBio(categoryId, team);
  return undefined;
}
