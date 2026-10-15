# Trident Techserv – contact form backend

1. Open `config.php` and set `SMTP_USERNAME` (Gmail that sends mail) and `SMTP_PASSWORD`
   (16-character Google App Password – myaccount.google.com/apppasswords).
   Also set the real live domain in `ALLOWED_ORIGIN`.
2. Run on a PHP server (Live Server on :5502 cannot run PHP):
   - XAMPP: put the folder in `htdocs`, open http://localhost/trident-techserv/contact.html
   - or from this folder: `php -S localhost:8000`, open http://localhost:8000/contact.html
3. Submit the form: you get the enquiry at `NOTIFY_TO_EMAIL`, the visitor gets an auto-reply.

Files: contact-handler.php (endpoint), csrf-token.php (token), config.php (settings, git-ignored),
vendor/ (PHPMailer 7.1.1), js/contact.js (front end).
