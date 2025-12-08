# Ensure repo root is first on sys.path so pytest always finds this repo's packages.
import os, sys
repo_root = os.path.abspath(os.getcwd())
if not sys.path or sys.path[0] != repo_root:
    sys.path.insert(0, repo_root)
