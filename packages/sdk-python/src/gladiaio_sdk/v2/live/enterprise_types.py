"""The live init options only the Gladia Enterprise API knows (the ``api_url`` of your
deployment). Hand-written: the generator reads the cloud API's schema (generated_types.py),
which does not have them.

Gladia's cloud API refuses an unknown field (``400 property finals should not exist``), so the
same code runs on both: towards the cloud (``api.gladia.io``) the SDK drops these fields, with one
warning per field (``init_body_for``); towards any other ``api_url`` (an Enterprise deployment, a
proxy) it sends them as they are."""

from __future__ import annotations

import warnings
from dataclasses import dataclass
from typing import Any, Literal  # noqa: F401 - the parent's annotations resolve here
from urllib.parse import urlparse

from dataclasses_json import CatchAll  # noqa: F401 - the parent's `_unknown_fields`

# Every name the parent's annotations use: dataclasses_json resolves them in this module.
from .generated_types import *  # noqa: F403
from .generated_types import LiveV2InitRequest

# Which event closes a final transcript.
# - "end_of_turn": the end of the speaker's turn; a pause inside a turn does not cut (voice agents).
# - "sentence_or_end_of_turn": the first of the end of a sentence or the end of the turn.
# - "sentence": a pause read as the end of a sentence; a number or an address being dictated is
#   still held (meeting recorders, subtitles).
# - "endpointing": the `endpointing` silence or `maximum_duration_without_endpointing`, nothing
#   else (the behaviour of Gladia's cloud API).
LiveV2EnterpriseFinals = Literal[
  "end_of_turn", "sentence_or_end_of_turn", "sentence", "endpointing"
]


# The top-level init fields the Gladia Enterprise API adds.
ENTERPRISE_INIT_FIELDS: tuple[str, ...] = ("finals",)
CLOUD_HOSTS = frozenset({"api.gladia.io"})
_warned: set[str] = set()


def is_gladia_cloud(api_url: str) -> bool:
  """Whether ``api_url`` is Gladia's cloud API."""
  try:
    return (urlparse(api_url).hostname or "") in CLOUD_HOSTS
  except ValueError:
    return False


def init_body_for(body: dict[str, Any], api_url: str | None) -> dict[str, Any]:
  """The init body for ``api_url``: unchanged for an Enterprise deployment; without the Enterprise
  fields for Gladia's cloud API, each dropped field warned once."""
  if api_url is None or not is_gladia_cloud(api_url):
    return body
  out = dict(body)
  for field_name in ENTERPRISE_INIT_FIELDS:
    if field_name not in out:
      continue
    del out[field_name]
    if field_name not in _warned:
      _warned.add(field_name)
      warnings.warn(
        f'gladiaio-sdk: "{field_name}" is a Gladia Enterprise option, not sent to Gladia\'s cloud '
        f"API (api_url {api_url})",
        stacklevel=3,
      )
  return out


def reset_enterprise_warnings() -> None:
  """Test hook: forget which fields were warned about."""
  _warned.clear()


@dataclass(frozen=True, slots=True)
class LiveV2EnterpriseInitRequest(LiveV2InitRequest):
  """``LiveV2InitRequest`` plus the Gladia Enterprise options. Pass it to ``start_session`` like a
  ``LiveV2InitRequest``: its fields are sent as they are."""

  # Which event closes a final transcript. None: the engine's default.
  finals: LiveV2EnterpriseFinals | None = None
