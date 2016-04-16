document.on "DOMContentLoaded", ->
  if location.host is "pinkturtle.github.io" and location.protocol isnt "https:"
    destination = String(location).replace("http:", "https:")
    console.info "Upgrading connection protocol for transport layer security.", {destination}, t: performance.now()
    return window.location = destination
  console.info "initializing window.checklist", t:performance.now()
  facts = window.facts = Facts()
  initialData = if serialized = localStorage.getItem("checklist datoms")
    JSON.parse(serialized)
  else
    constructDemoChecklistDatoms()
  facts.datoms = Facts.Immutable.Stack Facts.Immutable.fromJS(initialData)
  console.info "window.checklist is ready", t: performance.now()
  console.info "initializing display", t: performance.now()
  facts.on "transaction", (report) -> renderDatomTableNovelty(report)
  facts.on "transaction", (report) -> saveDataToLocalStorage(report)
  facts.on "transaction", (report) -> renderChecklistVersion(report)
  facts.on "transaction", (report) -> renderChecklistTitleInHead()
  transaction = facts.datoms.get(0).get(4)
  data = facts.datoms.filter((datom) -> String(datom.get(1))[0] isnt "T").reverse()
  renderDatomTableNovelty({data, transaction})
  renderChecklist(transaction)
  renderChecklistTitleInHead()
  document.querySelector("#Checklist").classList.add("initialized")
  document.querySelector("#Checklist-Datoms").classList.add("initialized")
  console.info "display is ready", t: performance.now()

document.on "input", "#Checklist .title", (event) ->
  facts.advance "checklist", "title": event.target.innerText

document.on "mouseover", "#Checklist-Datoms [data-transaction]", (event) ->
  transaction = event.target.closest("[data-transaction]").getAttribute("data-transaction")
  renderSelectedTransactionInDatomTable(transaction)
  renderChecklist(transaction)

document.on "mouseout", "#Checklist-Datoms", ->
  renderSelectedTransactionInDatomTable(facts.datoms.get(0).get(4))
  renderChecklist(facts.datoms.get(0).get(4))

renderChecklist = (transaction) ->
  database = facts.database(Number(transaction.replace("T","0")))
  checklist = Facts.query(in:database, where:(id) -> id is "checklist")[0]
  entities = Facts.query(in:database, where:(id) -> id in checklist.entities)
  li = d3.select("#Checklist").select("ol.entities").selectAll("li").data(entities, (entity)->entity.id)
  li.enter()
    .append "li"
    .on "change", (entity) ->
      facts[if d3.event.target.checked then "advance" else "reverse"] entity.id, "checked": true
    .on "input", (entity) ->
      facts.advance entity.id, "label": d3.event.target.innerText
  li.html (entity) -> """
    <label class="checkbox">
      <input name="entity-#{entity.id}" type="checkbox" #{if entity.checked then 'checked' else ''}>
      <span class="icon">✔︎</span>
      <span class="box"></span>
    </label>
    <div class="text label" contenteditable="plaintext-only">#{entity.label}</div>
    """
  li.exit().remove()
  renderChecklistTitle(checklist["title"])
  renderChecklistVersion({transaction})

renderChecklistTitle = (title) ->
  document.querySelector("#Checklist .title").innerText = title or undefined

renderChecklistTitleInHead = ->
  document.querySelector("title").innerText = facts.pull("checklist")["title"] or "undefined"

renderChecklistVersion = (report) ->
  transaction = report?.transaction or facts.datoms.first().get(4)
  document.querySelector("#Checklist .version").innerText = transaction

renderDatomTableHeader = (situation) ->
  return if renderDatomTableHeader.situation is situation
  console.info "renderDatomTableHeader", arguments
  renderDatomTableHeader.situation = situation
  for selector, pattern of renderDatomTableHeader.patterns
    document.querySelector(selector).style.display = if situation.match pattern then "inline" else "none"

renderDatomTableHeader.patterns =
  "#Checklist-Datoms span.data.saved.in.storage":"data saved in storage"
  "#Checklist-Datoms span.data.is.volatile":"data is volatile"
  "#Checklist-Datoms span.because.of.file.protocol":"storage isn’t available in windows loaded over the file: protocol"
  "#Checklist-Datoms span.because.of.quota":"storage quota was exceeded"

renderDatomTableNovelty = (report) ->
  tbody = d3.select("#Checklist-Datoms table tbody")
  report.data.forEach (datom) ->
    tbody.insert("tr", ":first-child").attr("data-transaction",datom.get(4)).html """
      <td class="credence">#{datom.get(0)}</td>
      <td class="entity">#{datom.get(1)}</td>
      <td class="attribute">#{datom.get(2)}</td>
      <td class="value"><div>#{JSON.stringify(datom.get(3))}</div></td>
      <td class="transaction">T#{Number(datom.get(4).replace("T","0")).toFixed(3)}</td>
    """
  renderSelectedTransactionInDatomTable(report.transaction)

renderSelectedTransactionInDatomTable = (transaction) ->
  selectedInstant = Number(transaction.replace("T","0"))
  for element in document.querySelectorAll("#Checklist-Datoms [data-transaction]")
    instant = Number(element.getAttribute("data-transaction").replace("T","0"))
    element.classList.toggle "after", instant > selectedInstant
    element.classList.toggle "before", instant < selectedInstant
    element.classList.toggle "selected", instant is selectedInstant

saveDataToLocalStorage = ->
  Function.delay 1, ->
    try
      localStorage.setItem "checklist datoms", JSON.stringify(facts.datoms)
      renderDatomTableHeader "data saved in storage"
    catch exception
      renderDatomTableHeader "data is volatile" + switch
        when exception.name is "QuotaExceededError" and location.protocol is "file:"
          " because storage isn’t available in windows loaded over the file: protocol"
        when exception.name is "QuotaExceededError"
          " because storage quota was exceeded"
        else
          console.error("Unrecognized exception durring saveDataToLocalStorage", exception) ? ""

constructDemoChecklistDatoms = ->
  time = performance.timing.navigationStart
  transaction = "T"+time
  return [
    [true, transaction, "time", time, transaction]
    [true, "checklist", "entities", [1, 2, 3], transaction]
    [true, "checklist", "title", "Checklist", transaction]
    [true, 1, "label", "Buy peanut butter", transaction]
    [true, 2, "label", "Get a job", transaction]
    [true, 3, "label", "Memorize Surfer Girl\nVerse 1:\nD+ B- G5 A5 𝄀 D▵ D7 G+ G-\nD+ B- G5 A5 𝄀 D+ B- G+ A+\nVerse 2:\nD+ B- G5 A5 𝄀 D▵ D7 G+ G-\nD+ B- G5 A5 𝄀 D+ B-/G D+ D7\n", transaction]
  ]
