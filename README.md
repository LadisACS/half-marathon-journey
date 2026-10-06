# Half-Marathon Journey Cloud v3

Cloudová verze používá Supabase Auth + PostgreSQL databázi.

## Nasazení na GitHub Pages
Nahraď v repozitáři tyto soubory:
- index.html
- app.js
- manifest.webmanifest
- sw.js
- icon.svg

GitHub Pages zůstává na stejné URL.

## Supabase
Project URL je již nastavená ve `app.js`.
Použit je pouze veřejný publishable key.

## Přihlášení
Aplikace podporuje e-mail + heslo. Pokud je v Supabase zapnuté potvrzení e-mailu,
nový uživatel musí kliknout na potvrzovací odkaz.

## Migrace
Sekce "Záloha / migrace" umí načíst stará lokální data z předchozí verze
uložená pod klíči `hmJourneyV2` nebo `hmJourney` a nahrát je do cloudu.
