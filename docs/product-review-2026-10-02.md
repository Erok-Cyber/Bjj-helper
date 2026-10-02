# GrappleLog – produktgenomgång, 2 oktober 2026

## Omfattning och prioritering

Genomgången omfattar hela frontendprojektet, alla huvudvyer och dialogtyper, kontoflöden, adminfunktioner, lokal lagring, Supabase-anrop, SQL/RLS, Edge Functions, PWA och bygg-/publiceringsflödet. Befintliga träningsdata och databasstrukturen lämnas kvar. Inga riktiga användares lösenord, kontostatus eller träningsposter ändrades under testerna.

Prioriteringen var: **dataintegritet och behörighet → fungerande huvudflöden → mobil/tangentbord/läsbarhet → visuell förenkling → teknisk städning**. Större produktförändringar finns separat som förslag.

## Granskning sida för sida

| Område | Granskat | Genomfört/resultat |
|---|---|---|
| Appskal och navigation | Desktopmeny, mobilmeny, bottennav, profillänk, omladdning och webbläsarens bakåtknapp | Huvudvyn sparas i URL. Bakåt/framåt återställer vyn. Aktiva länkar har `aria-current`. Mobilmenyn får dialogsemantik, fokuslås, Escape och återställt fokus. |
| Home | Logga pass, coachgenväg, veckomål, mattid, ronder, tävlingsmål, senaste pass, drillkö, A-game, system och veckofokus | Log session öppnar formuläret direkt. Kortare huvudtext. Veckomått räknar kalenderveckan och utesluter framtida pass. Gammalt veckofokus används inte som aktuellt fokus på startsidan. Lokal plan visas även om hämtningen misslyckas. |
| Sessions | Mallar, datum, format, siffror, betyg, teknikval, partners, anteckningar, reviewfrågor, skapa/redigera/radera, sökning | Molnsvar inväntas innan formulär stängs eller poster tas bort. Återkoppling och skydd mot dubbelklick. Datum och heltal valideras. Sökning omfattar datum, partners, fokus och tekniker. Tom sökträff skiljs från tom historik. "Needs work" syns på passet. Radering kräver bekräftelse. |
| Library | Kategorier, sökning, A-game, drillkö, låg confidence, random drill, eget tillägg, redigering/radering, video och taggar | Sökträffarnas kategorier öppnas automatiskt. Dublettnamn ger begripligt fel. Sparningar och borttagning inväntar molnet. Samtidiga ändringar av samma teknik blockeras för att undvika överskrivning. Länkar begränsas till HTTP/HTTPS. |
| Discover | Teknik- och systemkatalog, kategorier, positions-/submissionlänkar, detaljdialoger, referenser, kopiera till egen samling | Sökningen fungerar även när kategori är All. Import-/lägg till-knappar visar sparfel. Befintligt innehåll och relationer bevaras. |
| Smart import | Lokal radtolkning, AI-tolkning, förhandsgranskning, import och fel | AI-resultat kontrolleras och normaliseras. Max 40 tekniker per analys. Upprepade tekniknamn hoppas över. Vid avbruten molnimport behålls sparade poster, och återförsök hoppar över dem. Gemensam dialog och felhantering. |
| Voice log | Inspelning, stopp, stängning, textrecap, AI-utkast, spara och efterreview | Mikrofonspår stoppas när dialogen stängs, även efter sen behörighetsrespons. Ingen analys efter stängning. Inspelning kräver inloggning. Inspelning och textanalys kan inte användas samtidigt. AI-värden kontrolleras. Sparfel behåller utkastet. Lokalt datum används. |
| My Systems | Eget system, katalogkopia, systemdetaljer, referenser och taggar | Molnsparning inväntas när system läggs till från Library. Tom lista får ett konkret nästa steg. Tom systemlista fylls inte längre automatiskt med exempeldata vid normalisering. |
| Gameplan | Skapa system, redigera metadata, nod/länk-redigering, dra/anslut, ångra/gör om, teknikmatchning, manuella referenser, sparstatus | Separat sparjobb per konto och system. Ändringar till samma system skrivs i ordning. Kö överlever intern navigation; misslyckade ändringar kan återförsökas. Fel visas även efter byte till annan huvudvy. Varning vid stängning med väntande ändringar. Diagrammets snabbkommandon stör inte textfält/dialoger. Dubbel Delete-hantering borttagen. Systemnamn och länkar valideras. |
| Decision trainer | Tomt diagram, visa svar, nästa situation och stängning | Befintligt flöde bevarat och testat. Gemensam tillgänglig dialog. |
| Analytics | Totalsiffror, veckograf, senaste sju dagar, confidence, round trend, AI-veckofokus | Diagrammet visar åtta riktiga ISO-veckor i ordning, inklusive tomma veckor och korrekt årsskifte. Rullande sjudagarsperiod utesluter framtida pass. Lokal plan utges inte för moln-AI eller sparad kontodata. Sparfel visas. Färre inramade underkort ger lugnare hierarki. |
| AI Coach | Frågor, exempelprompter, molnsvar, lokal fallback, busy och scroll | Samtidiga skickningar blockeras. Svaret scrollas fram. Lokal fallback visas som sådan, med begriplig status. Textfältet har ett tillgängligt namn. |
| Profile | Namn, rank, stripes, gym, mål, fokus, datum, vikt, spara och signout | Validering före sparning. UI visar inte osparade profiländringar som sparade. Bekräftelse intill Save profile. Signout-fel hanteras. Tekniska RLS-/miljövariabel-/API-kort ersatta med korta användartexter. |
| Backup | Export, felaktig JSON, ogiltiga underobjekt, merge, återförsök, import till annat konto | Filgräns 5 MB. Hela innehållet valideras innan ändringar. Import slår ihop poster efter ID; befintliga andra poster raderas inte. Kontoöverskridande import får stabila nya ID:n och omkopplade teknikrelationer. Återförsök dubblerar inte poster. Skapandedatum bevaras vid molnimport. Import är stegvis, inte en databastransaktion. |
| Auth/onboarding | Signup, vanlig inloggning, admininloggning, bekräftelsemail, recovery, fyra onboardingsteg | Enter kan skicka inloggning. Glömt lösenord finns på Sign in. Onboarding har Back och synliga sparfel. Skip använder rätt profilvärde. Upprepade SIGNED_IN-händelser vid flikfokus laddar inte över pågående arbete. Gamla autentiseringshämtningar får inte appliceras efter utloggning/kontobyte. |
| Account security | Matchning/längd, lösenordsbyte, reauth-kod och recoverylänk | Befintlig säkerhetslogik bevarad. Regressionstest av validering, kodsteg och recovery efter reload. Inga riktiga lösenord ändrades. |
| Administration | Separat adminhem, behörighetskontroll, lista/sök/paginering, manuell bekräftelse, resetmail, lösenord, block/unblock, skyddade konton | Serverägd `app_metadata` och aktuell användare kontrolleras på servern. Vanliga användare och egna metadata kan inte ge behörighet. Skyddade administratörer, bekräftelsekrav, återkallad behörighet, fel och samtliga fem åtgärder regressionstestade. Sökningen gäller uttryckligen aktuell sida. |
| PWA | Manifest, ikoner, service worker, installprompt, Android/iOS-guider | Installationshändelsen fångas även innan Profile öppnas. Förbrukad prompt återanvänds inte efter avbrytande. iPad med desktop-UA känns igen. Ingen App Store/Play Store-koppling tillagd. |

