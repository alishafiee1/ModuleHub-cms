# P2b Manual Test Checklist

- [ ] Upload standalone ZIP from `/admin` → module appears with **settings_pending** (orange dot)
- [ ] Settings form opens automatically after upload
- [ ] Save valid settings → status becomes **running** (green dot)
- [ ] Before Save: `GET /modules/<id>/api/*` returns **503** with settings message
- [ ] After Save: proxy routes API paths (or returns non-503 if container healthy)
- [ ] Click tile with settings_pending → settings form opens pre-filled
- [ ] Start button on settings_pending module prompts settings (no separate Approve step)
- [ ] Stop/Start still work for configured modules
