"""发一封测试邮件，验证 SMTP + 授权码（真发，仅一封）。
授权码来源：环境变量 DSH_MAIL_PASSWORD，或本目录 password.txt。
"""
import sys
import os
import check_missed as cm
import ledger_store as ls

log = ls.setup_logger("cli", os.path.join(cm.BASE, "cli.log"))

cfg = {**cm.DEFAULTS, **cm.load_json(cm.CONFIG_PATH, {})}
to = sys.argv[1] if len(sys.argv) > 1 else cfg.get("recipient")
cfg["recipient"] = to

subj = "【测试】息 · 邮件通道验证"
body = (
    "这是一封测试邮件。\n\n"
    "收到说明 SMTP + 授权码配置成功，之后就能自动发送『漏做呼吸练习』的提醒了。\n\n"
    "—— 息"
)

log.info("测试发信 from=%s -> to=%s smtp=%s:%s ssl=%s"
         % (cfg["sender"], to, cfg["smtp_host"], cfg["smtp_port"], cfg["smtp_ssl"]))
ok = cm.send_email(cfg, subj, body)
print("RESULT:", "OK 已发出，请去收件箱查看" if ok else "FAILED，见 check.log / 控制台错误")