## Gemensam design och tillgänglighet

- Gemensam dialog för formulär, import och röstloggning: korrekt namn, dialogroll, fokuslås, Escape, återställt fokus och låst bakgrundsscroll.
- Stabila fältnamn via `aria-labelledby`; textarea-innehåll och selectalternativ blir inte del av fältnamnet.
- Synliga fokusindikatorer för knappar, länkar, inputs, selects, textarea och details-summary.
- Enhetlig lägsta knapphöjd 44 px; befintlig typografisk skala och mobilens datumbegränsningar behålls.
- Felmeddelanden är text och annonseras som alerts, inte bara färg. Betyg och valda tekniker har tillgängliga etiketter/pressed-state.
- Färre boxar inuti veckoplanen och passreview. Konto-/inställningssidan tar bort tekniska informationskort som inte hjälper användaren utföra sin uppgift.
- Korta feedbackmeddelanden placeras vid relevant åtgärd.

## Kod, data och drift

Återanvändbara delar har brutits ut: `Modal`/`useDialogFocus`, `ActionButton`, `dates`, `backup` och `flowPersistence`. Ingen total omskrivning av App eller ny datamodell.

Molnmutationer verifierar aktuell användare och förväntad ägare. Utloggad mutation ger fel i stället för tyst framgång. Molnlästa träningsposter filtreras uttryckligen på konto utöver RLS. Molnkontots data skrivs inte till den gemensamma lokala previewlagringen vid utloggning. Normalisering av molndata ändrar inte lokal profilidentitet.

