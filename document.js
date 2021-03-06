// Generated by CoffeeScript 1.10.0
(function() {
  document.on = function(eventname, selector, procedure) {
    var wrapped;
    if (selector instanceof Function) {
      procedure = selector;
      selector = void 0;
    }
    if (selector) {
      wrapped = function(event) {
        var element;
        if (element = event.target.closest(selector)) {
          return procedure(event, element);
        }
      };
    } else {
      wrapped = procedure;
    }
    return document.addEventListener(eventname, wrapped, true);
  };

}).call(this);
