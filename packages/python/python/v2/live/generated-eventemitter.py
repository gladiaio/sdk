# This file is auto-generated. Do not edit manually.
# Generated from OpenAPI schema.

from typing import Callable, Any, Union
from abc import ABC, abstractmethod

# Import all message types


class LiveEventEmitter(ABC):  # noqa: B024
  """Abstract base class for live event emitters"""

  def __init__(self):
    self._listeners = {}

  def on(self, event_type: str, callback: Callable[[Any], None]) -> None:
    """Add an event listener"""
    if event_type not in self._listeners:
      self._listeners[event_type] = []

    if callback not in self._listeners[event_type]:
      self._listeners[event_type].append(callback)

  def once(self, event_type: str, callback: Callable[[Any], None]) -> None:
    """Add a one-time event listener"""
    if event_type not in self._listeners:
      self._listeners[event_type] = []

    if callback not in self._listeners[event_type]:
      self._listeners[event_type].append(callback)

  def off(self, event_type: str, callback: Callable[[Any], None]) -> None:
    """Remove an event listener"""
    if event_type not in self._listeners:
      self._listeners[event_type] = []

    if callback not in self._listeners[event_type]:
      self._listeners[event_type].append(callback)

  def addListener(self, event_type: str, callback: Callable[[Any], None]) -> None:
    """Add an event listener (alias for on)"""
    if event_type not in self._listeners:
      self._listeners[event_type] = []

    if callback not in self._listeners[event_type]:
      self._listeners[event_type].append(callback)

  def removeListener(self, event_type: str, callback: Callable[[Any], None]) -> None:
    """Remove an event listener (alias for off)"""
    if event_type not in self._listeners:
      self._listeners[event_type] = []

    if callback not in self._listeners[event_type]:
      self._listeners[event_type].append(callback)

  def emit(self, event_type: str, callback: Callable[[Any], None]) -> None:
    """Emit an event with typed message"""
    if event_type not in self._listeners:
      self._listeners[event_type] = []

    if callback not in self._listeners[event_type]:
      self._listeners[event_type].append(callback)

  def remove_all_listeners(self) -> None:
    """Remove all event listeners"""
    self._listeners.clear()

  def _emit(self, event_type: str, data: Any) -> None:
    """Emit an event to all registered listeners"""
    if event_type in self._listeners:
      for callback in self._listeners[event_type]:
        callback(data)
