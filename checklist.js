// Generated by CoffeeScript 1.10.0
(function() {
  var facts, initialData, renderChecklist, renderChecklistTitle, renderChecklistTitleInHead, renderChecklistVersion, renderDatomTableNovelty, renderSelectedTransactionInDatomTable, saveDataToLocalStorage, serialized,
    indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  facts = window.facts = Facts();

  initialData = (serialized = localStorage.getItem("checklist datoms")) ? JSON.parse(serialized) : [[true, "T1460752005472.395", "time", 1460752005472.395, "T1460752005472.395"], [true, "checklist", "entities", [1, 2, 3], "T1460752005472.395"], [true, "checklist", "title", "Checklist", "T1460752005472.395"], [true, 1, "label", "Buy peanut butter", "T1460752005472.395"], [true, 2, "label", "Get a job", "T1460752005472.395"], [true, 3, "label", "Memorize chords to Surfer Girl\nVerse 1:\nD+ B- G5 A5 𝄀 D▵ D7 G+ G-\nD+ B- G5 A5 𝄀 D+ B- G+ A+\nVerse 2:\nD+ B- G5 A5 𝄀 D▵ D7 G+ G-\nD+ B- G5 A5 𝄀 D+ B-/G D+ D7\n", "T1460752005472.395"]];

  facts.datoms = Facts.Immutable.Stack(Facts.Immutable.fromJS(initialData));

  document.on("DOMContentLoaded", function() {
    var data, transaction;
    if (location.host === "pinkturtle.github.io" && location.protocol !== "https:") {
      return window.location = String(location).replace("http:", "https:");
    } else {
      facts.on("transaction", function(report) {
        return renderDatomTableNovelty(report);
      });
      facts.on("transaction", function(report) {
        return saveDataToLocalStorage(report);
      });
      facts.on("transaction", function(report) {
        return renderChecklistVersion(report);
      });
      facts.on("transaction", function(report) {
        return renderChecklistTitleInHead();
      });
      transaction = facts.datoms.get(0).get(4);
      data = facts.datoms.filter(function(datom) {
        return String(datom.get(1))[0] !== "T";
      }).reverse();
      renderDatomTableNovelty({
        data: data,
        transaction: transaction
      });
      renderChecklist(transaction);
      renderChecklistTitleInHead();
      document.querySelector("#Checklist").classList.add("initialized");
      return document.querySelector("#Checklist-Datoms").classList.add("initialized");
    }
  });

  document.on("input", "#Checklist .title", function(event) {
    return facts.advance("checklist", {
      "title": event.target.innerText
    });
  });

  document.on("mouseover", "#Checklist-Datoms [data-transaction]", function(event) {
    var transaction;
    transaction = event.target.closest("[data-transaction]").getAttribute("data-transaction");
    renderSelectedTransactionInDatomTable(transaction);
    return renderChecklist(transaction);
  });

  document.on("mouseout", "#Checklist-Datoms", function() {
    renderSelectedTransactionInDatomTable(facts.datoms.get(0).get(4));
    return renderChecklist(facts.datoms.get(0).get(4));
  });

  renderChecklist = function(transaction) {
    var checklist, database, entities, li;
    database = facts.database(Number(transaction.replace("T", "0")));
    checklist = Facts.query({
      "in": database,
      where: function(id) {
        return id === "checklist";
      }
    })[0];
    entities = Facts.query({
      "in": database,
      where: function(id) {
        return indexOf.call(checklist.entities, id) >= 0;
      }
    });
    li = d3.select("#Checklist").select("ol.entities").selectAll("li").data(entities, function(entity) {
      return entity.id;
    });
    li.enter().append("li").on("change", function(entity) {
      return facts[d3.event.target.checked ? "advance" : "reverse"](entity.id, {
        "checked": true
      });
    }).on("input", function(entity) {
      return facts.advance(entity.id, {
        "label": d3.event.target.innerText
      });
    });
    li.html(function(entity) {
      return "<label class=\"checkbox\">\n  <input name=\"entity-" + entity.id + "\" type=\"checkbox\" " + (entity.checked ? 'checked' : '') + ">\n  <span class=\"icon\">✔︎</span>\n  <span class=\"box\"></span>\n</label>\n<div class=\"text label\" contenteditable=\"plaintext-only\">" + entity.label + "</div>";
    });
    li.exit().remove();
    renderChecklistTitle(checklist["title"]);
    return renderChecklistVersion({
      transaction: transaction
    });
  };

  renderChecklistTitle = function(title) {
    return document.querySelector("#Checklist .title").innerText = title || void 0;
  };

  renderChecklistTitleInHead = function() {
    return document.querySelector("title").innerText = facts.pull("checklist")["title"] || "undefined";
  };

  renderChecklistVersion = function(report) {
    var transaction;
    transaction = (report != null ? report.transaction : void 0) || facts.datoms.first().get(4);
    return document.querySelector("#Checklist .version").innerText = transaction;
  };

  renderDatomTableNovelty = function(report) {
    var tbody;
    tbody = d3.select("#Checklist-Datoms table.datoms tbody");
    report.data.forEach(function(datom) {
      return tbody.insert("tr", ":first-child").attr("data-transaction", datom.get(4)).html("<td class=\"credence\">" + (datom.get(0)) + "</td>\n<td class=\"entity\">" + (datom.get(1)) + "</td>\n<td class=\"attribute\">" + (datom.get(2)) + "</td>\n<td class=\"value\"><div>" + (JSON.stringify(datom.get(3))) + "</div></td>\n<td class=\"transaction\">T" + (Number(datom.get(4).replace("T", "0")).toFixed(3)) + "</td>");
    });
    return renderSelectedTransactionInDatomTable(report.transaction);
  };

  renderSelectedTransactionInDatomTable = function(transaction) {
    var element, i, instant, len, ref, results, selectedInstant;
    selectedInstant = Number(transaction.replace("T", "0"));
    ref = document.querySelectorAll("#Checklist-Datoms [data-transaction]");
    results = [];
    for (i = 0, len = ref.length; i < len; i++) {
      element = ref[i];
      instant = Number(element.getAttribute("data-transaction").replace("T", "0"));
      element.classList.toggle("after", instant > selectedInstant);
      element.classList.toggle("before", instant < selectedInstant);
      results.push(element.classList.toggle("selected", instant === selectedInstant));
    }
    return results;
  };

  saveDataToLocalStorage = function() {
    return Function.delay(1, function() {
      return localStorage.setItem("checklist datoms", JSON.stringify(facts.datoms));
    });
  };

}).call(this);
