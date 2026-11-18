"""本机「记账服务」：呼吸插件 POST /done 记录完成；提供 /status /history /config。
独立于 DSH 运行（开机自启）。含原子写、锁、幂等、完成校验。
"""
import os
import json
import datetime
from urllib.parse import urlparse, parse_qs
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import ledger_store as ls

BASE = os.path.dirname(os.path.abspath(__file__))
LEDGER = os.path.join(BASE, "ledger.json")
CONFIG = os.path.join(BASE, "config.json")
PORT = 8765
log = ls.setup_logger("recorder", os.path.join(BASE, "recorder.log"))

SAFE_DEFAULTS = {"recipient": "", "threshold_missed_days": 1, "dry_run": True, "check_hour": 22, "pause_date": None}


def load_config():
    try:
        with open(CONFIG, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {}


def safe_config():
    c = load_config()
    return {k: c.get(k, SAFE_DEFAULTS[k]) for k in SAFE_DEFAULTS}


def save_config_updates(updates):
    c = load_config()
    changed = False
    for k in ("recipient", "threshold_missed_days", "dry_run", "check_hour", "pause_date"):
        if k not in updates:
            continue
        v = updates[k]
        try:
            if k == "recipient" and isinstance(v, str) and "@" in v:
                c[k] = v.strip(); changed = True
            elif k == "threshold_missed_days":
                iv = int(v)
                if iv >= 1: c[k] = iv; changed = True
            elif k == "check_hour":
                iv = int(v)
                if 0 <= iv <= 23: c[k] = iv; changed = True
            elif k == "dry_run" and isinstance(v, bool):
                c[k] = v; changed = True
            elif k == "pause_date" and (v is None or isinstance(v, str)):
                c[k] = v; changed = True
        except Exception:
            pass
    if changed:
        ls.atomic_write_json(CONFIG, c)
    return changed


def status():
    return ls.summary(LEDGER)


def history(days=7):
    data, _ = ls.read_json_status(LEDGER)
    comps = data.get("completions", []) if isinstance(data, dict) else []
    counts = {}
    for item in comps:
        try:
            dt = datetime.datetime.fromisoformat(str(item).replace("Z", ""))
            key = dt.date().isoformat()
            counts[key] = counts.get(key, 0) + 1
        except Exception:
            continue
    today = datetime.date.today()
    out = []
    for i in range(days - 1, -1, -1):
        d = (today - datetime.timedelta(days=i)).isoformat()
        cnt = counts.get(d, 0)
        out.append({"date": d, "count": cnt, "done": cnt > 0})
    return {"ok": True, "days": out}


class Handler(BaseHTTPRequestHandler):
    def _cors(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")

    def _json(self, code, obj):
        body = json.dumps(obj, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self._cors()
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_response(204)
        self._cors()
        self.end_headers()

    def do_GET(self):
        u = urlparse(self.path)
        if u.path.startswith("/status"):
            self._json(200, status())
        elif u.path.startswith("/history"):
            try:
                days = int(parse_qs(u.query).get("days", ["7"])[0])
            except Exception:
                days = 7
            self._json(200, history(max(1, min(days, 60))))
        elif u.path.startswith("/config"):
            self._json(200, safe_config())
        elif u.path.startswith("/ping"):
            self._json(200, {"ok": True})
        else:
            self._json(404, {"error": "not found"})

    def do_POST(self):
        u = urlparse(self.path)
        if u.path.startswith("/done"):
            length = int(self.headers.get("Content-Length", "0") or "0")
            raw = self.rfile.read(length) if length else b"{}"
            try:
                data = json.loads(raw.decode("utf-8") or "{}")
            except Exception:
                data = {}
            breaths = data.get("breaths")
            if breaths is not None:
                try:
                    if int(breaths) < 3:
                        log.warning("拒绝记录：breaths=%s < 3" % breaths)
                        self._json(400, {"ok": False, "error": "breaths<3"})
                        return
                except Exception:
                    pass
            key = data.get("ts")
            if not isinstance(key, str) or not key:
                key = datetime.datetime.now().isoformat(timespec="seconds")
            try:
                _, added = ls.append_completion(LEDGER, dedupe_key=key)
            except Exception as e:
                log.error("写入账本失败：%r" % e)
                self._json(500, {"ok": False, "error": "write_failed"})
                return
            log.info("完成记录 %s" % ("已写入" if added else "重复(幂等跳过)"))
            self._json(200, status())
        elif u.path.startswith("/config"):
            length = int(self.headers.get("Content-Length", "0") or "0")
            raw = self.rfile.read(length) if length else b"{}"
            try:
                data = json.loads(raw.decode("utf-8") or "{}")
            except Exception:
                data = {}
            changed = save_config_updates(data if isinstance(data, dict) else {})
            log.info("配置更新 %s" % ("已保存" if changed else "无有效变更"))
            self._json(200, safe_config())
        else:
            self._json(404, {"error": "not found"})

    def log_message(self, *args):
        pass


def main():
    srv = ThreadingHTTPServer(("127.0.0.1", PORT), Handler)
    log.info("记账服务启动：http://127.0.0.1:%d" % PORT)
    srv.serve_forever()


if __name__ == "__main__":
    main()
