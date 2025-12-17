# tests/test_master_plugin_integration.py
import pytest
from bagbot.worker.strategies.plugin_registry import register_plugin
from bagbot.worker.strategies.master import MasterStrategy
from bagbot.worker.strategies.plugins.sample_plugin import SamplePlugin

def test_master_strategy_with_sample_plugin():
    # register sample plugin if not already
    register_plugin("sample", SamplePlugin)
    
    # construct master with sample plugin
    master = MasterStrategy(["sample"])
    
    # call evaluate_on_price
    result = master.evaluate_on_price({"symbol":"BTCUSDT","price":1000})
    
    # assert no exceptions raised and result is dict
    assert isinstance(result, dict)

def test_master_strategy_evaluate_on_signal_check():
    register_plugin("sample", SamplePlugin)
    master = MasterStrategy(["sample"])
    
    result = master.evaluate_on_signal_check({"symbol":"ETHUSDT"})
    
    assert isinstance(result, dict)
