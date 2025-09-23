"""Gladia Python SDK.

Import GladiaClient and start using Gladia API.
"""

from .client import GladiaClient as GladiaClient

__all__: list[str] = ["GladiaClient"]

# Try standard import first (works when `v2/` and `v2/live/` are packages)
try:
  from .v2.live.generated_types import *  # type: ignore  # noqa: F401,F403

  try:
    from .v2.live.generated_types import __all__ as _generated_all  # type: ignore

    __all__.extend(_generated_all)
  except Exception:
    for _name in list(globals().keys()):
      if not _name.startswith("_") and _name not in __all__:
        __all__.append(_name)
except Exception:
  # Fallback to dynamic load by file path (works even without package __init__.py files)
  import importlib.util as _importlib_util
  import os as _os
  import sys as _sys

  _generated_types_path = _os.path.join(
    _os.path.dirname(__file__),
    "v2",
    "live",
    "generated_types.py",
  )
  if _os.path.exists(_generated_types_path):
    _spec = _importlib_util.spec_from_file_location(
      "gladiaio_sdk.v2.live.generated_types",
      _generated_types_path,
    )
    if _spec and _spec.loader:
      _module = _importlib_util.module_from_spec(_spec)
      _sys.modules[_spec.name] = _module
      _spec.loader.exec_module(_module)  # type: ignore[attr-defined]
      for _name in dir(_module):
        if not _name.startswith("_"):
          globals()[_name] = getattr(_module, _name)
          if _name not in __all__:
            __all__.append(_name)
