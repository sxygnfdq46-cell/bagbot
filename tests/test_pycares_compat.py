import types
import pytest

from worker import pycares_compat


def test_wrapper_prefers_a_result():
    stub = types.SimpleNamespace(ares_query_a_result=lambda *args, **kwargs: "ares_result")
    fn = pycares_compat._ares_query_wrapper(stub)
    assert fn is stub.ares_query_a_result


def test_wrapper_falls_back(monkeypatch):
    stub = types.SimpleNamespace(ares_query=lambda *args, **kwargs: "ares_fallback")

    fn = pycares_compat._ares_query_wrapper(stub)
    assert fn is stub.ares_query

    pycares_compat.ensure_pycares_compat(stub)
    assert hasattr(stub, "ares_query_a_result")
    assert stub.ares_query_a_result is stub.ares_query


def test_wrapper_raises_descriptive():
    stub = types.SimpleNamespace()
    with pytest.raises(AttributeError) as excinfo:
        pycares_compat._ares_query_wrapper(stub)
    assert "ares_query" in str(excinfo.value)


def test_ensure_returns_none_when_missing(monkeypatch):
    monkeypatch.setattr(
        pycares_compat.importlib,
        "import_module",
        lambda name: (_ for _ in ()).throw(ImportError()),
    )
    assert pycares_compat.ensure_pycares_compat() is None
