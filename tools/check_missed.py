"""每日检查：按"整天算"，当天无完成（且数据源健康）则发提醒邮件到绑定邮箱。
健壮性：优先向记账服务取权威状态；服务离线回退读账本文件；账本损坏/不可用则不发送（避免误发）。
dry-run 不占用真实发送名额。
"""
import os
import sys
import json
import ssl
import smtplib
import datetime
import urllib.request
from email.message import EmailMessage
from email.utils import make_msgid
import ledger_store as ls

BASE = os.path.dirname(os.path.abspath(__file__))
CONFIG_PATH = os.path.join(BASE, "config.json")
LEDGER_PATH = os.path.join(BASE, "ledger.json")
STATE_PATH = os.path.join(BASE, "state.json")
OUTBOX_PATH = os.path.join(BASE, "outbox.log")
PASSWORD_FILE = os.path.join(BASE, "password.txt")
ENV_FILE = os.path.join(BASE, ".env")
log = ls.setup_logger("check", os.path.join(BASE, "check.log"))

DEFAULTS = {
    "recipient": "you@example.com",
    "sender": "me@example.com",
    "smtp_host": "smtp.example.com",
    "smtp_port": 465,
    "smtp_ssl": True,
    "username": "me@example.com",
    "check_hour": 22,
    "threshold_missed_days": 1,
    "dry_run": True,
    "lang": "zh",
    "recorder_port": 8765,
}


