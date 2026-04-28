(function () {
  if (window.__rrSiteEnhancementsLoaded) {
    return;
  }
  window.__rrSiteEnhancementsLoaded = true;

  var RECIPIENT_EMAIL = "julie.chu@ruirongbio.com";
  var LANGUAGE_STORAGE_KEY = "rr-selected-language";
  var LANGUAGES = [
    { code: "en", label: "English", shortLabel: "EN" },
    { code: "zh-CN", label: "Chinese", shortLabel: "ZH" },
    { code: "ar", label: "Arabic", shortLabel: "AR" },
    { code: "fr", label: "French", shortLabel: "FR" },
    { code: "de", label: "German", shortLabel: "DE" },
    { code: "it", label: "Italian", shortLabel: "IT" },
    { code: "pt", label: "Portuguese", shortLabel: "PT" },
    { code: "ru", label: "Russian", shortLabel: "RU" },
    { code: "es", label: "Spanish", shortLabel: "ES" },
    { code: "nl", label: "Dutch", shortLabel: "NL" }
  ];

  function ready(callback) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback, { once: true });
      return;
    }
    callback();
  }

  function svgIcon(pathMarkup) {
    return '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">' + pathMarkup + "</svg>";
  }

  function getLanguageByCode(code) {
    var match = LANGUAGES.find(function (language) {
      return language.code === code;
    });

    return match || LANGUAGES[0];
  }

  function getSelectedLanguageCode() {
    try {
      return window.sessionStorage.getItem(LANGUAGE_STORAGE_KEY) || "en";
    } catch (_error) {
      return "en";
    }
  }

  function setSelectedLanguageCode(code) {
    try {
      window.sessionStorage.setItem(LANGUAGE_STORAGE_KEY, code);
    } catch (_error) {
      return;
    }
  }

  function buildTranslateUrl(languageCode) {
    if (languageCode === "en") {
      return window.location.href;
    }

    return (
      "https://translate.google.com/translate?sl=en&tl=" +
      encodeURIComponent(languageCode) +
      "&u=" +
      encodeURIComponent(window.location.href)
    );
  }

  function buildTranslateToggleMarkup(language) {
    return (
      '<span class="rr-translate-code">' +
      language.shortLabel +
      "</span>" +
      '<span class="rr-translate-caret" aria-hidden="true">' +
      svgIcon('<path fill="currentColor" d="M7.41 8.59 12 13.17l4.59-4.58L18 10l-6 6-6-6z"/>') +
      "</span>"
    );
  }

  function createTranslateWidget() {
    if (document.querySelector(".rr-translate-shell")) {
      return;
    }

    var shell = document.createElement("div");
    shell.className = "rr-translate-shell";

    var toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "rr-translate-toggle";
    toggle.setAttribute("aria-haspopup", "menu");
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Translate this page");

    var menu = document.createElement("div");
    menu.className = "rr-translate-menu";
    menu.setAttribute("role", "menu");
    menu.hidden = true;
    menu.innerHTML = "<small>Translate</small>";

    function syncTranslateState(languageCode) {
      var selectedLanguage = getLanguageByCode(languageCode);
      toggle.innerHTML = buildTranslateToggleMarkup(selectedLanguage);
      toggle.setAttribute("aria-label", "Selected language " + selectedLanguage.shortLabel);

      Array.prototype.forEach.call(menu.querySelectorAll("button[data-lang]"), function (button) {
        button.classList.toggle("is-active", button.dataset.lang === selectedLanguage.code);
      });
    }

    LANGUAGES.forEach(function (language) {
      var item = document.createElement("button");
      item.type = "button";
      item.setAttribute("role", "menuitem");
      item.dataset.lang = language.code;
      item.innerHTML =
        "<span>" +
        language.label +
        "</span><span aria-hidden=\"true\">" +
        language.shortLabel +
        "</span>";
      item.addEventListener("click", function () {
        setSelectedLanguageCode(language.code);
        syncTranslateState(language.code);
        menu.hidden = true;
        toggle.setAttribute("aria-expanded", "false");
        window.location.assign(buildTranslateUrl(language.code));
      });
      menu.appendChild(item);
    });

    toggle.addEventListener("click", function (event) {
      event.stopPropagation();
      var shouldOpen = menu.hidden;
      menu.hidden = !shouldOpen;
      toggle.setAttribute("aria-expanded", String(shouldOpen));
    });

    document.addEventListener("click", function (event) {
      if (!shell.contains(event.target)) {
        menu.hidden = true;
        toggle.setAttribute("aria-expanded", "false");
      }
    });

    shell.appendChild(toggle);
    shell.appendChild(menu);
    document.body.appendChild(shell);
    syncTranslateState(getSelectedLanguageCode());
  }

  function createContactWidget() {
    if (document.querySelector(".rr-contact-fab")) {
      return;
    }

    var contactButton = document.createElement("button");
    contactButton.type = "button";
    contactButton.className = "rr-contact-fab";
    contactButton.setAttribute("aria-haspopup", "dialog");
    contactButton.setAttribute("aria-controls", "rr-contact-modal");
    contactButton.innerHTML =
      svgIcon(
        '<path fill="currentColor" d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v13a.5.5 0 0 1-.8.4L16 16.5H6.5A2.5 2.5 0 0 1 4 14Zm2.5-.5a.5.5 0 0 0-.5.5V14a.5.5 0 0 0 .5.5H16a1 1 0 0 1 .6.2l1.4 1.05V5.5a.5.5 0 0 0-.5-.5Zm1.5 3a1 1 0 0 1 1-1h6a1 1 0 1 1 0 2H9A1 1 0 0 1 8 8Zm0 4a1 1 0 0 1 1-1h4a1 1 0 1 1 0 2H9A1 1 0 0 1 8 12Z"/>'
      ) +
      "<span>Request Quote</span>";

    var modal = document.createElement("div");
    modal.className = "rr-contact-modal";
    modal.id = "rr-contact-modal";
    modal.hidden = true;
    modal.innerHTML =
      '<div class="rr-contact-backdrop" data-close-contact="1"></div>' +
      '<div class="rr-contact-panel" role="dialog" aria-modal="true" aria-labelledby="rr-contact-title">' +
      '<div class="rr-contact-head">' +
      "<div>" +
      '<h2 id="rr-contact-title">Send a product requirement</h2>' +
      "<p>Tell us the product, quantity, destination country, application and documents you need. We will reply by email or WhatsApp. Online payment is not available.</p>" +
      "</div>" +
      '<button type="button" class="rr-contact-close" aria-label="Close contact form">' +
      svgIcon(
        '<path fill="currentColor" d="M6.7 5.3a1 1 0 0 0-1.4 1.4L10.6 12l-5.3 5.3a1 1 0 1 0 1.4 1.4l5.3-5.3 5.3 5.3a1 1 0 0 0 1.4-1.4L13.4 12l5.3-5.3a1 1 0 0 0-1.4-1.4L12 10.6Z"/>'
      ) +
      "</button>" +
      "</div>" +
      '<form class="rr-contact-form" novalidate>' +
      '<div class="rr-contact-field">' +
      '<label for="rr-contact-company">Company name</label>' +
      '<input id="rr-contact-company" name="companyName" type="text" maxlength="120" autocomplete="organization" required>' +
      "</div>" +
      '<div class="rr-contact-field">' +
      '<label for="rr-contact-person">Contact person</label>' +
      '<input id="rr-contact-person" name="contactPerson" type="text" maxlength="120" autocomplete="name" required>' +
      "</div>" +
      '<div class="rr-contact-field">' +
      '<label for="rr-contact-phone">Phone / WhatsApp</label>' +
      '<input id="rr-contact-phone" name="phone" type="tel" maxlength="60" autocomplete="tel" required>' +
      "</div>" +
      '<div class="rr-contact-field">' +
      '<label for="rr-contact-email">Email</label>' +
      '<input id="rr-contact-email" name="email" type="email" maxlength="120" autocomplete="email" required>' +
      "</div>" +
      '<div class="rr-contact-field">' +
      '<label for="rr-contact-product">Product interest</label>' +
      '<input id="rr-contact-product" name="productInterest" type="text" maxlength="160" placeholder="Example: dried chamomile, butterfly pea flower, fruit powder">' +
      "</div>" +
      '<div class="rr-contact-field">' +
      '<label for="rr-contact-quantity">Estimated quantity</label>' +
      '<input id="rr-contact-quantity" name="estimatedQuantity" type="text" maxlength="120" placeholder="Example: sample first, 100 kg, 1 ton/month">' +
      "</div>" +
      '<div class="rr-contact-field">' +
      '<label for="rr-contact-country">Destination country</label>' +
      '<input id="rr-contact-country" name="destinationCountry" type="text" maxlength="120" autocomplete="country-name">' +
      "</div>" +
      '<div class="rr-contact-field">' +
      '<label for="rr-contact-application">Application</label>' +
      '<input id="rr-contact-application" name="application" type="text" maxlength="160" placeholder="Tea blend, beverage, food ingredient, private label...">' +
      "</div>" +
      '<div class="rr-contact-field">' +
      '<label for="rr-contact-documents">Required documents</label>' +
      '<input id="rr-contact-documents" name="requiredDocuments" type="text" maxlength="160" placeholder="COA, MSDS, TDS, pesticide test, packing photos...">' +
      "</div>" +
      '<div class="rr-contact-field">' +
      '<label for="rr-contact-message">Message</label>' +
      '<textarea id="rr-contact-message" name="message" rows="5" maxlength="2400" placeholder="Tell us the specification, packing style, sample needs or quote details." required></textarea>' +
      "</div>" +
      '<p class="rr-contact-status" aria-live="polite"></p>' +
      '<div class="rr-contact-meta">' +
      '<div class="rr-contact-note">Your inquiry will be routed to our sales mailbox.</div>' +
      '<button type="submit" class="rr-contact-submit">Send inquiry</button>' +
      "</div>" +
      "</form>" +
      "</div>";

    var form = modal.querySelector("form");
    var status = modal.querySelector(".rr-contact-status");
    var closeButton = modal.querySelector(".rr-contact-close");
    var submitButton = modal.querySelector(".rr-contact-submit");
    var firstField = modal.querySelector("#rr-contact-company");

    function setStatus(message, type) {
      status.textContent = message;
      status.className = "rr-contact-status" + (type ? " is-" + type : "");
    }

    function closeModal() {
      modal.hidden = true;
      document.body.classList.remove("rr-contact-open");
      contactButton.setAttribute("aria-expanded", "false");
      setStatus("", "");
    }

    function openModal() {
      modal.hidden = false;
      document.body.classList.add("rr-contact-open");
      contactButton.setAttribute("aria-expanded", "true");
      window.setTimeout(function () {
        firstField.focus();
      }, 30);
    }

    function buildMailto(details) {
      var subject = "Product inquiry from " + details.companyName;
      var body = [
        "Company: " + details.companyName,
        "Contact person: " + details.contactPerson,
        "Phone / WhatsApp: " + details.phone,
        "Email: " + details.email,
        "Product interest: " + (details.productInterest || "-"),
        "Estimated quantity: " + (details.estimatedQuantity || "-"),
        "Destination country: " + (details.destinationCountry || "-"),
        "Application: " + (details.application || "-"),
        "Required documents: " + (details.requiredDocuments || "-"),
        "Message: " + details.message,
        "Page: " + window.location.href
      ].join("\n");
      return (
        "mailto:" +
        encodeURIComponent(RECIPIENT_EMAIL) +
        "?subject=" +
        encodeURIComponent(subject) +
        "&body=" +
        encodeURIComponent(body)
      );
    }

    contactButton.addEventListener("click", openModal);
    closeButton.addEventListener("click", closeModal);

    modal.addEventListener("click", function (event) {
      if (event.target && event.target.getAttribute("data-close-contact") === "1") {
        closeModal();
      }
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && !modal.hidden) {
        closeModal();
      }
    });

    form.addEventListener("submit", function (event) {
      event.preventDefault();

      var formData = new FormData(form);
      var companyName = String(formData.get("companyName") || "").trim();
      var contactPerson = String(formData.get("contactPerson") || "").trim();
      var phone = String(formData.get("phone") || "").trim();
      var email = String(formData.get("email") || "").trim();
      var productInterest = String(formData.get("productInterest") || "").trim();
      var estimatedQuantity = String(formData.get("estimatedQuantity") || "").trim();
      var destinationCountry = String(formData.get("destinationCountry") || "").trim();
      var application = String(formData.get("application") || "").trim();
      var requiredDocuments = String(formData.get("requiredDocuments") || "").trim();
      var message = String(formData.get("message") || "").trim();

      if (!companyName || !contactPerson || !phone || !email || !message) {
        setStatus("Please complete company, contact, phone / WhatsApp, email and message.", "error");
        return;
      }

      submitButton.disabled = true;
      setStatus("Sending your inquiry...", "");

      window
        .fetch("/api/contact", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            companyName: companyName,
            contactPerson: contactPerson,
            phone: phone,
            email: email,
            productInterest: productInterest,
            estimatedQuantity: estimatedQuantity,
            destinationCountry: destinationCountry,
            application: application,
            requiredDocuments: requiredDocuments,
            message: message,
            pageTitle: document.title,
            pageUrl: window.location.href
          })
        })
        .then(function (response) {
          return response
            .json()
            .catch(function () {
              return {};
            })
            .then(function (data) {
              return { ok: response.ok, data: data };
            });
        })
        .then(function (result) {
          if (!result.ok || !result.data || result.data.ok !== true) {
            throw new Error(result.data && result.data.error ? result.data.error : "Request failed");
          }

          form.reset();
          setStatus("Thanks. Your inquiry has been sent.", "success");
        })
        .catch(function () {
          var fallbackUrl = buildMailto({
            companyName: companyName,
            contactPerson: contactPerson,
            phone: phone,
            email: email,
            productInterest: productInterest,
            estimatedQuantity: estimatedQuantity,
            destinationCountry: destinationCountry,
            application: application,
            requiredDocuments: requiredDocuments,
            message: message
          });
          status.className = "rr-contact-status is-error";
          status.innerHTML =
            'Email sending is temporarily unavailable. <a href="' +
            fallbackUrl +
            '">Click here to email us directly.</a>';
        })
        .finally(function () {
          submitButton.disabled = false;
        });
    });

    document.body.appendChild(contactButton);
    document.body.appendChild(modal);
  }

  ready(function () {
    createTranslateWidget();
    createContactWidget();
  });
})();
