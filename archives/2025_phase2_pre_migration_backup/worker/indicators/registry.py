indicator_registry = {}

def register_indicator(name, cls):
    indicator_registry[name] = cls

def get_indicator(name):
    return indicator_registry.get(name)
