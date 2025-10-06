def matches_status(status: int, rules: list[int | tuple[int, int]] | None) -> bool:
  if not rules:
    return False
  for rule in rules:
    if isinstance(rule, tuple):
      start, end = rule
      if start <= status <= end:
        return True
    else:
      if status == rule:
        return True
  return False


def build_url(base_url: str, url: str) -> str:
  # If already absolute, return as is
  if url.startswith(("ws://", "wss://", "http://", "https://")):
    return url
  base = base_url
  if base.endswith("/") and url.startswith("/"):
    return base + url[1:]
  if base.endswith("/") or url.startswith("/"):
    return base + url
  return f"{base}/{url}"
