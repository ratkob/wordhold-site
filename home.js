// Wordhold home page: the try-it page and the theme preview. Plain JS, no libraries.
// Meanings, pronunciations and second examples are copied from the app's own dictionary
// (Open English WordNet and its public-domain example sentences), not written for the page.
(function () {
  "use strict";

  // With JS running, the demo's controls work: show them (home.css hides them for no-js; an inline script in <head> already swaps the class to avoid a layout jump).
  document.documentElement.classList.remove("no-js");
  document.documentElement.classList.add("js");

  var WORDS = {
    sturdy: {
      ipa: "ˈstɜːdi", pos: "adjective",
      meaning: "having rugged physical strength; inured to fatigue or hardships",
      example: "They were a new and sturdy addition to the defences of the capital.",
      exampleCredit: "C. J. Cutcliffe Hyne, The Lost Continent"
    },
    supercilious: {
      ipa: "ˌsjuː.pə(ɹ)ˈsɪ.li.əs", pos: "adjective",
      meaning: "having or showing arrogant superiority to and disdain of those one views as unworthy",
      example: "This is the spectacle, and not a supercilious assumption on the part of the shop-girl.",
      exampleCredit: "George William Curtis, From the Easy Chair"
    },
    arrogant: {
      ipa: "ˈæɹəɡənt", pos: "adjective",
      meaning: "having or showing feelings of unwarranted importance out of overbearing pride",
      example: "Had he been arrogant the effect would have been the same.",
      exampleCredit: "Anthony Trollope, The Prime Minister"
    },
    dominance: {
      ipa: "ˈdɒmɪnəns", pos: "noun",
      meaning: "the state that exists when one person or group has power over another",
      senseNote: "The dictionary has four meanings; this is the one the sentence uses.",
      example: "All the dominance and energy of her nature were at work.",
      exampleCredit: "Bram Stoker, The Man"
    }
  };

  var tryBox = document.getElementById("try");
  if (tryBox) setUpTry(tryBox);
  var picker = document.querySelector(".theme-pick");
  if (picker) setUpThemes(picker);

  function setUpTry(root) {
    var page = root.querySelector('[data-panel="page"]');
    var card = root.querySelector('[data-panel="card"]');
    var lookup = root.querySelector("[data-lookup]");
    var hint = root.querySelector("[data-hint]");
    var live = root.querySelector("[data-live]");
    var steps = root.querySelectorAll(".try-steps li");
    var current = null;
    // The passage on the page is the one source for the reader's sentence.
    var passage = root.querySelector(".passage").textContent.replace(/\s+/g, " ").trim();
    var sentences = passage.match(/[^.!?]+[.!?]+/g) || [passage];
    root.querySelectorAll(".w").forEach(function (b) { b.disabled = false; });

    function fill(scope, data) {
      scope.querySelectorAll("[data-f]").forEach(function (el) {
        var key = el.getAttribute("data-f");
        if (key in data) el.textContent = data[key];
      });
    }

    function step(n) {
      steps.forEach(function (li) {
        if (Number(li.getAttribute("data-step")) === n) li.setAttribute("aria-current", "step");
        else li.removeAttribute("aria-current");
      });
    }

    function say(text) {
      live.textContent = "";
      window.setTimeout(function () { live.textContent = text; }, 30);
    }

    root.querySelectorAll(".w").forEach(function (button) {
      button.addEventListener("click", function () {
        var key = button.getAttribute("data-word");
        current = key;
        root.querySelectorAll(".w").forEach(function (b) { b.removeAttribute("aria-pressed"); });
        button.setAttribute("aria-pressed", "true");
        var d = WORDS[key];
        fill(lookup, { word: key, ipa: d.ipa, pos: d.pos, meaning: d.meaning, senseNote: d.senseNote || "" });
        lookup.querySelector('[data-f="senseNote"]').hidden = !d.senseNote;
        lookup.hidden = false;
        hint.hidden = true;
        step(2);
        lookup.focus({ preventScroll: true });
        lookup.scrollIntoView({ block: "nearest", behavior: reduced() ? "auto" : "smooth" });
      });
    });

    root.addEventListener("click", function (event) {
      var actor = event.target.closest("[data-act]");
      if (!actor) return;
      var act = actor.getAttribute("data-act");
      var d = current && WORDS[current];

      if (act === "keep" && d) {
        page.hidden = true;
        card.hidden = false;
        fill(card, { word: current, meaning: d.meaning, example: "“" + d.example + "”", exampleCredit: d.exampleCredit });
        setSentence(card.querySelector('[data-f="sentence"]'), current);
        card.querySelector("[data-front]").hidden = false;
        card.querySelector("[data-back]").hidden = true;
        card.querySelector("[data-grade]").hidden = false;
        card.querySelector("[data-after]").hidden = true;
        card.querySelector("[data-ribbon]").hidden = true;
        step(3);
        card.focus({ preventScroll: true });
        say("Kept " + current + ", with its sentence. A few days later, the card asks you to remember it.");
      } else if (act === "reveal") {
        card.querySelector("[data-front]").hidden = true;
        card.querySelector("[data-back]").hidden = false;
        // The focused button just hid: move focus to the meaning it revealed.
        card.querySelector("[data-reveal-focus]").focus();
      } else if (act === "good" || act === "again") {
        var ribbon = card.querySelector("[data-ribbon]");
        var after = card.querySelector("[data-after]");
        var good = act === "good";
        ribbon.querySelector("[data-f]").textContent = good ? "Next due in 2 days" : "Back later in this round";
        after.textContent = good
          ? "Each time you know it, the gap grows. The app works the days out from how you answer."
          : "No harm done: the card comes back before the round ends, then again soon.";
        ribbon.hidden = false;
        after.hidden = false;
        card.querySelector("[data-grade]").hidden = true;
        // The grade buttons just hid: move focus to the result; the ribbon's text is announced with it.
        after.focus();
        say(good ? "Next due in 2 days." : "Back later in this round.");
      } else if (act === "reset") {
        card.hidden = true;
        page.hidden = false;
        lookup.hidden = true;
        hint.hidden = false;
        root.querySelectorAll(".w").forEach(function (b) { b.removeAttribute("aria-pressed"); });
        step(1);
        var first = root.querySelector(".w");
        if (first) first.focus();
      }
    });

    // The reader's sentence on the card, with the word set in bold, as the app sets it.
    function setSentence(el, word) {
      el.textContent = "";
      var pattern = new RegExp("\\b" + word + "\\b", "i");
      var sentence = (sentences.find(function (s) { return pattern.test(s); }) || passage).trim();
      var match = pattern.exec(sentence);
      var at = match ? match.index : 0;
      var len = match ? match[0].length : 0;
      el.appendChild(document.createTextNode("“" + sentence.slice(0, at)));
      var strong = document.createElement("strong");
      strong.textContent = sentence.slice(at, at + len);
      el.appendChild(strong);
      el.appendChild(document.createTextNode(sentence.slice(at + len) + "”"));
    }
  }

  function setUpThemes(fieldset) {
    var preview = document.querySelector("[data-preview]");
    var credit = document.querySelector("[data-credit]");
    var name = preview.querySelector("[data-preview-name]");
    var art = preview.querySelector(".tp-art");
    var paintingInput = fieldset.querySelector('input[value="painting"]');
    // The painting (57 KB) loads only for readers who reach for it: on hover or focus, or when picked.
    function loadArt() {
      if (!art.getAttribute("src")) art.setAttribute("src", art.getAttribute("data-src"));
    }
    paintingInput.addEventListener("focus", loadArt);
    paintingInput.closest("label").addEventListener("pointerenter", loadArt);
    fieldset.addEventListener("change", function (event) {
      var value = event.target.value;
      if (value === "painting") loadArt();
      preview.className = "theme-preview tp-" + value;
      credit.hidden = value !== "painting";
      name.textContent = "A word page in the " + (event.target.dataset.name || event.target.parentNode.textContent.trim()) + " theme:";
    });
  }

  function reduced() {
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }
})();
