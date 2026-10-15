/* Shared lead-form helper used by the home-page dialog (modal.js) and the contact page (contact.js).
   Validates fields, fetches the CSRF token and posts to contact-handler.php, which emails the enquiry. */
window.TridentLead = (function () {
  // Local (XAMPP / php -S / Live Server on localhost or LAN) -> PHP backend.
  // Deployed (Vercel etc., which cannot run PHP) -> Vercel Function that reads its settings from environment variables.
  var IS_LOCAL = location.protocol === 'file:' || /^(localhost|127\.|192\.168\.|10\.|\[::1\])/.test(location.hostname);
  var ENDPOINT = IS_LOCAL ? 'contact-handler.php' : '/api/contact';
  var TOKEN_URL = 'csrf-token.php';
  var MAIL = 'headtrident.techserv@gmail.com';

  // field id -> [validator, message]
  var RULES = {
    clientName: [function (v) { return v.length > 1; }, 'Enter your name.'],
    clientEmail: [function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }, 'Enter a valid email address.'],
    clientPhone: [function (v) { return /^\+?[\d\s()-]{7,}$/.test(v); }, 'Enter a valid phone number.'],
    clientService: [function (v) { return v !== ''; }, 'Select a service.']
  };
  // backend field name -> field id
  var SERVER_KEY = { name: 'clientName', email: 'clientEmail', phone: 'clientPhone', service: 'clientService' };

  function mark(id, msg) {
    var el = document.getElementById(id), out = document.getElementById(id + '-err');
    if (el) el.setAttribute('aria-invalid', msg ? 'true' : 'false');
    if (out) out.textContent = msg;
  }

  function loadToken(form) {
    if (!IS_LOCAL) return Promise.resolve(''); // the serverless endpoint has no session, so no CSRF token is needed
    return fetch(TOKEN_URL, { credentials: 'same-origin', cache: 'no-store' })
      .then(function (r) { if (!r.ok) throw new Error('token'); return r.json(); })
      .then(function (d) { form.elements.csrf_token.value = d.csrf_token || ''; return d.csrf_token; });
  }

  // Validate every field of the form. Returns the first invalid element (or null).
  function validate(form) {
    var first = null;
    Object.keys(RULES).forEach(function (id) {
      var el = form.querySelector('#' + id); if (!el) return;
      var valid = RULES[id][0](el.value.trim());
      mark(id, valid ? '' : RULES[id][1]);
      if (!valid && !first) first = el;
    });
    return first;
  }

  // Clear a field's error as soon as the visitor fixes it
  function liveClear(form) {
    Object.keys(RULES).forEach(function (id) {
      var el = form.querySelector('#' + id); if (!el) return;
      el.addEventListener(el.tagName === 'SELECT' ? 'change' : 'input', function () {
        if (el.getAttribute('aria-invalid') === 'true' && RULES[id][0](el.value.trim())) mark(id, '');
      });
    });
  }

  function clearErrors(form) {
    Object.keys(RULES).forEach(function (id) { if (form.querySelector('#' + id)) mark(id, ''); });
  }

  // Post the form. Retries once with a fresh token if the session/token expired (HTTP 419).
  function post(form, retry) {
    return Promise.resolve(form.elements.csrf_token.value || loadToken(form)).then(function () {
      return fetch(ENDPOINT, { method: 'POST', credentials: 'same-origin', body: IS_LOCAL ? new FormData(form) : new URLSearchParams(new FormData(form)) });
    }).then(function (res) {
      return res.json().catch(function () { return { success: false, message: '' }; }).then(function (data) {
        if (res.status === 419 && !retry) { form.elements.csrf_token.value = ''; return post(form, true); }
        return data;
      });
    });
  }

  // Show server-side field errors. Returns the first field it marked (or null).
  function showServerErrors(form, errors) {
    var first = null;
    Object.keys(errors || {}).forEach(function (k) {
      var id = SERVER_KEY[k]; if (!id) return;
      mark(id, errors[k]); if (!first) first = form.querySelector('#' + id);
    });
    return first;
  }

  // Pre-select a service in the dropdown (value must match an <option>); empty value resets it.
  function setService(form, value) {
    var sel = form.querySelector('#clientService'); if (!sel) return;
    sel.value = value || '';
    if (sel.value !== (value || '')) sel.value = '';
  }

  // Success pop-up (green tick, "Message received."). Built on demand so both pages share it.
  var popTimer, popLast;
  function showSuccess() {
    var old = document.getElementById('leadPop'); if (old) old.remove();
    clearTimeout(popTimer); popLast = document.activeElement;
    var pop = document.createElement('div');
    pop.className = 'lead-pop'; pop.id = 'leadPop'; pop.setAttribute('role', 'dialog');
    pop.setAttribute('aria-modal', 'true'); pop.setAttribute('aria-labelledby', 'leadPopTitle');
    pop.innerHTML =
      '<div class="lead-pop__box">' +
        '<button class="lead-pop__x" type="button" aria-label="Close"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button>' +
        '<span class="lead-pop__check" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg></span>' +
        '<h3 id="leadPopTitle">Message received.</h3>' +
        '<p>Thanks for reaching out \u2014 our engineering pod will get back to you within 12 business hours.</p>' +
      '</div>';
    document.body.appendChild(pop);
    function close() {
      clearTimeout(popTimer); document.removeEventListener('keydown', onKey);
      pop.classList.remove('is-open'); setTimeout(function () { pop.remove(); }, 250);
      if (popLast && popLast.focus) popLast.focus({ preventScroll: true });
    }
    function onKey(e) { if (e.key === 'Escape') close(); }
    pop.addEventListener('click', function (e) { if (e.target === pop || e.target.closest('.lead-pop__x')) close(); });
    document.addEventListener('keydown', onKey);
    requestAnimationFrame(function () { pop.classList.add('is-open'); pop.querySelector('.lead-pop__x').focus({ preventScroll: true }); });
    popTimer = setTimeout(close, 9000); // closes itself after 9 seconds
  }

  return { showSuccess: showSuccess, mark: mark, loadToken: loadToken, validate: validate, liveClear: liveClear, clearErrors: clearErrors,
           post: post, showServerErrors: showServerErrors, setService: setService, MAIL: MAIL };
})();