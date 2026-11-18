"""一键打卡（旧入口，插件做好后可不用）：把"今天完成了呼吸练习"记进账本。
使用公共 ledger_store，避免与 recorder 并发写冲突。
"""
import os
import ledger_store as ls

BASE = os.path.dirname(os.path.abspath(__file__))
LEDGER_PATH = os.path.join(BASE, "ledger.json")
log = ls.setup_logger("cli", os.path.join(BASE, "cli.log"))


def main():
    _, added = ls.append_completion(LEDGER_PATH)
    s = ls.summary(LEDGER_PATH)
    msg = "已完成一次打卡，累计 %s 天，连续 %s 天" % (s.get("total"), s.get("streak"))
    if not added:
        msg = "本次视为重复，未重复计数"
    log.info(msg)
    print(msg)


if __name__ == "__main__":
    main()
