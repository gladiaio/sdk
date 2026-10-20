"""The live init options only the Gladia Enterprise API knows (the ``api_url`` of your
deployment). Gladia's cloud API refuses them. Hand-written: the generator reads the cloud API's
schema (generated_types.py), which does not have them."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Literal  # noqa: F401 - the parent's annotations resolve here

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


@dataclass(frozen=True, slots=True)
class LiveV2EnterpriseInitRequest(LiveV2InitRequest):
  """``LiveV2InitRequest`` plus the Gladia Enterprise options. Pass it to ``start_session`` like a
  ``LiveV2InitRequest``: its fields are sent as they are."""

  # Which event closes a final transcript. None: the engine's default.
  finals: LiveV2EnterpriseFinals | None = None
