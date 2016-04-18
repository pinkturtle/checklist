document.on "DOMContentLoaded", ->
  if location.host is "pinkturtle.github.io" and location.protocol isnt "https:"
    destination = String(location).replace("http:", "https:")
    console.info "Switching protocols to establish connection with transport layer security.", {destination}, t: performance.now()
    Function.delay 11, -> document.body.setAttribute "initialized", "redirect"
    Function.delay 33, -> window.location = destination
    return to:destination
  console.info "initializing window.checklist", t:performance.now()
  window.checklist = Facts()
  initialData = if serialized = localStorage.getItem("checklist datoms")
    renderDatomTableHeader "data saved in storage"
    JSON.parse(serialized)
  else
    constructDemoChecklistDatoms()
  checklist.datoms = Facts.Immutable.Stack Facts.Immutable.fromJS(initialData)
  console.info "window.checklist is ready", t: performance.now()
  console.info "initializing display", t: performance.now()
  checklist.on "transaction", (report) -> renderDatomTableNovelty(report)
  checklist.on "transaction", (report) -> saveDataToLocalStorage(report)
  checklist.on "transaction", (report) -> renderChecklistVersion(report)
  checklist.on "transaction", (report) -> renderChecklistTitleInHead()
  transaction = checklist.datoms.get(0).get(4)
  data = checklist.datoms.filter((datom) -> String(datom.get(1))[0] isnt "T").reverse()
  renderDatomTableNovelty({data, transaction})
  renderChecklist(transaction)
  renderChecklistTitleInHead()
  document.querySelector("#Checklist").classList.add("initialized")
  document.querySelector("#Checklist-Datoms").classList.add("initialized")
  document.body.setAttribute "touch-events", yes if TouchEvent?
  document.body.setAttribute "initialized", yes
  console.info "display is ready", t: performance.now()

# Guard against empty input tags (try outline trick).
document.on "keydown", "#Checklist .title", (event) ->
  switch event.keyCode
    # Enter
    when 13 then event.preventDefault()
    # Delete
    when 8 then event.preventDefault() if event.target.innerText.trim() is ""

document.on "input", "#Checklist .title", (event) ->
  Function.delay 1, -> checklist.advance 0, "title": event.target.innerText.trim()

document.on "mouseover", "#Checklist-Datoms [data-transaction]", (event) ->
  document.activeElement.blur()
  transaction = event.target.closest("[data-transaction]").getAttribute("data-transaction")
  renderSelectedTransactionInDatomTable(transaction)
  renderChecklist(transaction)

document.on "mouseout", "#Checklist-Datoms", ->
  renderSelectedTransactionInDatomTable(checklist.datoms.get(0).get(4))
  renderChecklist(checklist.datoms.get(0).get(4))

document.on "focus", "#Checklist ol.entities li", (event, li) ->
  li.classList.add("focused")

document.on "blur", "#Checklist ol.entities li", (event, li) ->
  li.classList.remove("focused")

renderChecklist = (transaction, focused) ->
  database = checklist.database(Number(transaction.replace("T","0")))
  root = Facts.query(in:database, where:(id) -> id is 0)[0]
  entities = Facts.query(in:database, where:(id) -> id in root.entities and id isnt focused)
  entities.push({id:d3.max(root.entities)+1})
  li = d3.select("#Checklist").select("ol.entities").selectAll("li:not(.focused)").data(entities, (entity)->entity.id)
  li.enter()
    .append "li"
    .on "mouseover", (entity) ->
      element = this.querySelector("[contenteditable]")
      if element.innerText
        selection = window.getSelection()
        selection.removeAllRanges()
        range = document.createRange()
        range.setStart(element.childNodes[0], element.innerText.length)
        range.setEnd(element.childNodes[0], element.innerText.length)
        selection.addRange(range)
      element.focus()
    .on "keydown", (entity) ->
      if event.keyCode is 8 and d3.event.target.innerText.trim() is "" and d3.event.target.innerText.length < 2 and d3.event.target.innerText isnt " "
        d3.event.target.blur()
        report = checklist.advance 0, entities:checklist.pull(0).entities.filter((id) -> id isnt entity.id)
        renderChecklist(report.transaction)
    .on "change", (entity) ->
      checklist[if d3.event.target.checked then "advance" else "reverse"] entity.id, "checked": true
    .on "input", (entity) ->
      checklist.advance entity.id, "label": d3.event.target.innerText.trim()
      root = checklist.pull(0)
      if (entity.id in root.entities) is false
        report = checklist.advance root.id, entities:root.entities.concat([entity.id])
        renderChecklist(report.transaction, entity.id)
  li.html (entity) -> """
    <label class="checkbox">
      <input name="entity-#{entity.id}" type="checkbox" #{if entity.checked then 'checked' else ''}>
      <span class="icon">✔︎</span>
      <span class="box"></span>
    </label>
    <div class="text label" contenteditable="plaintext-only">#{entity.label or ''}</div>
    """
  li.exit().remove()
  renderChecklistTitle(root["title"])
  renderChecklistVersion({transaction})


