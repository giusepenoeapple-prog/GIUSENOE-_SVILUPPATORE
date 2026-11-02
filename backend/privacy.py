from html import escape

CONTACT = "giuseppenoe@libero.it"

SECTIONS = {
    "it": ("Informativa sulla privacy", "Ultimo aggiornamento: giugno 2026", [
        ("Titolare del trattamento", f"Giuseppe Noè – contatto: {CONTACT}."),
        ("Dati raccolti", "Email, nome, età, città di residenza, genere (facoltativo), hobby e loro priorità, gruppi Facebook/Instagram indicati, posizione GPS solo se acconsenti, preferiti, cronologia e valutazioni delle attività, messaggi nelle chat di gruppo e con l'assistente IA."),
        ("Finalità", "Generare suggerimenti personalizzati di attività per il tempo libero, mostrare il meteo, consentire chat di gruppo e il recupero della password via email."),
        ("Servizi di terze parti", "Modelli di intelligenza artificiale (tramite Emergent) per generare suggerimenti e risposte; Open-Meteo per il meteo; OpenStreetMap per mappe e luoghi; Google per l'accesso facoltativo; un servizio email per il recupero password. Non usiamo pubblicità né vendiamo i tuoi dati."),
        ("Posizione", "La posizione è facoltativa: se non acconsenti usiamo la città di residenza. Puoi revocare il consenso in qualsiasi momento dal profilo."),
        ("Conservazione", "I dati sono conservati finché il tuo account è attivo. Puoi chiederne la cancellazione scrivendo al contatto indicato."),
        ("I tuoi diritti (GDPR)", "Accesso, rettifica, cancellazione, limitazione, portabilità e opposizione. Puoi presentare reclamo al Garante per la protezione dei dati personali."),
        ("Donazioni", "Le donazioni avvengono tramite PayPal o bonifico: non trattiamo dati di pagamento all'interno dell'app."),
    ]),
    "en": ("Privacy Policy", "Last updated: June 2026", [
        ("Data controller", f"Giuseppe Noè – contact: {CONTACT}."),
        ("Data we collect", "Email, name, age, city of residence, gender (optional), hobbies and their priority, Facebook/Instagram groups you list, GPS location only with your consent, favorites, activity history and ratings, messages in group chats and with the AI assistant."),
        ("Purpose", "Generating personalised free-time activity suggestions, showing the weather, enabling group chats and password recovery by email."),
        ("Third-party services", "AI models (via Emergent) to generate suggestions and answers; Open-Meteo for weather; OpenStreetMap for maps and places; Google for optional sign-in; an email service for password recovery. We show no ads and never sell your data."),
        ("Location", "Location is optional: without consent we use your city of residence. You can revoke consent at any time from your profile."),
        ("Retention", "Data is kept while your account is active. You can request deletion by writing to the contact above."),
        ("Your rights (GDPR)", "Access, rectification, erasure, restriction, portability and objection. You may lodge a complaint with your data protection authority."),
        ("Donations", "Donations go through PayPal or bank transfer: no payment data is processed inside the app."),
    ]),
}


def privacy_html(lang: str) -> str:
    title, updated, items = SECTIONS.get(lang, SECTIONS["en"])
    body = "".join(f"<h2>{escape(h)}</h2><p>{escape(p)}</p>" for h, p in items)
    return f"""<!doctype html><html lang="{escape(lang)}"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1"><title>{escape(title)} – Spend better free time</title>
<style>body{{font-family:Arial,sans-serif;max-width:760px;margin:0 auto;padding:32px 20px;color:#0F172A;background:#FAF9F6;line-height:1.6}}
h1{{color:#E83D84}}h2{{font-size:1.05rem;margin-top:28px}}small{{color:#64748B}}</style></head>
<body><h1>{escape(title)}</h1><small>Spend better free time · {escape(updated)}</small>{body}</body></html>"""
