document.on = (eventname, selector, procedure) ->
  if selector instanceof Function
    procedure = selector
    selector = undefined
  if selector
    wrapped = (event) ->
      if element = event.target.closest(selector)
        procedure(event, element)
  else
    wrapped = procedure
  document.addEventListener eventname, wrapped, yes
