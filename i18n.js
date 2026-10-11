(function () {
  'use strict';
  const LANGS = [
    { code: 'tr', label: 'Türkçe' },
    { code: 'en', label: 'English' },
    { code: 'ru', label: 'Русский' },
    { code: 'es', label: 'Español' },
    { code: 'az', label: 'Azərbaycanca' },
    { code: 'de', label: 'Deutsch' },
    { code: 'fr', label: 'Français' },
    { code: 'zh', label: '中文' }
  ];
  const MAP = {
    'Dil': ['Language','Язык','Idioma','Dil','Sprache','Langue','语言'],
    'Panolar': ['Boards','Доски','Tableros','Lövhələr','Boards','Forums','板块'],
    'Tema': ['Theme','Тема','Tema','Mövzu','Design','Thème','主题'],
    'Açık tema': ['Light theme','Светлая тема','Tema claro','Açıq tema','Helles Design','Thème clair','浅色主题'],
    'Koyu tema': ['Dark theme','Тёмная тема','Tema oscuro','Tünd tema','Dunkles Design','Thème sombre','深色主题'],
    'Yetkiyi yenile': ['Refresh access','Обновить доступ','Actualizar acceso','İcazəni yenilə','Zugriff erneuern','Actualiser l’accès','刷新权限'],
    'Token değiştikten sonra Owner yetkisini yeniden kontrol et': ['Recheck Owner access after changing the token','Повторно проверить права владельца после смены токена','Volver a comprobar el acceso de propietario tras cambiar el token','Token dəyişdikdən sonra Owner icazəsini yoxla','Owner-Zugriff nach Tokenänderung prüfen','Revérifier l’accès propriétaire après le changement de jeton','更改令牌后重新检查所有者权限'],
    'Yükleniyor…': ['Loading…','Загрузка…','Cargando…','Yüklənir…','Wird geladen…','Chargement…','正在加载…'],
    'Anonim imageboard. Hesap yok, kayıt yok, e-posta yok.': ['Anonymous imageboard. No accounts, sign-ups, or email.','Анонимная имиджборда. Без аккаунтов, регистрации и электронной почты.','Imageboard anónimo. Sin cuentas, registros ni correo electrónico.','Anonim imageboard. Hesab, qeydiyyat və e-poçt yoxdur.','Anonymes Imageboard. Keine Konten, Registrierungen oder E-Mail.','Imageboard anonyme. Pas de compte, d’inscription ni d’e-mail.','匿名图片论坛。无需账户、注册或电子邮件。'],
    '31chan anonim bir imageboard\'dur. Gönderiler ortak sunucu veritabanında saklanır ve diğer ziyaretçiler tarafından görülebilir.': ['31chan is an anonymous imageboard. Posts are stored on a shared server and can be seen by other visitors.','31chan — анонимная имиджборда. Публикации хранятся на общем сервере и видны другим посетителям.','31chan es un imageboard anónimo. Las publicaciones se guardan en un servidor compartido y otros visitantes pueden verlas.','31chan anonim imageboard-dur. Paylaşımlar ümumi serverdə saxlanılır və digər ziyarətçilər tərəfindən görünə bilər.','31chan ist ein anonymes Imageboard. Beiträge werden auf einem gemeinsamen Server gespeichert und sind für andere Besucher sichtbar.','31chan est un imageboard anonyme. Les publications sont stockées sur un serveur partagé et visibles par les autres visiteurs.','31chan 是匿名图片论坛。帖子保存在共享服务器上，其他访客也能看到。'],
    'Rastgele': ['Random','Случайное','Aleatorio','Təsadüfi','Zufällig','Aléatoire','随机'],
    'Konu sınırı yok. Ne istersen paylaş.': ['No topic limits. Share what you want.','Нет ограничений по темам. Публикуйте что угодно.','Sin límites de tema. Comparte lo que quieras.','Mövzu məhdudiyyəti yoxdur. İstədiyini paylaş.','Keine Themenbegrenzung. Teile, was du möchtest.','Aucun sujet imposé. Publiez ce que vous voulez.','主题不限，分享你想分享的内容。'],
    'Teknoloji': ['Technology','Технологии','Tecnología','Texnologiya','Technologie','Technologie','科技'],
    'Donanım, yazılım ve açık kaynak.': ['Hardware, software, and open source.','Оборудование, ПО и открытый код.','Hardware, software y código abierto.','Avadanlıq, proqram təminatı və açıq mənbə.','Hardware, Software und Open Source.','Matériel, logiciels et open source.','硬件、软件与开源。'],
    'Oyunlar': ['Games','Игры','Juegos','Oyunlar','Spiele','Jeux','游戏'],
    'Oyunlar, retro ve incelemeler.': ['Games, retro, and reviews.','Игры, ретро и обзоры.','Juegos, retro y reseñas.','Oyunlar, retro və rəylər.','Spiele, Retro und Rezensionen.','Jeux, rétro et critiques.','游戏、复古与评测。'],
    'Müzik': ['Music','Музыка','Música','Musiqi','Musik','Musique','音乐'],
    'Dinlediğin, yaptığın, önerdiğin.': ['What you listen to, make, or recommend.','То, что слушаешь, создаёшь или советуешь.','Lo que escuchas, creas o recomiendas.','Dinlədiyin, yaratdığın və tövsiyə etdiyin.','Was du hörst, machst oder empfiehlst.','Ce que vous écoutez, créez ou recommandez.','分享你听的、创作的或推荐的音乐。'],
    'Sanat': ['Art','Искусство','Arte','İncəsənət','Kunst','Art','艺术'],
    'Çizim, fotoğraf ve dijital işler.': ['Drawing, photography, and digital art.','Рисунки, фотографии и цифровое искусство.','Dibujo, fotografía y arte digital.','Rəsm, fotoqrafiya və rəqəmsal işlər.','Zeichnungen, Fotos und digitale Kunst.','Dessin, photographie et art numérique.','绘画、摄影与数字艺术。'],
    'Soru Cevap': ['Q&A','Вопросы и ответы','Preguntas y respuestas','Sual-cavab','Fragen und Antworten','Questions-réponses','问答'],
    'Sorularını sor, topluluktan cevap al.': ['Ask questions and get answers from the community.','Задавайте вопросы и получайте ответы сообщества.','Haz preguntas y recibe respuestas de la comunidad.','Suallarını ver, icmadan cavab al.','Stelle Fragen und erhalte Antworten aus der Community.','Posez des questions et obtenez des réponses de la communauté.','提出问题并获得社区回答。'],
    'Yeni soru sor': ['Ask a question','Задать вопрос','Hacer una pregunta','Sual ver','Frage stellen','Poser une question','提出问题'],
    'Yeni konu aç': ['Start a thread','Создать тему','Crear un hilo','Mövzu aç','Thread erstellen','Créer un fil','发起主题'],
    'Cevap yaz': ['Write an answer','Написать ответ','Escribir una respuesta','Cavab yaz','Antwort schreiben','Écrire une réponse','写回答'],
    'Yanıt yaz': ['Write a reply','Написать ответ','Escribir una respuesta','Cavab yaz','Antwort schreiben','Écrire une réponse','写回复'],
    'İsim': ['Name','Имя','Nombre','Ad','Name','Nom','名称'],
    'Anonim': ['Anonymous','Аноним','Anónimo','Anonim','Anonym','Anonyme','匿名'],
    'Soru başlığı': ['Question title','Заголовок вопроса','Título de la pregunta','Sual başlığı','Fragentitel','Titre de la question','问题标题'],
    'Konu': ['Subject','Тема','Tema','Mövzu','Thema','Sujet','主题'],
    'Sorunun ayrıntıları': ['Question details','Подробности вопроса','Detalles de la pregunta','Sualın təfərrüatları','Fragendetails','Détails de la question','问题详情'],
    'Cevabın': ['Your answer','Ваш ответ','Tu respuesta','Cavabın','Deine Antwort','Votre réponse','你的回答'],
    'Yorum': ['Comment','Комментарий','Comentario','Şərh','Kommentar','Commentaire','评论'],
    'Görsel (zorunlu)': ['Image (required)','Изображение (обязательно)','Imagen (obligatoria)','Şəkil (məcburidir)','Bild (erforderlich)','Image (obligatoire)','图片（必填）'],
    'Görsel (isteğe bağlı)': ['Image (optional)','Изображение (необязательно)','Imagen (opcional)','Şəkil (istəyə bağlı)','Bild (optional)','Image (facultative)','图片（可选）'],
    'sage (konuyu öne çıkarma)': ['sage (do not bump thread)','sage (не поднимать тему)','sage (no subir el hilo)','sage (mövzunu yuxarı qaldırma)','sage (Thread nicht hochschieben)','sage (ne pas remonter le fil)','sage（不顶帖）'],
    'Soruyu gönder': ['Post question','Опубликовать вопрос','Publicar pregunta','Sualı göndər','Frage veröffentlichen','Publier la question','发布问题'],
    'Konuyu aç': ['Start thread','Создать тему','Crear hilo','Mövzu aç','Thread erstellen','Créer le fil','发起主题'],
    'Cevabı gönder': ['Post answer','Отправить ответ','Enviar respuesta','Cavabı göndər','Antwort senden','Envoyer la réponse','发布回答'],
    'Gönder': ['Post','Отправить','Publicar','Göndər','Senden','Publier','发布'],
    'Soru başlığı ve ayrıntıları zorunludur. Görsel eklemek isteğe bağlıdır.': ['Question title and details are required. Image is optional.','Заголовок и подробности вопроса обязательны. Изображение необязательно.','El título y los detalles son obligatorios. La imagen es opcional.','Sual başlığı və təfərrüatları vacibdir. Şəkil istəyə bağlıdır.','Fragentitel und Details sind erforderlich. Ein Bild ist optional.','Le titre et les détails sont obligatoires. L’image est facultative.','问题标题和详情为必填项，图片可选。'],
    'JPG, PNG, WEBP veya GIF · en fazla 8 MB · büyük görseller küçültülür.': ['JPG, PNG, WEBP or GIF · up to 8 MB · large images are resized.','JPG, PNG, WEBP или GIF · до 8 МБ · большие изображения уменьшаются.','JPG, PNG, WEBP o GIF · hasta 8 MB · las imágenes grandes se reducen.','JPG, PNG, WEBP və ya GIF · ən çox 8 MB · böyük şəkillər kiçildilir.','JPG, PNG, WEBP oder GIF · bis zu 8 MB · große Bilder werden verkleinert.','JPG, PNG, WEBP ou GIF · 8 Mo maximum · les grandes images sont réduites.','JPG、PNG、WEBP 或 GIF · 最大 8 MB · 大图会缩小。'],
    'Owner Paneli': ['Owner panel','Панель владельца','Panel de propietario','Owner paneli','Owner-Panel','Panneau propriétaire','所有者面板'],
    'Verileri yenile': ['Refresh data','Обновить данные','Actualizar datos','Məlumatları yenilə','Daten aktualisieren','Actualiser les données','刷新数据'],
    'Bakım modu etkin.': ['Maintenance mode is active.','Режим обслуживания включён.','El modo de mantenimiento está activo.','Texniki xidmət rejimi aktivdir.','Wartungsmodus ist aktiv.','Le mode maintenance est actif.','维护模式已启用。'],
    'Bakım modu kapalı': ['Maintenance mode is off','Режим обслуживания выключен','El modo de mantenimiento está desactivado','Texniki xidmət rejimi bağlıdır','Wartungsmodus ist aus','Le mode maintenance est désactivé','维护模式已关闭'],
    'Siteyi geçici kapat': ['Temporarily suspend site','Временно закрыть сайт','Suspender el sitio temporalmente','Saytı müvəqqəti bağla','Website vorübergehend sperren','Suspendre temporairement le site','暂时关闭网站'],
    'Süre (dakika)': ['Duration (minutes)','Срок (минуты)','Duración (minutos)','Müddət (dəqiqə)','Dauer (Minuten)','Durée (minutes)','时长（分钟）'],
    'Neden': ['Reason','Причина','Motivo','Səbəb','Grund','Motif','原因'],
    'İsteğe bağlı': ['Optional','Необязательно','Opcional','İstəyə bağlı','Optional','Facultatif','可选'],
    'Bakım modunu başlat': ['Start maintenance mode','Включить режим обслуживания','Activar mantenimiento','Texniki xidməti başlat','Wartungsmodus starten','Activer la maintenance','开启维护模式'],
    'Bakımı bitir': ['End maintenance','Завершить обслуживание','Finalizar mantenimiento','Texniki xidməti bitir','Wartung beenden','Terminer la maintenance','结束维护'],
    'Kullanıcı / IP / cihaz engeli': ['User / IP / device ban','Блокировка пользователя / IP / устройства','Bloqueo de usuario / IP / dispositivo','İstifadəçi / IP / cihaz bloklaması','Benutzer- / IP- / Gerätesperre','Blocage utilisateur / IP / appareil','用户 / IP / 设备封禁'],
    'Engel türü': ['Ban type','Тип блокировки','Tipo de bloqueo','Blok növü','Sperrtyp','Type de blocage','封禁类型'],
    'Kullanıcı token\'ı': ['User token','Токен пользователя','Token de usuario','İstifadəçi tokeni','Benutzer-Token','Jeton utilisateur','用户令牌'],
    'IP adresi': ['IP address','IP-адрес','Dirección IP','IP ünvanı','IP-Adresse','Adresse IP','IP 地址'],
    'Cihaz token\'ı': ['Device token','Токен устройства','Token del dispositivo','Cihaz tokeni','Geräte-Token','Jeton de l’appareil','设备令牌'],
    'Hedef değer': ['Target value','Целевое значение','Valor objetivo','Hədəf dəyəri','Zielwert','Valeur cible','目标值'],
    'Süre (dakika, 0 = kalıcı)': ['Duration (minutes, 0 = permanent)','Срок (минуты, 0 = навсегда)','Duración (minutos, 0 = permanente)','Müddət (dəqiqə, 0 = daimi)','Dauer (Minuten, 0 = dauerhaft)','Durée (minutes, 0 = permanent)','时长（分钟，0 = 永久）'],
    'Engelle': ['Ban','Заблокировать','Bloquear','Blokla','Sperren','Bloquer','封禁'],
    'Kick (10 dakika)': ['Kick (10 minutes)','Кик (10 минут)','Expulsar (10 minutos)','Kick (10 dəqiqə)','Kick (10 Minuten)','Expulser (10 minutes)','踢出（10 分钟）'],
    'Aktif engeller yok.': ['No active bans.','Нет активных блокировок.','No hay bloqueos activos.','Aktiv blok yoxdur.','Keine aktiven Sperren.','Aucun blocage actif.','没有有效封禁。'],
    'Ban hedefi bulunamadı.': ['No ban targets found.','Цели для блокировки не найдены.','No se encontraron objetivos de bloqueo.','Bloklama hədəfi tapılmadı.','Keine Sperrziele gefunden.','Aucune cible de blocage trouvée.','未找到封禁目标。'],
    'IP ve cihaz bilgileri yalnızca bu sürümle kaydedilen yeni gönderilerde bulunur; eski gönderilerde boş olabilir.': ['IP and device details are only available for new posts recorded by this version; older posts may have none.','IP и данные устройства доступны только для новых публикаций этой версии; в старых их может не быть.','Los datos de IP y dispositivo solo están disponibles en publicaciones nuevas de esta versión.','IP və cihaz məlumatları yalnız bu versiyada yaradılmış yeni paylaşımlarda olur.','IP- und Gerätedaten gibt es nur bei neuen Beiträgen dieser Version.','Les données IP et appareil ne sont disponibles que pour les nouvelles publications de cette version.','IP 和设备信息仅适用于此版本记录的新帖子，旧帖子可能没有。'],
    'Açık rapor yok.': ['No open reports.','Нет открытых жалоб.','No hay denuncias abiertas.','Açıq şikayət yoxdur.','Keine offenen Meldungen.','Aucun signalement ouvert.','没有待处理举报。'],
    'Kayıt yok.': ['No records.','Нет записей.','No hay registros.','Qeyd yoxdur.','Keine Einträge.','Aucun enregistrement.','没有记录。'],
    'Engeli kaldır': ['Unban','Разблокировать','Desbloquear','Bloku qaldır','Entsperren','Débloquer','解除封禁'],
    'Çözüldü': ['Resolved','Решено','Resuelto','Həll edildi','Gelöst','Résolu','已解决'],
    'Owner modu etkin': ['Owner mode active','Режим владельца включён','Modo propietario activo','Owner rejimi aktivdir','Owner-Modus aktiv','Mode propriétaire actif','所有者模式已启用'],
    'Büyütmek için tıkla': ['Click to enlarge','Нажмите, чтобы увеличить','Haz clic para ampliar','Böyütmək üçün kliklə','Zum Vergrößern klicken','Cliquer pour agrandir','点击放大'],
    'Sen': ['You','Вы','Tú','Sən','Du','Vous','你'],
    'Sil': ['Delete','Удалить','Eliminar','Sil','Löschen','Supprimer','删除'],
    'Raporla': ['Report','Пожаловаться','Denunciar','Şikayət et','Melden','Signaler','举报'],
    '[Sil]': ['[Delete]','[Удалить]','[Eliminar]','[Sil]','[Löschen]','[Supprimer]','[删除]'],
    '[Raporla]': ['[Report]','[Пожаловаться]','[Denunciar]','[Şikayət et]','[Melden]','[Signaler]','[举报]'],
    'Ana sayfaya dön': ['Return home','На главную','Volver al inicio','Ana səhifəyə qayıt','Zur Startseite','Retour à l’accueil','返回首页'],
    'Bulunamadı': ['Not found','Не найдено','No encontrado','Tapılmadı','Nicht gefunden','Introuvable','未找到'],
    'Bu pano veya konu yok ya da silinmiş.': ['This board or thread does not exist or was deleted.','Эта доска или тема не существует либо удалена.','Este tablero o hilo no existe o fue eliminado.','Bu lövhə və ya mövzu yoxdur və ya silinib.','Dieses Board oder dieser Thread existiert nicht oder wurde gelöscht.','Ce forum ou fil n’existe pas ou a été supprimé.','此板块或主题不存在或已删除。'],
    'Liste': ['List','Список','Lista','Siyahı','Liste','Liste','列表'],
    'Katalog': ['Catalog','Каталог','Catálogo','Kataloq','Katalog','Catalogue','目录'],
    'Yenile': ['Refresh','Обновить','Actualizar','Yenilə','Aktualisieren','Actualiser','刷新'],
    'Konuyu açabilirsin': ['You can start a thread','Вы можете создать тему','Puedes crear un hilo','Mövzu aça bilərsən','Du kannst einen Thread erstellen','Vous pouvez créer un fil','你可以发起主题'],
    'Yanıt atlandı.': ['Reply omitted.','Ответ пропущен.','Respuesta omitida.','Cavab ötürüldü.','Antwort ausgelassen.','Réponse omise.','已省略回复。'],
    'Bakım modu kapalı': ['Maintenance mode is off','Режим обслуживания выключен','El modo de mantenimiento está desactivado','Texniki xidmət rejimi bağlıdır','Wartungsmodus ist aus','Le mode maintenance est désactivé','维护模式已关闭'],
    'Görsel yok': ['No image','Нет изображения','Sin imagen','Şəkil yoxdur','Kein Bild','Aucune image','无图片'],
    'Son gönderiler': ['Recent posts','Последние публикации','Publicaciones recientes','Son paylaşımlar','Neueste Beiträge','Publications récentes','最新帖子'],
    'Kurallar': ['Rules','Правила','Reglas','Qaydalar','Regeln','Règles','规则'],
    'Yasa dışı içerik paylaşmak yasaktır.': ['Illegal content is prohibited.','Публикация незаконного контента запрещена.','Está prohibido publicar contenido ilegal.','Qanunsuz məzmun paylaşmaq qadağandır.','Illegale Inhalte sind verboten.','Les contenus illégaux sont interdits.','禁止发布违法内容。'],
    'Başkalarının kişisel bilgilerini (adres, telefon vb.) paylaşma.': ['Do not share other people’s personal information (address, phone, etc.).','Не публикуйте личные данные других людей (адрес, телефон и т. д.).','No compartas datos personales de otras personas (dirección, teléfono, etc.).','Başqalarının şəxsi məlumatlarını (ünvan, telefon və s.) paylaşma.','Teile keine persönlichen Daten anderer Personen.','Ne partagez pas les informations personnelles d’autrui.','请勿分享他人的个人信息（地址、电话等）。'],
    'Spam ve tekrar eden gönderiler yapma.': ['Do not post spam or duplicates.','Не публикуйте спам и дубликаты.','No publiques spam ni mensajes repetidos.','Spam və təkrarlanan paylaşımlar etmə.','Veröffentliche keinen Spam oder Duplikate.','Ne publiez pas de spam ni de doublons.','请勿发布垃圾信息或重复帖子。'],
    'Paylaştığın görsellerin telif haklarına saygı göster.': ['Respect the copyright of images you share.','Соблюдайте авторские права на публикуемые изображения.','Respeta los derechos de autor de las imágenes que compartes.','Paylaşdığın şəkillərin müəllif hüquqlarına hörmət et.','Beachte das Urheberrecht der geteilten Bilder.','Respectez les droits d’auteur des images partagées.','尊重所分享图片的版权。'],
    'Henüz gönderi yok. İlk konuyu sen aç.': ['No posts yet. Start the first thread.','Публикаций пока нет. Создайте первую тему.','Aún no hay publicaciones. Crea el primer hilo.','Hələ paylaşım yoxdur. İlk mövzunu sən aç.','Noch keine Beiträge. Erstelle den ersten Thread.','Aucune publication pour le moment. Créez le premier fil.','暂无帖子，来发起第一个主题吧。'],
    'Bu panoda henüz konu yok.': ['No threads on this board yet.','На этой доске пока нет тем.','Aún no hay hilos en este tablero.','Bu lövhədə hələ mövzu yoxdur.','Noch keine Threads auf diesem Board.','Aucun fil sur ce forum pour le moment.','此板块暂无主题。'],
    'Bu panoda henüz soru yok. Aşağıdan ilk soruyu sorabilirsin.': ['No questions here yet. Ask the first one below.','Здесь пока нет вопросов. Задайте первый ниже.','Aún no hay preguntas. Haz la primera abajo.','Burada hələ sual yoxdur. İlk sualı aşağıda ver.','Noch keine Fragen. Stelle unten die erste.','Aucune question pour le moment. Posez la première ci-dessous.','这里还没有问题，请在下方提出第一个问题。'],
    'Listele': ['List','Список','Lista','Siyahı','Liste','Liste','列表'],
    'Neden belirtilmedi': ['No reason provided','Причина не указана','No se indicó un motivo','Səbəb göstərilməyib','Kein Grund angegeben','Aucun motif indiqué','未提供原因'],
    'Kalıcı': ['Permanent','Навсегда','Permanente','Daimi','Dauerhaft','Permanent','永久'],
    'Neden': ['Reason','Причина','Motivo','Səbəb','Grund','Motif','原因'],
    'Token, IP veya cihaz belirteci': ['Token, IP, or device identifier','Токен, IP или идентификатор устройства','Token, IP o identificador del dispositivo','Token, IP və ya cihaz identifikatoru','Token, IP oder Gerätekennung','Jeton, IP ou identifiant d’appareil','令牌、IP 或设备标识符'],
    'Görsel okunamadı.': ['Could not read image.','Не удалось прочитать изображение.','No se pudo leer la imagen.','Şəkil oxunmadı.','Bild konnte nicht gelesen werden.','Impossible de lire l’image.','无法读取图片。'],
    'Dosya okunamadı.': ['Could not read file.','Не удалось прочитать файл.','No se pudo leer el archivo.','Fayl oxunmadı.','Datei konnte nicht gelesen werden.','Impossible de lire le fichier.','无法读取文件。'],
    'Eruda yüklenemedi. İnternet bağlantısını kontrol et.': ['Could not load Eruda. Check your internet connection.','Не удалось загрузить Eruda. Проверьте подключение к интернету.','No se pudo cargar Eruda. Comprueba tu conexión.','Eruda yüklənmədi. İnternet bağlantını yoxla.','Eruda konnte nicht geladen werden. Prüfe die Internetverbindung.','Impossible de charger Eruda. Vérifiez votre connexion.','无法加载 Eruda，请检查网络连接。']
  };
  const LANG_INDEX = { en: 0, ru: 1, es: 2, az: 3, de: 4, fr: 5, zh: 6 };
  const SELECTOR = '#languageSelect';
  const SKIP = '.pcomment,.pname,.psubj,.pid,.pimg figcaption,.snip,.csub,.cmeta,script,style,textarea,input,option';
  const originalText = new WeakMap();
  const originalAttrs = new WeakMap();
  let lang = localStorage.getItem('31chan:language') || 'tr';
  function translateText(source) {
    if (lang === 'tr') return source;
    const item = MAP[source];
    if (item) return item[LANG_INDEX[lang]] || source;
    let m = source.match(/^\/([a-z]+)\/ · (.+)$/);
    if (m) return '/' + m[1] + '/ · ' + translateText(m[2]);
    m = source.match(/^\/([a-z]+)\/ (.+)$/);
    if (m) return '/' + m[1] + '/ ' + translateText(m[2]);
    m = source.match(/^(\d+) konu · (\d+) gönderi \(bu tarayıcıda\)$/);
    if (m) return lang === 'ru' ? m[1] + ' тем · ' + m[2] + ' публикаций (в этом браузере)' : lang === 'es' ? m[1] + ' hilos · ' + m[2] + ' publicaciones (en este navegador)' : lang === 'az' ? m[1] + ' mövzu · ' + m[2] + ' paylaşım (bu brauzerdə)' : lang === 'de' ? m[1] + ' Threads · ' + m[2] + ' Beiträge (in diesem Browser)' : lang === 'fr' ? m[1] + ' fils · ' + m[2] + ' publications (dans ce navigateur)' : lang === 'zh' ? '此浏览器中：' + m[1] + ' 个主题 · ' + m[2] + ' 个帖子' : m[1] + ' threads · ' + m[2] + ' posts (in this browser)';
    m = source.match(/^(\d+) konu · (\d+) gönderi$/);
    if (m) return lang === 'ru' ? m[1] + ' тем · ' + m[2] + ' публикаций' : lang === 'es' ? m[1] + ' hilos · ' + m[2] + ' publicaciones' : lang === 'az' ? m[1] + ' mövzu · ' + m[2] + ' paylaşım' : lang === 'de' ? m[1] + ' Threads · ' + m[2] + ' Beiträge' : lang === 'fr' ? m[1] + ' fils · ' + m[2] + ' publications' : lang === 'zh' ? m[1] + ' 个主题 · ' + m[2] + ' 个帖子' : m[1] + ' threads · ' + m[2] + ' posts';
    m = source.match(/^(\d+) yanıt atlandı\.$/);
    if (m) return lang === 'ru' ? 'Пропущено ответов: ' + m[1] : lang === 'es' ? 'Respuestas omitidas: ' + m[1] : lang === 'az' ? m[1] + ' cavab ötürüldü.' : lang === 'de' ? m[1] + ' Antworten ausgelassen.' : lang === 'fr' ? m[1] + ' réponses omises.' : lang === 'zh' ? '已省略 ' + m[1] + ' 条回复。' : 'Skipped replies: ' + m[1];
    m = source.match(/^Konuyu aç · (\d+) yanıt$/);
    if (m) return lang === 'ru' ? 'Открыть тему · ответов: ' + m[1] : lang === 'es' ? 'Abrir hilo · ' + m[1] + ' respuestas' : lang === 'az' ? 'Mövzunu aç · ' + m[1] + ' cavab' : lang === 'de' ? 'Thread öffnen · ' + m[1] + ' Antworten' : lang === 'fr' ? 'Ouvrir le fil · ' + m[1] + ' réponses' : lang === 'zh' ? '打开主题 · ' + m[1] + ' 条回复' : 'Open thread · ' + m[1] + ' replies';
    m = source.match(/^Aktif engeller \((\d+)\)$/);
    if (m) return lang === 'ru' ? 'Активные блокировки (' + m[1] + ')' : lang === 'es' ? 'Bloqueos activos (' + m[1] + ')' : lang === 'az' ? 'Aktiv bloklar (' + m[1] + ')' : lang === 'de' ? 'Aktive Sperren (' + m[1] + ')' : lang === 'fr' ? 'Blocages actifs (' + m[1] + ')' : lang === 'zh' ? '有效封禁（' + m[1] + '）' : 'Active bans (' + m[1] + ')';
    m = source.match(/^Açık raporlar \((\d+)\)$/);
    if (m) return lang === 'ru' ? 'Открытые жалобы (' + m[1] + ')' : lang === 'es' ? 'Denuncias abiertas (' + m[1] + ')' : lang === 'az' ? 'Açıq şikayətlər (' + m[1] + ')' : lang === 'de' ? 'Offene Meldungen (' + m[1] + ')' : lang === 'fr' ? 'Signalements ouverts (' + m[1] + ')' : lang === 'zh' ? '待处理举报（' + m[1] + '）' : 'Open reports (' + m[1] + ')';
    return source;
  }
  function translateDOM() {
    document.documentElement.lang = lang;
    const select = document.querySelector(SELECTOR);
    if (select && select.value !== lang) select.value = lang;
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      const parent = node.parentElement;
      if (!parent || parent.closest(SKIP)) continue;
      if (!originalText.has(node)) originalText.set(node, node.nodeValue);
      const source = originalText.get(node);
      const leading = (source.match(/^\s*/) || [''])[0];
      const trailing = (source.match(/\s*$/) || [''])[0];
      const core = source.slice(leading.length, source.length - trailing.length);
      const next = leading + translateText(core) + trailing;
      if (node.nodeValue !== next) node.nodeValue = next;
    }
    document.querySelectorAll('[title],[placeholder],[aria-label]').forEach(el => {
      if (el.closest(SKIP)) return;
      ['title','placeholder','aria-label'].forEach(attr => {
        if (!el.hasAttribute(attr)) return;
        let attrs = originalAttrs.get(el);
        if (!attrs) { attrs = {}; originalAttrs.set(el, attrs); }
        if (!(attr in attrs)) attrs[attr] = el.getAttribute(attr);
        const next = translateText(attrs[attr]);
        if (el.getAttribute(attr) !== next) el.setAttribute(attr, next);
      });
    });
  }
  function setLanguage(next) {
    if (!LANG_INDEX.hasOwnProperty(next) && next !== 'tr') next = 'tr';
    lang = next;
    localStorage.setItem('31chan:language', lang);
    translateDOM();
  }
  document.addEventListener('change', function (event) {
    if (event.target && event.target.matches(SELECTOR)) setLanguage(event.target.value);
  });
  const observer = new MutationObserver(function () { translateDOM(); });
  observer.observe(document.body, { childList: true, subtree: true, characterData: true });
  window.setTimeout(translateDOM, 0);
  window.ChanI18n = { setLanguage, translate: translateText, languages: LANGS };
})();