/* Provence Avenir BTP — interactions légères, sans dépendance externe */
(function () {
  'use strict';

  /* ---------- En-tête : ombre au défilement ---------- */
  var header = document.querySelector('.site-header');
  if (header) {
    var onScroll = function () {
      header.classList.toggle('scrolled', window.scrollY > 10);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ---------- Menu mobile ---------- */
  var burger = document.querySelector('.burger');
  var nav = document.getElementById('nav');
  if (burger && nav) {
    burger.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      burger.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
    });
    nav.addEventListener('click', function (e) {
      if (e.target.tagName === 'A' && window.innerWidth <= 860) {
        nav.classList.remove('open');
        burger.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ---------- Vidéo du bandeau : respect de prefers-reduced-motion ---------- */
  var video = document.querySelector('.hero video');
  if (video) {
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (reduce.matches) {
      video.removeAttribute('autoplay');
      video.pause();
    }
    video.addEventListener('error', function () { video.style.display = 'none'; });
  }

  /* ---------- Bouton « remonter en haut » ---------- */
  var toTop = document.getElementById('to-top');
  if (toTop) {
    var onScrollTop = function () { toTop.classList.toggle('show', window.scrollY > 600); };
    window.addEventListener('scroll', onScrollTop, { passive: true });
    onScrollTop();
    toTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ---------- Formulaire de contact ---------- */
  var form = document.getElementById('devis-form');
  if (!form) return;

  var msg = document.getElementById('form-msg');
  var submit = form.querySelector('button[type="submit"]');
  var endpoint = form.getAttribute('data-endpoint') || '';

  function show(type, text) {
    msg.className = 'form-msg ' + type;
    msg.textContent = text;
  }

  function readForm() {
    return {
      prenom: form.prenom.value.trim(),
      nom: form.nom.value.trim(),
      email: form.email.value.trim(),
      tel: form.tel.value.trim(),
      adresse: form.adresse.value.trim(),
      objet: form.objet.value,
      message: form.message.value.trim()
    };
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var d = readForm();

    /* piège à robots */
    if (form._gotcha && form._gotcha.value) return;

    if (!d.prenom || !d.nom || !d.objet || !d.message) {
      return show('err', 'Merci de remplir tous les champs obligatoires.');
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(d.email)) {
      return show('err', "Cette adresse e-mail ne semble pas valide.");
    }
    if (!form.consentement.checked) {
      return show('err', 'Merci de cocher la case d’acceptation pour continuer.');
    }

    submit.disabled = true;
    submit.textContent = 'Envoi en cours…';

    /* Cas 1 : un service d'envoi est configuré (Formspree ou équivalent) */
    if (endpoint) {
      var payload = Object.assign({}, d, {
        _subject: '[Site] ' + d.objet + ' — ' + d.prenom + ' ' + d.nom,
        _template: 'table',
        _captcha: 'false',
        _replyto: d.email
      });
      fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload)
      })
        .then(function (r) { return r.ok ? { ok: true } : r.json().catch(function () { return { ok: false }; }); })
        .then(function (res) {
          if (res.ok) return done();
          show('err', "L'envoi a échoué. Appelez-nous au 06 35 33 49 26.");
          reset();
        })
        .catch(function () {
          show('err', 'Connexion impossible. Appelez-nous au 06 35 33 49 26.');
          reset();
        });
      return;
    }

    /* Cas 2 : repli sans service — ouverture du logiciel de messagerie */
    var corps = [
      'Nom : ' + d.prenom + ' ' + d.nom,
      'E-mail : ' + d.email,
      'Téléphone : ' + (d.tel || 'non renseigné'),
      'Adresse du projet : ' + (d.adresse || 'non renseignée'),
      'Objet : ' + d.objet,
      '',
      d.message
    ].join('\n');

    window.location.href = 'mailto:provenceavenirbtp@gmail.com'
      + '?subject=' + encodeURIComponent('[Site] ' + d.objet + ' — ' + d.prenom + ' ' + d.nom)
      + '&body=' + encodeURIComponent(corps);

    done('Votre logiciel de messagerie s’ouvre avec le message prérempli. Il vous reste à cliquer sur « Envoyer ».');
  });

  function done(customText) {
    show('ok', customText || 'Merci pour votre envoi. Nous vous répondons sous 48 h ouvrées.');
    form.reset();
    reset();
  }

  function reset() {
    submit.disabled = false;
    submit.textContent = 'Envoyer';
  }
})();