renderChecklistTitle = (title) ->
  document.querySelector("#Checklist .title").innerText = title or "\n"

renderChecklistTitleInHead = ->
  document.querySelector("title").innerText = checklist.pull(0)["title"] or "undefined"

renderChecklistVersion = (report) ->
  transaction = report?.transaction or checklist.datoms.first().get(4)
  document.querySelector("#Checklist header .version").innerText = Number(transaction.replace("T","0")).toFixed(3)
  document.querySelector("#Checklist header time").innerText = renderChecklistVersion.dateFormat new Date(Number(transaction.replace("T","0")))

renderChecklistVersion.dateFormat = d3.time.format("%A %B %d %Y at %I:%M:%S %p")

renderDatomTableHeader = (situation) ->
  return if renderDatomTableHeader.situation is situation
  renderDatomTableHeader.situation = situation
  for selector, pattern of renderDatomTableHeader.patterns
    Array.from(document.querySelectorAll(selector)).map (element) ->
      element.style.display = if situation.match pattern then "" else "none"

renderDatomTableHeader.patterns =
  "#Checklist-Datoms .data.saved.in.storage":"data saved in storage"
  "#Checklist-Datoms .data.is.volatile":"data is volatile"
  "#Checklist-Datoms .because.of.quota":"storage quota was exceeded"

renderDatomTableNovelty = (report) ->
  tbody = d3.select("#Checklist-Datoms table tbody")
  report.data.forEach (datom) ->
    tbody.insert("tr", ":first-child").attr("data-transaction",datom.get(4)).html """
      <td class="credence">#{datom.get(0)}</td>
      <td class="entity">#{("0"+String(datom.get(1))).slice(-2)}</td>
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
      localStorage.setItem "checklist datoms", JSON.stringify(checklist.datoms)
      renderDatomTableHeader "data saved in storage"
    catch exception
      renderDatomTableHeader "data is volatile" + switch
        when exception.name is "QuotaExceededError"
          " because storage quota was exceeded"
        else
          console.error("Unrecognized exception durring saveDataToLocalStorage", exception)
          " because an unrecognized exception occurred durring saveDataToLocalStorage"

constructDemoChecklistDatoms = ->
  time = performance.timing.navigationStart
  transaction = "T"+time
  return [
    [true, transaction, "time", time, transaction]
    [true, 1, "label", "Buy peanut butter", transaction]
    [true, 2, "label", "Get a job", transaction]
    [true, 3, "label", "Memorize Surfer Girl\nVerse 1:\nD+ B- G5 A5 𝄀 D▵ D7 G+ G-\nD+ B- G5 A5 𝄀 D+ B- G+ A+\nVerse 2:\nD+ B- G5 A5 𝄀 D▵ D7 G+ G-\nD+ B- G5 A5 𝄀 D+ B-/G D+ D7\n", transaction]
    [true, 0, "title", "Checklist", transaction]
    [true, 0, "entities", [1, 2, 3], transaction]
  ]