def _read_dotenv(path):
    vals = {}
    if not os.path.exists(path):
        return vals
    try:
        with open(path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#") or "=" not in line:
                    continue
                k, v = line.split("=", 1)
                vals[k.strip()] = v.strip().strip('"').strip("'")
    except Exception:
        pass
    return vals


def get_password():
    """授权码优先级：环境变量 → .env 文件 → password.txt（兼容旧方式）。
    建议用 .env / 环境变量，避免像 password.txt 那样明文留在目录里。"""
    for k in ("DSH_MAIL_PASSWORD", "SHIH_MAIL_PASSWORD", "MAIL_PASSWORD"):
        v = os.environ.get(k)
        if v and v.strip():
            return v.strip()
    env = _read_dotenv(ENV_FILE)
    for k in ("DSH_MAIL_PASSWORD", "SHIH_MAIL_PASSWORD", "MAIL_PASSWORD"):
        if env.get(k):
            return env[k]
    if os.path.exists(PASSWORD_FILE):
        with open(PASSWORD_FILE, "r", encoding="utf-8") as f:
            return f.read().strip()
    return ""


def load_json(path, default):
    if not os.path.exists(path):
        return default
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        log.warning("读取 %s 失败(%r)，使用默认值" % (os.path.basename(path), e))
        return default


def fetch_status(port):
    try:
        with urllib.request.urlopen("http://127.0.0.1:%d/status" % int(port), timeout=3) as r:
            return json.loads(r.read().decode("utf-8"))
    except Exception as e:
        log.warning("记账服务不可达(port=%s)：%r" % (port, e))
        return None


def validate(cfg):
    r = str(cfg.get("recipient", "") or "")
    h = str(cfg.get("smtp_host", "") or "")
    if not r or "@" not in r or r.endswith("@example.com"):
        return False, "recipient 未配置或仍为占位"
    if not h or h.endswith("example.com"):
        return False, "smtp_host 未配置或仍为占位"
    return True, ""


def compose(cfg, missed, today, total):
    subj = "给自己 30 秒 —— 今天还没做呼吸练习"
    if not total:
        done_sentence = "今天还没有记录到呼吸练习。"
    else:
        done_sentence = "今天（%s）还没有完成呼吸练习，已经连续 %s 天没做了。" % (today.isoformat(), missed)
    body = (
        "你好，\n\n"
        "提醒一下：%s\n\n"
        "不用有压力。现在站起来，做 3 次长呼气：\n"
        "  鼻吸 4 秒 → 嘴呼 6 秒，呼气比吸气长，做 3 次，就 30 秒。\n\n"
        "做完就关掉这封邮件，回去忙。\n"
        "（这是你自己设置的提醒，可在插件里一键暂停。）\n\n"
        "—— 息"
    ) % done_sentence
    return subj, body


def send_email(cfg, subj, body, dry_run):
    if dry_run:
        record = {
            "ts": datetime.datetime.now().isoformat(timespec="seconds"),
            "mode": "DRY-RUN",
            "to": cfg["recipient"],
            "from": cfg["sender"],
            "subject": subj,
            "body": body,
        }
        with open(OUTBOX_PATH, "a", encoding="utf-8") as f:
            f.write(json.dumps(record, ensure_ascii=False) + "\n")
        log.info("[DRY-RUN] 本应发送邮件 -> %s（写入 outbox.log，未真正发送）" % cfg["recipient"])
        return True

    pw = get_password()
    if not pw:
        log.error("未找到 SMTP 授权码（环境变量 DSH_MAIL_PASSWORD 或 password.txt）")
        return False
    msg = EmailMessage()
    msg["Subject"] = subj
    msg["From"] = cfg["sender"]
    msg["To"] = cfg["recipient"]
    msg["Message-ID"] = make_msgid()
    msg.set_content(body)
    try:
        if cfg.get("smtp_ssl", True):
            ctx = ssl.create_default_context()
            with smtplib.SMTP_SSL(cfg["smtp_host"], int(cfg["smtp_port"]), context=ctx, timeout=30) as s:
                s.login(cfg["username"], pw)
                s.send_message(msg)
        else:
            with smtplib.SMTP(cfg["smtp_host"], int(cfg["smtp_port"]), timeout=30) as s:
                s.starttls(context=ssl.create_default_context())
                s.login(cfg["username"], pw)
                s.send_message(msg)
        log.info("已发送提醒邮件 -> %s" % cfg["recipient"])
        return True
    except Exception as e:
        log.exception("发送失败：%r" % e)
        return False


def main():
    cfg = {**DEFAULTS, **load_json(CONFIG_PATH, {})}
    dry_run = bool(cfg.get("dry_run", True))
    threshold = int(cfg.get("threshold_missed_days", 1))
    today = datetime.date.today()

    if str(cfg.get("pause_date") or "") == today.isoformat():
        log.info("今天已暂停提醒(pause_date=%s)，跳过本次" % cfg.get("pause_date"))
        return

    okv, reason = validate(cfg)
    if not okv:
        if dry_run:
            log.warning("配置不完整(%s)，当前 dry-run 继续仅记录" % reason)
        else:
            log.error("配置不完整(%s)，拒绝发送" % reason)
            return

    st = fetch_status(cfg.get("recorder_port", 8765))
    if st and st.get("ok"):
        source = "recorder"
        today_done = bool(st.get("todayDone"))
        missed = st.get("missed")
        total = st.get("total")
    else:
        log.warning("记账服务离线，回退读取账本文件")
        s = ls.summary(LEDGER_PATH)
        if not s.get("ok"):
            log.error("账本损坏/不可用(%s)，为避免误发，本次跳过" % s.get("error"))
            return
        source = "file"
        today_done = bool(s.get("todayDone"))
        missed = s.get("missed")
        total = s.get("total")

    log.info("数据源=%s todayDone=%s missed=%s total=%s threshold=%d dry_run=%s"
             % (source, today_done, missed, total, threshold, dry_run))

    if today_done:
        log.info("今天已完成，不发送")
        return
    if missed is None:
        missed = 1
    if missed < threshold:
        log.info("未达阈值(missed=%s < %d)，不发送" % (missed, threshold))
        return

    state = load_json(STATE_PATH, {})
    if state.get("last_notified_date") == today.isoformat():
        log.info("今天已通知过，跳过")
        return

    subj, body = compose(cfg, missed, today, total)
    ok = send_email(cfg, subj, body, dry_run)
    if ok and not dry_run:  # dry-run 不占用真实发送名额（F3）
        state["last_notified_date"] = today.isoformat()
        state["last_missed_days"] = missed
        state["last_check"] = datetime.datetime.now().isoformat(timespec="seconds")
        ls.atomic_write_json(STATE_PATH, state)
        log.info("已记录发送状态 state.json")


if __name__ == "__main__":
    main()
