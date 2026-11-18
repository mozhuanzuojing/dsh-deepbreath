#!/usr/bin/env python3
"""dsh-deepbreath 发件邮箱配置向导（把你的发件邮箱/授权码写到 config.json + .env）。

用法：
  交互式：  python setup_mail.py
  参数式：  python setup_mail.py --sender you@163.com --provider 163 --code 你的授权码 --recipient you@163.com --live

安全：
  - 授权码写入同目录 .env（DSH_MAIL_PASSWORD），不要提交到 git、不要外发。
  - 默认 dry_run=true（只记录不发信）；确认无误加 --live 才真发。
"""
import os
import sys
import json
import argparse

PRESETS = {
    "163":     {"smtp_host": "smtp.163.com",       "smtp_port": 465, "smtp_ssl": True},
    "126":     {"smtp_host": "smtp.126.com",       "smtp_port": 465, "smtp_ssl": True},
    "qq":      {"smtp_host": "smtp.qq.com",        "smtp_port": 465, "smtp_ssl": True},
    "gmail":   {"smtp_host": "smtp.gmail.com",     "smtp_port": 587, "smtp_ssl": False},
    "outlook": {"smtp_host": "smtp.office365.com", "smtp_port": 587, "smtp_ssl": False},
}


def ask(prompt, default=None):
    suffix = (" [%s]" % default) if default else ""
    v = input(prompt + suffix + ": ").strip()
    return v if v else (default or "")


def main():
    ap = argparse.ArgumentParser(description="配置 dsh-deepbreath 的发件邮箱")
    ap.add_argument("--dir", default=os.path.dirname(os.path.abspath(__file__)), help="配置输出目录（默认本脚本目录）")
    ap.add_argument("--sender", help="发件邮箱地址")
    ap.add_argument("--provider", help="163/126/qq/gmail/outlook/other")
    ap.add_argument("--code", help="邮箱授权码（不是登录密码）")
    ap.add_argument("--recipient", help="收件地址（漏做提醒发到哪，默认=发件邮箱）")
    ap.add_argument("--threshold", type=int, default=1, help="连续漏做几天才发，默认 1")
    ap.add_argument("--check-hour", type=int, default=22, help="每天检查时刻 0-23，默认 22")
    ap.add_argument("--smtp-host"); ap.add_argument("--smtp-port", type=int); ap.add_argument("--no-ssl", action="store_true")
    ap.add_argument("--live", action="store_true", help="真发（dry_run=false）；缺省为安全 dry-run")
    args = ap.parse_args()

    sender = args.sender or ask("发件邮箱(你的邮箱地址)")
    if not sender or "@" not in sender:
        print("发件邮箱无效。"); return 2
    provider = (args.provider or ask("服务商 163/126/qq/gmail/outlook/other", "163")).lower()

    if provider == "other":
        host = args.smtp_host or ask("SMTP 服务器")
        port = args.smtp_port or int(ask("SMTP 端口", "465"))
        ssl = not args.no_ssl
    elif provider in PRESETS:
        p = PRESETS[provider]
        host, port, ssl = p["smtp_host"], p["smtp_port"], p["smtp_ssl"]
    else:
        print("未知服务商；请用 --provider other 并给 --smtp-host。"); return 2

    code = args.code or ask("授权码(不是登录密码)")
    if not code:
        print("缺少授权码。"); return 2
    recipient = args.recipient or ask("收件地址(漏做提醒发到哪)", sender)
    dry = not args.live

    cfg = {
        "recipient": recipient, "sender": sender,
        "smtp_host": host, "smtp_port": port, "smtp_ssl": ssl, "username": sender,
        "check_hour": args.check_hour, "threshold_missed_days": args.threshold,
        "dry_run": dry, "lang": "zh", "recorder_port": 8765,
    }
    d = args.dir
    with open(os.path.join(d, "config.json"), "w", encoding="utf-8") as f:
        json.dump(cfg, f, ensure_ascii=False, indent=2)
    with open(os.path.join(d, ".env"), "w", encoding="utf-8") as f:
        f.write("DSH_MAIL_PASSWORD=%s\n" % code)

    print("已写入: %s" % os.path.join(d, "config.json"))
    print("已写入: %s   (请勿提交 git / 外发)" % os.path.join(d, ".env"))
    print("发件 %s -> SMTP %s:%s ssl=%s | 收件 %s | dry_run=%s"
          % (sender, host, port, ssl, recipient, dry))
    print("下一步：运行 enable_all.ps1 注册计划任务；运行 send_test.py 验证发信；确认后可用 --live 或改 config dry_run=false 真发。")
    return 0


if __name__ == "__main__":
    sys.exit(main())