`npm test` kör befintliga adminbehörighetstester samt nya regressionstester för datum, backup och ordnade autosparningar. CI kör tester före byggning. Genererade TypeScript- och Supabase-temporärfiler ignoreras.

Read-only-kontroll av aktiva databasen: profiles, techniques, sessions, flows och weekly_focuses har RLS och fyra policies var. `admin_login_aliases` har avsiktligt RLS utan klientpolicies: aliasen är endast tillgängliga för den betrodda serverfunktionen. Ingen ändring av databasschema eller roller i denna leverans.

## Verifiering

- Produktionsbygge med TypeScript och Vite godkänt.
- **20 domän-/behörighetstester**: 16 befintliga adminfall och fyra nya domänfall.
- **55 renderkontroller**: Home, Sessions, passformulär, Library, Discover, Gameplan, systemdetalj, Analytics, veckofokus, Coach och Profile i 320, 390, 768, 1280 och 1920 px. Ingen upptäckt horisontell sidöverrinning, runtime-krasch eller synlig vanlig text under 13 px i kontrollerna. Diagrametiketter undantogs från textstorlekskontrollen.
- Skapa, redigera och återladda pass med reviewfält vid 390/1440 px.
- Simulerat molnfel: formulär och anteckningar kvar, lyckat återförsök, profilen uppdateras först efter svar, flikfokus återläser inte data och utloggning skriver inte molnprofil till lokal data.
- Sökresultat i Discover/Library, direkt passloggning, bakåtnavigation och backupvalidering/merge verifierade i webbläsare.
- Gameplan: lägg till nod, ångra, gör om, metadata, beslutsträning och tangentbordsfokus verifierade.
- Röst/import: mikrofonstängning och bevarat AI-utkast vid sparfel verifierade med simulerad mikrofon/AI.
- Onboarding och authvyer kontrollerade vid 320 px. Katalogdialogers centrering och overflow kontrollerade vid 390/1440 px.
- Admin- och lösenordsflöden testade med simulerade svar; direkta serverhandler-tester kontrollerar avvisade obehöriga åtgärder.

**Testgränser:** Webbläsartester använder Chromium och isolerad testdata. Inga live-email skickades och ingen riktig användare ändrades. Faktisk Groq-svarskvalitet, fysisk mikrofon, iOS Safari/Android-installation, skärmläsare på fysisk enhet och verklig samtidig användning från två enheter är inte fullständigt E2E-verifierade. RLS-policyerna är granskade och den aktiva konfigurationen kontrollerad; detta är inte ett penetrationstest.

## Kvarstående förbättringar, i prioritetsordning

