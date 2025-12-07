import pytest

def test_import_core_packages():
    import backend.models
    import worker
    # basic attribute check to ensure modules load
    assert hasattr(backend.models, '__all__') or hasattr(backend.models, 'Order')
