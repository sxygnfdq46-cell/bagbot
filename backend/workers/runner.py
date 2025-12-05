import importlib


def run_job(path: str, *args, **kwargs):
    module_path, fn = path.rsplit(".", 1)
    mod = importlib.import_module(module_path)
    return getattr(mod, fn)(*args, **kwargs)
