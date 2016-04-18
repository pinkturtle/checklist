// Generated by CoffeeScript 1.10.0
(function() {
  var constructDemoChecklistDatoms, renderChecklist, renderChecklistTitle, renderChecklistTitleInHead, renderChecklistVersion, renderDatomTableHeader, renderDatomTableNovelty, renderSelectedTransactionInDatomTable, saveDataToLocalStorage,
    indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  document.on("DOMContentLoaded", function() {
    var data, destination, initialData, serialized, transaction;
    if (location.host === "pinkturtle.github.io" && location.protocol !== "https:") {
      destination = String(location).replace("http:", "https:");
      console.info("Switching protocols to establish connection with transport layer security.", {
        destination: destination
      }, {
        t: performance.now()
      });
      Function.delay(11, function() {
        return document.body.setAttribute("initialized", "redirect");
      });
      Function.delay(33, function() {
        return window.location = destination;
      });
      return {
        to: destination
      };
    }
    console.info("initializing window.checklist", {
      t: performance.now()
    });
    window.checklist = Facts();
    initialData = (serialized = localStorage.getItem("checklist datoms")) ? (renderDatomTableHeader("data saved in storage"), JSON.parse(serialized)) : constructDemoChecklistDatoms();
    checklist.datoms = Facts.Immutable.Stack(Facts.Immutable.fromJS(initialData));
    console.info("window.checklist is ready", {
      t: performance.now()
    });
    console.info("initializing display", {
      t: performance.now()
    });
    checklist.on("transaction", function(report) {
      return renderDatomTableNovelty(report);
    });
    checklist.on("transaction", function(report) {
      return saveDataToLocalStorage(report);
    });
    checklist.on("transaction", function(report) {
      return renderChecklistVersion(report);
    });
    checklist.on("transaction", function(report) {
      return renderChecklistTitleInHead();
    });
    transaction = checklist.datoms.get(0).get(4);
    data = checklist.datoms.filter(function(datom) {
      return String(datom.get(1))[0] !== "T";
    }).reverse();
    renderDatomTableNovelty({
      data: data,
      transaction: transaction
    });
    renderChecklist(transaction);
    renderChecklistTitleInHead();
    document.querySelector("#Checklist").classList.add("initialized");
    document.querySelector("#Checklist-Datoms").classList.add("initialized");
    if (typeof TouchEvent !== "undefined" && TouchEvent !== null) {
      document.body.setAttribute("touch-events", true);
    }
    document.body.setAttribute("initialized", true);
    return console.info("display is ready", {
      t: performance.now()
    });
  });

  document.on("keydown", "#Checklist .title", function(event) {
    switch (event.keyCode) {
      case 13:
        return event.preventDefault();
      case 8:
        if (event.target.innerText.trim() === "") {
          return event.preventDefault();
        }
    }
  });

  document.on("input", "#Checklist .title", function(event) {
    return Function.delay(1, function() {
      return checklist.advance(0, {
        "title": event.target.innerText.trim()
      });
    });
  });

  document.on("mouseover", "#Checklist-Datoms [data-transaction]", function(event) {
    var transaction;
    document.activeElement.blur();
    transaction = event.target.closest("[data-transaction]").getAttribute("data-transaction");
    renderSelectedTransactionInDatomTable(transaction);
    return renderChecklist(transaction);
  });

  document.on("mouseout", "#Checklist-Datoms", function() {
    renderSelectedTransactionInDatomTable(checklist.datoms.get(0).get(4));
    return renderChecklist(checklist.datoms.get(0).get(4));
  });

  document.on("mouseover", "#Checklist ol.entities li", function(event, li) {
    var element, range, selection;
    element = li.querySelector("[contenteditable]");
    if (element.innerText) {
      selection = window.getSelection();
      selection.removeAllRanges();
      range = document.createRange();
      range.setStart(element.childNodes[0], element.innerText.length);
      range.setEnd(element.childNodes[0], element.innerText.length);
      selection.addRange(range);
    }
    return element.focus();
  });

  document.on("focus", "#Checklist ol.entities li", function(event, li) {
    return li.classList.add("focused");
  });

  document.on("blur", "#Checklist ol.entities li", function(event, li) {
    return li.classList.remove("focused");
  });

  renderChecklist = function(transaction, focused) {
    var database, entities, li, root;
    database = checklist.database(Number(transaction.replace("T", "0")));
    root = Facts.query({
      "in": database,
      where: function(id) {
        return id === 0;
      }
    })[0];
    entities = Facts.query({
      "in": database,
      where: function(id) {
        return indexOf.call(root.entities, id) >= 0 && id !== focused;
      }
    });
    entities.push({
      id: d3.max(root.entities) + 1
    });
    li = d3.select("#Checklist").select("ol.entities").selectAll("li:not(.focused)").data(entities, function(entity) {
      return entity.id;
    });
    li.enter().append("li").on("keydown", function(entity) {
      var report;
      if (event.keyCode === 8 && d3.event.target.innerText.trim() === "" && d3.event.target.innerText.length < 2 && d3.event.target.innerText !== " ") {
        d3.event.target.blur();
        report = checklist.advance(0, {
          entities: checklist.pull(0).entities.filter(function(id) {
            return id !== entity.id;
          })
        });
        return renderChecklist(report.transaction);
      }
    }).on("change", function(entity) {
      return checklist[d3.event.target.checked ? "advance" : "reverse"](entity.id, {
        "checked": true
      });
    }).on("input", function(entity) {
      var ref, report;
      checklist.advance(entity.id, {
        "label": d3.event.target.innerText.trim()
      });
      root = checklist.pull(0);
      if ((ref = entity.id, indexOf.call(root.entities, ref) >= 0) === false) {
        report = checklist.advance(root.id, {
          entities: root.entities.concat([entity.id])
        });
        return renderChecklist(report.transaction, entity.id);
      }
    });
    li.html(function(entity) {
      return "<label class=\"checkbox\">\n  <input name=\"entity-" + entity.id + "\" type=\"checkbox\" " + (entity.checked ? 'checked' : '') + ">\n  <span class=\"icon\">✔︎</span>\n  <span class=\"box\"></span>\n</label>\n<div class=\"text label\" contenteditable=\"plaintext-only\">" + (entity.label || '') + "</div>";
    });
    li.exit().remove();
    renderChecklistTitle(root["title"]);
    return renderChecklistVersion({
      transaction: transaction
    });
  };

  renderChecklistTitle = function(title) {
    return document.querySelector("#Checklist .title").innerText = title || "\n";
  };

  renderChecklistTitleInHead = function() {
    return document.querySelector("title").innerText = checklist.pull(0)["title"] || "undefined";
  };

  renderChecklistVersion = function(report) {
    var transaction;
    transaction = (report != null ? report.transaction : void 0) || checklist.datoms.first().get(4);
    return document.querySelector("#Checklist .version").innerText = transaction;
  };

  renderDatomTableHeader = function(situation) {
    var pattern, ref, results, selector;
    if (renderDatomTableHeader.situation === situation) {
      return;
    }
    console.info("renderDatomTableHeader", arguments);
    renderDatomTableHeader.situation = situation;
    ref = renderDatomTableHeader.patterns;
    results = [];
    for (selector in ref) {
      pattern = ref[selector];
      results.push(Array.from(document.querySelectorAll(selector)).map(function(element) {
        return element.style.display = situation.match(pattern) ? "inline" : "none";
      }));
    }
    return results;
  };

  renderDatomTableHeader.patterns = {
    "#Checklist-Datoms span.data.saved.in.storage": "data saved in storage",
    "#Checklist-Datoms span.data.is.volatile": "data is volatile",
    "#Checklist-Datoms span.because.of.quota": "storage quota was exceeded"
  };

  renderDatomTableNovelty = function(report) {
    var tbody;
    tbody = d3.select("#Checklist-Datoms table tbody");
    report.data.forEach(function(datom) {
      return tbody.insert("tr", ":first-child").attr("data-transaction", datom.get(4)).html("<td class=\"credence\">" + (datom.get(0)) + "</td>\n<td class=\"entity\">" + (("0" + String(datom.get(1))).slice(-2)) + "</td>\n<td class=\"attribute\">" + (datom.get(2)) + "</td>\n<td class=\"value\"><div>" + (JSON.stringify(datom.get(3))) + "</div></td>\n<td class=\"transaction\">T" + (Number(datom.get(4).replace("T", "0")).toFixed(3)) + "</td>");
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
      var error, exception;
      try {
        localStorage.setItem("checklist datoms", JSON.stringify(checklist.datoms));
        return renderDatomTableHeader("data saved in storage");
      } catch (error) {
        exception = error;
        return renderDatomTableHeader("data is volatile" + (function() {
          switch (false) {
            case exception.name !== "QuotaExceededError":
              return " because storage quota was exceeded";
            default:
              console.error("Unrecognized exception durring saveDataToLocalStorage", exception);
              return " because an unrecognized exception occurred durring saveDataToLocalStorage";
          }
        })());
      }
    });
  };

  constructDemoChecklistDatoms = function() {
    var time, transaction;
    time = performance.timing.navigationStart;
    transaction = "T" + time;
    return [[true, transaction, "time", time, transaction], [true, 1, "label", "Buy peanut butter", transaction], [true, 2, "label", "Get a job", transaction], [true, 3, "label", "Memorize Surfer Girl\nVerse 1:\nD+ B- G5 A5 𝄀 D▵ D7 G+ G-\nD+ B- G5 A5 𝄀 D+ B- G+ A+\nVerse 2:\nD+ B- G5 A5 𝄀 D▵ D7 G+ G-\nD+ B- G5 A5 𝄀 D+ B-/G D+ D7\n", transaction], [true, 0, "title", "Checklist", transaction], [true, 0, "entities", [1, 2, 3], transaction]];
  };

}).call(this);
