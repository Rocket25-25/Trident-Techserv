window.TridentModal = {
  init: function () {
    var modal = document.getElementById('intake'), form = document.getElementById('intakeForm');
    if (!modal || !form || !window.TridentLead) return;
    var L = TridentLead, last, submit = document.getElementById('intakeSubmit'), err = document.getElementById('intakeError');
    var LABEL = 'Submit Project Details';

    L.loadToken(form).catch(function () { /* retried on submit */ });
    L.liveClear(form);

    // trigger = the button that was clicked; its data-service pre-selects the service dropdown
    function open(trigger) {
      last = document.activeElement;
      if (!modal.classList.contains('is-done')) L.setService(form, trigger && trigger.getAttribute('data-service'));
      modal.classList.add('is-open'); modal.setAttribute('aria-hidden', 'false');
      setTimeout(function () { var f = form.querySelector('input:not([tabindex="-1"])'); if (f && !modal.classList.contains('is-done')) f.focus(); }, 60);
    }
    function close() {
      modal.classList.remove('is-open'); modal.setAttribute('aria-hidden', 'true');
      setTimeout(function () { modal.classList.remove('is-done'); form.reset(); err.textContent = ''; L.clearErrors(form); }, 300);
      if (last && last.focus) last.focus();
    }

    document.addEventListener('click', function (e) {
      var t = e.target.closest('[data-open-modal]');
      if (t) open(t);
      else if (e.target === modal || e.target.closest('[data-close-modal]')) close();
    });
    document.addEventListener('keydown', function (e) {
      if (!modal.classList.contains('is-open')) return;
      if (e.key === 'Escape') return close();
      if (e.key !== 'Tab') return;
      var f = [].slice.call(modal.querySelectorAll('button,input,select')).filter(function (x) { return x.offsetParent !== null && !x.disabled && x.tabIndex >= 0; });
      if (!f.length) return;
      var first = f[0], lastEl = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); lastEl.focus(); }
      else if (!e.shiftKey && document.activeElement === lastEl) { e.preventDefault(); first.focus(); }
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault(); err.textContent = '';
      var bad = L.validate(form);
      if (bad) { bad.focus(); return; }
      submit.disabled = true; submit.textContent = 'Sending…';
      L.post(form, false)
        .then(function (data) {
          if (data.success) {
            form.reset(); close(); L.showSuccess();
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
  }
};