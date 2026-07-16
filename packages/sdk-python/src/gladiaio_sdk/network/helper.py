from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit


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
  """Join ``base_url`` and ``url``, keeping any query string at the end.

  Absolute ``url`` values are returned unchanged. Path segments are concatenated
  (same as before) so proxy path prefixes are preserved, but base and relative
  query params are merged onto the final URL instead of being left mid-path.
  """
  if url.startswith(("ws://", "wss://", "http://", "https://")):
    return url

  base = urlsplit(base_url)
  rel = urlsplit(url)

  base_path = base.path
  rel_path = rel.path
  if base_path.endswith("/") and rel_path.startswith("/"):
    path = base_path + rel_path[1:]
  elif base_path.endswith("/") or rel_path.startswith("/"):
    path = base_path + rel_path
  elif base_path:
    path = f"{base_path}/{rel_path}"
  else:
    path = rel_path

  params = dict(parse_qsl(base.query, keep_blank_values=True))
  params.update(dict(parse_qsl(rel.query, keep_blank_values=True)))
  query = urlencode(params)

  return urlunsplit((base.scheme, base.netloc, path, query, rel.fragment or base.fragment))
