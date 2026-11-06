"""Live events sent as XML tags in the transcript (Gladia Enterprise `xml_events` option).

With `"xml_events": true` in the session's init, every live event but the transcripts (speech
start and end, end of turn, translation, entities, sentiment, errors...) arrives as a final
`transcript` message whose `utterance.text` is one short XML tag, and whose id starts with
`xml_`:

  <end_of_turn channel="0" probability="0.97" reason="model" end="3.84"/>

`is_xml_event` tells such a message from speech, `parse_xml_event` reads its tag back:

  @session.on("message")
  def on_message(message):
    event = parse_xml_event(message)
    if event is not None:
      print(event.tag, event.attributes)  # end_of_turn {'channel': '0', ...}
    elif message.type == "transcript" and message.data.is_final:
      print(message.data.utterance.text)
"""

from __future__ import annotations

import xml.etree.ElementTree as ET
from dataclasses import dataclass, field
from typing import Any

XML_EVENT_ID_PREFIX = "xml_"
_TRANSCRIPT = "transcript"


@dataclass(frozen=True, slots=True)
class LiveV2XmlEvent:
  """One event read from its tag: `tag` is the event (`end_of_turn`, `translation`...),
  `attributes` its kept keys (strings, as in the tag), `text` its main text (a translation, an
  entity), `children` the nested tags (the entities of `named_entities`)."""

  tag: str
  attributes: dict[str, str] = field(default_factory=dict)
  text: str | None = None
  children: list[LiveV2XmlEvent] = field(default_factory=list)

  @property
  def error(self) -> str | None:
    """The reason when the event failed (a translation, an add-on), else None."""
    return self.attributes.get("error")


def _get(obj: Any, key: str) -> Any:
  if isinstance(obj, dict):
    return obj.get(key)
  return getattr(obj, key, None)


def _text_of(message: Any) -> str | None:
  """The utterance text of an XML event message (a dict or an SDK message), else None."""
  if _get(message, "type") != _TRANSCRIPT:
    return None
  data = _get(message, "data")
  event_id = _get(data, "id")
  if not isinstance(event_id, str) or not event_id.startswith(XML_EVENT_ID_PREFIX):
    return None
  text = _get(_get(data, "utterance"), "text")
  return text if isinstance(text, str) else None


def is_xml_event(message: Any) -> bool:
  """True for a transcript message that carries an event as an XML tag."""
  return _text_of(message) is not None


def _event(element: ET.Element) -> LiveV2XmlEvent:
  return LiveV2XmlEvent(
    tag=element.tag,
    attributes=dict(element.attrib),
    text=element.text,
    children=[_event(child) for child in element],
  )


def parse_xml_event(message_or_text: Any) -> LiveV2XmlEvent | None:
  """The event of an XML event message, or of a tag's text; None for anything else (a
  transcript of speech, another message, text that is not one XML element)."""
  text = message_or_text if isinstance(message_or_text, str) else _text_of(message_or_text)
  if text is None or not text.lstrip().startswith("<"):
    return None
  try:
    element = ET.fromstring(text)  # noqa: S314 - the server's own tags, no DTD, no entity
  except ET.ParseError:
    return None
  return _event(element)
