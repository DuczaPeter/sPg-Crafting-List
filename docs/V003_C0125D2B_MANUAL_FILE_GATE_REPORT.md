# V003-C012.5D2B – Exact manual `file://` gate

## Eredmény

`V003-C012.5D2B – EXACT MANUAL file:// GATE PASS, C013 NOT STARTED`

Ez a kapu nem Codex-automatizálás volt. Az alábbi eredményeket a felhasználó kézzel ellenőrizte a jelenlegi V003 fő alkalmazásfájllal:

`C:\Users\ganos\OneDrive\Munka\Codex\sPg Crafring List\sPg Crafting List.html`

Futtatási mód: közvetlen `file://`. Aktív Star Citizen adatverzió: `4.10.0-LIVE.12519617`.

## Felhasználó által igazolt tények

1. Az alkalmazás rendesen betöltött.
2. A Data / Settings működött és a helyes aktív SC-verziót mutatta.
3. A My Materials működött.
4. A Combined Materials működött.
5. A Blueprint Browser működött.
6. A Crafting List működött.
7. Az FR-86 blueprint megtalálható volt.
8. Az FR-86 Crafting Cardként hozzáadható volt.
9. A Stileron Minimum Q és MAX Q mezői szerkeszthetők voltak.
10. Az FR-86 slot assignmentek külön beállíthatók voltak: Shell → `Minimum Q · Q500+`; Field Array → `MAX Q · Q900+`; Frequency Controller → `Recept szerint`.
11. A bound Card állapotban a Blueprint Browser exact Card nézete és a Crafting List assignmentjei egyeztek.
12. F5 reload után a Crafting Card és a pool assignmentek megmaradtak.
13. Reload után a Combined Materials megőrizte a Minimum Q 500 és MAX Q 900 értékeket; a Kell/Lefoglalva/Hiány metrikák működtek.
14. Nem volt használatot blokkoló layout-hiba.
15. Nem volt használatot blokkoló runtime-hiba, adatvesztés vagy fagyás.

Manual eredmény: **15/15 PASS**.

## Nem blokkoló UX-megjegyzés

F5 reload után a Blueprint Browser alapból JS-300-ra áll vissza. Az FR-86 találat ismételt kiválasztása új transient blueprint preview-t nyit, amely `Recept szerint` assignmenteket mutat. Ez nem persistence failure: a már létrehozott FR-86 Crafting Card Shell Q500 és Field Array Q900 assignmentje megmaradt, és a Combined Materials pooljai is megmaradtak.

Ez a viselkedés kizárólag UX note; a D2B manual gate-et nem blokkolja.

## Határ és integritás

- Application code change: **NO**.
- Automated regression: **NOT RUN** ebben a dokumentáció-only lezárásban.
- Chrome automation/localhost: **NOT RUN** ebben a ciklusban.
- C013: **NOT STARTED**.
- V003 tag/release, push és main merge: nincs.
- Stabil fallback: változatlan V002.
