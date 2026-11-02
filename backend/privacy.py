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

SECTIONS.update({
    "fr": ("Politique de confidentialité", "Dernière mise à jour : juin 2026", [
        ("Responsable du traitement", f"Giuseppe Noè – contact : {CONTACT}."),
        ("Données collectées", "Email, nom, âge, ville de résidence, genre (facultatif), loisirs et priorité, groupes Facebook/Instagram indiqués, position GPS uniquement avec ton consentement, photo de profil, favoris, historique et notes des activités, messages des chats de groupe et avec l'assistant IA."),
        ("Finalités", "Générer des suggestions d'activités personnalisées, afficher la météo, permettre les chats de groupe et la récupération du mot de passe par email."),
        ("Services tiers", "Modèles d'IA (via Emergent) ; Open-Meteo pour la météo ; OpenStreetMap pour les cartes ; Google pour la connexion facultative ; un service email pour la récupération du mot de passe. Aucune publicité, aucune vente de données."),
        ("Position", "La position est facultative : sans consentement, nous utilisons ta ville. Tu peux révoquer le consentement à tout moment depuis le profil."),
        ("Conservation", "Les données sont conservées tant que ton compte est actif. Tu peux demander leur suppression au contact indiqué."),
        ("Tes droits (RGPD)", "Accès, rectification, effacement, limitation, portabilité et opposition. Tu peux saisir l'autorité de protection des données."),
        ("Dons", "Les dons passent par PayPal ou virement : aucune donnée de paiement n'est traitée dans l'app."),
    ]),
    "es": ("Política de privacidad", "Última actualización: junio de 2026", [
        ("Responsable del tratamiento", f"Giuseppe Noè – contacto: {CONTACT}."),
        ("Datos recogidos", "Email, nombre, edad, ciudad de residencia, género (opcional), aficiones y su prioridad, grupos de Facebook/Instagram indicados, ubicación GPS solo con tu consentimiento, foto de perfil, favoritos, historial y valoraciones, mensajes en chats de grupo y con el asistente IA."),
        ("Finalidad", "Generar sugerencias de actividades personalizadas, mostrar el tiempo, permitir chats de grupo y recuperar la contraseña por email."),
        ("Servicios de terceros", "Modelos de IA (vía Emergent); Open-Meteo para el tiempo; OpenStreetMap para mapas; Google para el acceso opcional; un servicio de email para recuperar la contraseña. Sin publicidad y sin venta de datos."),
        ("Ubicación", "La ubicación es opcional: sin consentimiento usamos tu ciudad. Puedes revocarlo en cualquier momento desde el perfil."),
        ("Conservación", "Los datos se conservan mientras tu cuenta esté activa. Puedes pedir su eliminación al contacto indicado."),
        ("Tus derechos (RGPD)", "Acceso, rectificación, supresión, limitación, portabilidad y oposición. Puedes reclamar ante la autoridad de protección de datos."),
        ("Donaciones", "Las donaciones se hacen por PayPal o transferencia: no tratamos datos de pago en la app."),
    ]),
    "de": ("Datenschutzerklärung", "Zuletzt aktualisiert: Juni 2026", [
        ("Verantwortlicher", f"Giuseppe Noè – Kontakt: {CONTACT}."),
        ("Erhobene Daten", "E-Mail, Name, Alter, Wohnort, Geschlecht (optional), Hobbys und Priorität, angegebene Facebook-/Instagram-Gruppen, GPS-Standort nur mit Einwilligung, Profilfoto, Favoriten, Verlauf und Bewertungen, Nachrichten in Gruppenchats und mit dem KI-Assistenten."),
        ("Zweck", "Personalisierte Freizeitvorschläge, Wetteranzeige, Gruppenchats und Passwort-Wiederherstellung per E-Mail."),
        ("Drittanbieter", "KI-Modelle (über Emergent); Open-Meteo für Wetter; OpenStreetMap für Karten; Google für optionale Anmeldung; ein E-Mail-Dienst für die Passwort-Wiederherstellung. Keine Werbung, kein Datenverkauf."),
        ("Standort", "Der Standort ist optional: ohne Einwilligung nutzen wir deinen Wohnort. Du kannst die Einwilligung jederzeit im Profil widerrufen."),
        ("Speicherdauer", "Daten werden gespeichert, solange dein Konto aktiv ist. Löschung kannst du über den Kontakt anfordern."),
        ("Deine Rechte (DSGVO)", "Auskunft, Berichtigung, Löschung, Einschränkung, Übertragbarkeit und Widerspruch. Beschwerde bei der Datenschutzbehörde möglich."),
        ("Spenden", "Spenden laufen über PayPal oder Überweisung: In der App werden keine Zahlungsdaten verarbeitet."),
    ]),
    "zh": ("隐私政策", "最后更新：2026年6月", [
        ("数据控制者", f"Giuseppe Noè – 联系方式：{CONTACT}。"),
        ("收集的数据", "邮箱、姓名、年龄、居住城市、性别（可选）、爱好及优先级、你填写的 Facebook/Instagram 群组、仅在你同意时的 GPS 位置、头像照片、收藏、活动历史与评价、群聊及 AI 助手消息。"),
        ("用途", "生成个性化的休闲活动推荐、显示天气、支持群聊以及通过邮件找回密码。"),
        ("第三方服务", "AI 模型（通过 Emergent）；Open-Meteo 天气；OpenStreetMap 地图；Google 可选登录；邮件服务用于找回密码。无广告，不出售你的数据。"),
        ("位置", "位置为可选项：未同意时使用你的居住城市。你可随时在个人资料中撤回同意。"),
        ("保存期限", "账户有效期间保存数据。你可通过上述联系方式要求删除。"),
        ("你的权利（GDPR）", "访问、更正、删除、限制、可携带及反对处理。你可向数据保护机构投诉。"),
        ("捐赠", "捐赠通过 PayPal 或银行转账进行：应用内不处理任何支付数据。"),
    ]),
    "ar": ("سياسة الخصوصية", "آخر تحديث: يونيو 2026", [
        ("المسؤول عن البيانات", f"Giuseppe Noè – للتواصل: {CONTACT}."),
        ("البيانات التي نجمعها", "البريد الإلكتروني، الاسم، العمر، مدينة الإقامة، الجنس (اختياري)، الهوايات وأولويتها، مجموعات فيسبوك/إنستغرام التي تذكرها، موقع GPS بموافقتك فقط، صورة الملف الشخصي، المفضلة، سجل الأنشطة وتقييماتها، رسائل المجموعات والمساعد الذكي."),
        ("الغرض", "تقديم اقتراحات أنشطة مخصصة، عرض الطقس، تمكين محادثات المجموعات واستعادة كلمة المرور عبر البريد."),
        ("خدمات الطرف الثالث", "نماذج ذكاء اصطناعي (عبر Emergent)؛ Open-Meteo للطقس؛ OpenStreetMap للخرائط؛ Google للدخول الاختياري؛ خدمة بريد لاستعادة كلمة المرور. لا إعلانات ولا بيع للبيانات."),
        ("الموقع", "الموقع اختياري: بدون موافقة نستخدم مدينتك. يمكنك سحب الموافقة في أي وقت من الملف الشخصي."),
        ("مدة الحفظ", "تحفظ البيانات ما دام حسابك نشطاً. يمكنك طلب حذفها عبر جهة الاتصال."),
        ("حقوقك (GDPR)", "الوصول والتصحيح والحذف والتقييد والنقل والاعتراض. يمكنك تقديم شكوى لهيئة حماية البيانات."),
        ("التبرعات", "تتم التبرعات عبر PayPal أو التحويل البنكي: لا نعالج بيانات دفع داخل التطبيق."),
    ]),
    "pt": ("Política de privacidade", "Última atualização: junho de 2026", [
        ("Responsável pelo tratamento", f"Giuseppe Noè – contacto: {CONTACT}."),
        ("Dados recolhidos", "Email, nome, idade, cidade de residência, género (opcional), hobbies e prioridade, grupos de Facebook/Instagram indicados, localização GPS apenas com consentimento, foto de perfil, favoritos, histórico e avaliações, mensagens nos chats de grupo e com o assistente IA."),
        ("Finalidade", "Gerar sugestões de atividades personalizadas, mostrar o tempo, permitir chats de grupo e recuperar a palavra-passe por email."),
        ("Serviços de terceiros", "Modelos de IA (via Emergent); Open-Meteo para o tempo; OpenStreetMap para mapas; Google para início de sessão opcional; um serviço de email para recuperação. Sem publicidade e sem venda de dados."),
        ("Localização", "A localização é opcional: sem consentimento usamos a sua cidade. Pode revogar a qualquer momento no perfil."),
        ("Conservação", "Os dados são guardados enquanto a conta estiver ativa. Pode pedir a eliminação ao contacto indicado."),
        ("Os seus direitos (RGPD)", "Acesso, retificação, apagamento, limitação, portabilidade e oposição. Pode reclamar junto da autoridade de proteção de dados."),
        ("Doações", "As doações são feitas por PayPal ou transferência: não tratamos dados de pagamento na app."),
    ]),
})


def privacy_html(lang: str) -> str:
    title, updated, items = SECTIONS.get(lang, SECTIONS["en"])
    body = "".join(f"<h2>{escape(h)}</h2><p>{escape(p)}</p>" for h, p in items)
    return f"""<!doctype html><html lang="{escape(lang)}" dir="{'rtl' if lang == 'ar' else 'ltr'}"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1"><title>{escape(title)} – Spend better free time</title>
<style>body{{font-family:Arial,sans-serif;max-width:760px;margin:0 auto;padding:32px 20px;color:#0F172A;background:#FAF9F6;line-height:1.6}}
h1{{color:#E83D84}}h2{{font-size:1.05rem;margin-top:28px}}small{{color:#64748B}}</style></head>
<body><h1>{escape(title)}</h1><small>Spend better free time · {escape(updated)}</small>{body}</body></html>"""