| Prioritet | Förbättring | Skäl / omfattning |
|---|---|---|
| Hög | Aktivera skydd mot läckta lösenord i Supabase Auth om tillgängligt | Projektets säkerhetsrådgivare flaggar att det är avstängt. Kräver kontroll av Auth-inställning/abonnemang; ändrades inte i denna release. |
| Hög | Tydliga gränser och tidsgränser för serverns AI-anrop | De fyra AI-funktionerna autentiserar användaren men behöver en gemensam policy för payloadgränser, timeout, rate limit och strikt resultatvalidering. Klientvalidering förbättrad här, men ersätter inte serverkontroller. |
| Medel | Utkast och beständig offlinekö per konto | Nuvarande autosparkö ligger i minnet och varnar innan stängning. Ett browserstopp kan fortfarande förlora osparat arbete. Kräver IndexedDB, kontoisolering och konfliktregler. |
| Medel | Dela upp stora vyer och ladda diagram vid behov | Produktions-JavaScript är cirka 1 MB okomprimerat / 303 kB gzip. App.tsx och temaöverlagringarna är fortfarande stora. Gradvis moduluppdelning bör ske med regressionstester. |
| Medel | Arkivera teknik/system i stället för permanent borttagning | Sessioner kan hänvisa till en raderad teknik via ID-array; passet finns kvar men tekniknamnet visas inte längre. En arkivmodell eller historisk snapshot löser det utan att skriva om historik. |
| Medel | Transaktionell backupimport och konflikthantering | Nuvarande merge visar delvis sparat resultat och är återförsökbar. En servertransaktion behövs för allt-eller-inget och tydliga konflikter mellan två enheter. |
| Lägre | Konsolidera startsidans tekniköversikter | Recent techniques, A-game och drillkö kan visa samma teknik. Behåll en tydlig drillkö och gör övriga översikter mer kompakta/valbara. |
| Lägre | Kortare veckoplan och mindre upprepad evidens | Lokal temamatchning kan återanvända samma passanteckning i flera teman. Bättre deduplicering behövs innan resultatet blir en pålitlig trendanalys vid större historik. |
| Lägre | Robustare lokal lagring och global felgräns | Hantera full/blockerad browserlagring, skadad äldre lokal export och återställning med bevarad backup. Molnläget har inte en fullständig offline-/återställningsmodell. |

## Produktförslag för senare

| Funktion | Vad / problem den löser | Nytta | Placering |
|---|---|---|---|
| Repetitionskö med senaste träningsdatum | Föreslå några tekniker som inte repeterats nyligen, baserat på loggade pass och confidence. Gör drillkön konkret före träning. | Hög; naturlig fortsättning på befintlig drillkö. | Home och Library → Drill queue. |
| Veckomål med uppföljning | Ett position-/beteendemål, exempelvis hålla inside frames i tre ronder, med snabb uppföljning efter pass. Binder ihop review och faktisk träning. | Hög; mer användbart än fler generella statistikkort. | Veckofokus och Log session. |
| Kopiera senaste passets grundinställningar | Återanvänd format, tid, teknikurval och partners men töm resultat/anteckningar. | Medel–hög för återkommande klasser. | New session, intill befintliga mallar. |
| Beständiga passutkast | Rädda ofärdiga anteckningar efter stängning, refresh eller tappad anslutning. | Hög; bör kombineras med kontospecifik offlinekö. | Log session och liten återuppta-indikator på Home. |
| Adminhistorik | Registrera vem som bekräftade, blockerade eller återställde ett konto och när, utan att lagra lösenord. | Medel nu, högre när fler administratörer/användare tillkommer. | Privat admin → User history. |

Ingen social feed, rankingsystem, betalningsfunktion eller fler dekorativa dashboards rekommenderas för den här produkten. Först bör sparande, snabb passloggning och en tydlig träningsloop fortsätta förbättras.
