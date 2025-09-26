from typing import Any


def deep_merge_dicts(dict1: dict[str, Any], dict2: dict[str, Any]) -> dict[str, Any]:
  """
  Recursively merge two dictionaries.
  """
  result = {key: value for key, value in dict1.items() if value is not None}
  for key, value in dict2.items():
    if key in result and isinstance(result[key], dict) and isinstance(value, dict):
      result[key] = deep_merge_dicts(result[key], value)
    elif value is not None:
      result[key] = value
  return result
