/* Contact page form. Uses the shared helper in js/lead-form.js and posts to contact-handler.php (Gmail SMTP).
   On success a pop-up is shown and the form stays on the page (cleared, ready for another message). */
(function () {
  var form = document.getElementById('contactForm');
  if (!form || !window.TridentLead) return;
  var L = TridentLead;
  var card = document.getElementById('contactCard'),
      submit = document.getElementById('contactSubmit'),
      err = document.getElementById('contactError');
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var LABEL = 'Submit Project Details';

  L.loadToken(form).catch(function () { /* retried on submit */ });
  L.liveClear(form);

  // Header "Get Started" buttons (data-open-modal) jump to this form instead of opening the dialog.
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-open-modal]');
    if (!t) return;
    if (t.getAttribute('data-service')) L.setService(form, t.getAttribute('data-service'));
    card.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
    setTimeout(function () { form.querySelector('input:not([tabindex="-1"])').focus({ preventScroll: true }); }, reduce ? 0 : 450);
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault(); err.textContent = '';
    var bad = L.validate(form);
    if (bad) { bad.focus(); return; }
    submit.disabled = true; submit.textContent = 'Sending…';
    L.post(form, false)
      .then(function (data) {
        if (data.success) {
          form.reset(); L.clearErrors(form); L.showSuccess();
          L.loadToken(form).catch(function () {});
          return;
        }
        var first = L.showServerErrors(form, data.errors);
        if (first) first.focus();
        else err.textContent = data.message || 'Something went wrong. Please try again or email ' + L.MAIL + '.';
        L.loadToken(form).catch(function () {});
      })
      .catch(function () { err.textContent = 'Network error. Please email ' + L.MAIL + ' instead.'; })
      .then(function () { submit.disabled = false; submit.textContent = LABEL; });
  });
})();