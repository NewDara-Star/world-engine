# 39: Download sizes the browser hides

Why: on the owner's published link (Cloudflare Workers, Safari on a Mac,
2026-10-11) the `?measure` panel said "0.0 MB (0.0 MB unpacked), in 47 files"
although the game had loaded. Resource Timing gave 0 for every size.

## Sources (cited from the standards; not reopened in this session)

- **MDN, `PerformanceResourceTiming.transferSize`**: 0 when the file came from
  a local cache, and 0 for a cross-origin file without a
  `Timing-Allow-Origin` header. Safari is known to report 0 in more cases;
  we did not find an official list, so the code treats any 0 as "no size".
- **RFC 9110 (HTTP Semantics), section 9.3.2 HEAD**: the answer carries the
  headers a GET would, though the server may leave some out. **Section 8.6
  Content-Length**: the size of the body as sent, so with compression it is
  the packed size, which is what the player downloads.
- **Fetch standard, request cache mode `no-store`** (MDN `Request.cache`):
  goes to the server and does not use or fill the browser's cache.
- **Fetch standard, `Response.arrayBuffer()`**: the body after the browser
  has unpacked it, so counting it gives the unpacked size, an upper bound on
  the download.
- **RFC 9112 (HTTP/1.1), section 9.4 Concurrency**: a client ought to limit
  its open connections to one server. Six at a time follows Chromium's
  per-server limit (`net/socket/client_socket_pool_manager.cc`, BSD; the
  figure only, no code).

## What we take

Ask the size first (HEAD, no download); if the server gives no usable
Content-Length, download the file again with `cache: "no-store"` and count
the bytes, and say it is the unpacked size. Say in the report which way each
size was found, and how many files had no size at all. Only in `?measure`
mode; the player's game never makes these requests.

## Not checked

Whether Cloudflare's static assets answer HEAD with a Content-Length for
compressed files. If they do not, every size will be "downloaded again and
counted" (unpacked), and the report says so.
