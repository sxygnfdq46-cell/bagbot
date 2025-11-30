from typing import Type, Dict
from bagbot.worker.strategies.plugin import PluginBase

_PLUGIN_REGISTRY: Dict[str, Type[PluginBase]] = {}

def register_plugin(name: str, cls: Type[PluginBase]) -> None:
    _PLUGIN_REGISTRY[name] = cls

def get_plugin_class(name: str):
    return _PLUGIN_REGISTRY.get(name)

def list_plugins():
    return list(_PLUGIN_REGISTRY.keys())

from bagbot.worker.strategies.plugins.sample_plugin import SamplePlugin
register_plugin("sample", SamplePlugin)
