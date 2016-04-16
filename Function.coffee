Function.delay = (amount, procedure, data) -> setTimeout((-> procedure(data)), amount)
