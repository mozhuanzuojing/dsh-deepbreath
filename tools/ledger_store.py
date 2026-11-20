"""账本公共模块：原子写、跨进程文件锁、安全读、以及纯日期/漏做算法。
被 recorder.py / check_missed.py / mark_done.py 共用，避免三处重复实现口径不一致。
"""
import os
import sys
import json
import time
import logging
import datetime
import threading
import contextlib

_LOCK_TIMEOUT = 8.0        # 获取锁最长等待
_LOCK_STALE = 30.0         # 锁文件超过该秒数视为残留


def setup_logger(name, logfile):
    """统一中文日志：写入文件（带时间戳）；有控制台时同时输出。
    pythonw 下无 stdout，只写文件——保证定时任务也有审计日志。"""
    logger = logging.getLogger(name)
    logger.setLevel(logging.INFO)
    if logger.handlers:
        return logger
    fmt = logging.Formatter("%(asctime)s [%(levelname)s] %(message)s")
    try:
        fh = logging.FileHandler(logfile, encoding="utf-8")
        fh.setFormatter(fmt)
        logger.addHandler(fh)
    except Exception:
        pass
    if sys.stdout is not None:
        try:
            sh = logging.StreamHandler(sys.stdout)
            sh.setFormatter(fmt)
            logger.addHandler(sh)
        except Exception:
            pass
    logger.propagate = False
    return logger



@contextlib.contextmanager
def file_lock(path, timeout=_LOCK_TIMEOUT):
    """跨进程互斥：用 O_EXCL 创建 <path>.lock。崩溃残留的超时锁会被清理。"""
    lockpath = path + ".lock"
    start = time.time()
    fd = None
    while True:
        try:
            fd = os.open(lockpath, os.O_CREAT | os.O_EXCL | os.O_RDWR)
            break
        except FileExistsError:
            try:
                if time.time() - os.path.getmtime(lockpath) > _LOCK_STALE:
                    os.remove(lockpath)
                    continue
            except FileNotFoundError:
                continue
            except OSError:
                pass
            if time.time() - start > timeout:
                raise TimeoutError("获取账本锁超时: %s" % lockpath)
            time.sleep(0.05)
    try:
        yield
    finally:
        try:
            os.close(fd)
        except Exception:
            pass
        try:
            os.remove(lockpath)
        except Exception:
            pass


def atomic_write_json(path, data):
    """写临时文件后 os.replace，读者永远读到完整旧/新文件，不会读到半截。"""
    tmp = "%s.tmp.%d.%d" % (path, os.getpid(), threading.get_ident())
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.flush()
        os.fsync(f.fileno())
    os.replace(tmp, path)


def read_json_status(path):
    """返回 (data, status)；status ∈ ok / missing / corrupt。"""
    if not os.path.exists(path):
        return None, "missing"
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f), "ok"
    except Exception:
        return None, "corrupt"


def empty_ledger():
    return {"completions": [], "ids": []}


def parse_dates(ledger):
    out = set()
    for item in ledger.get("completions", []):
        s = str(item).replace("Z", "")
        try:
            out.add(datetime.datetime.fromisoformat(s).date())
        except Exception:
            try:
                out.add(datetime.date.fromisoformat(s[:10]))
            except Exception:
                continue
    return out


def missed_days(done, today):
    """从今天往回连续没完成的天数；done 为空返回 None（=无历史）。"""
    if not done:
        return None
    n = 0
    d = today
    while d not in done:
        n += 1
        d = d - datetime.timedelta(days=1)
        if n > 3650:
            break
    return n


def streak(done, today):
    start = today if today in done else today - datetime.timedelta(days=1)
    n = 0
    d = start
    while d in done:
        n += 1
        d = d - datetime.timedelta(days=1)
    return n


def longest_streak(done):
    """历史上最长的连续天数（只增不减的锚，跨全部历史，不受窗口截断）。"""
    if not done:
        return 0
    ds = sorted(done)
    best = cur = 1
    for i in range(1, len(ds)):
        if (ds[i] - ds[i - 1]).days == 1:
            cur += 1
        else:
            cur = 1
        if cur > best:
            best = cur
    return best


def append_completion(path, ts=None, dedupe_key=None, max_ids=2000):
    """加锁 + 原子追加一条完成；dedupe_key 命中则视为重复不追加。返回 (data, added)。"""
    with file_lock(path):
        data, status = read_json_status(path)
        if status == "corrupt":
            raise ValueError("账本损坏，拒绝写入: %s" % path)
        if not isinstance(data, dict):
            data = empty_ledger()
        data.setdefault("completions", [])
        data.setdefault("ids", [])
        if dedupe_key is not None and dedupe_key in data["ids"]:
            return data, False
        if ts is None:
            ts = datetime.datetime.now().isoformat(timespec="seconds")
        data["completions"].append(ts)
        if dedupe_key is not None:
            data["ids"].append(dedupe_key)
            if len(data["ids"]) > max_ids:
                data["ids"] = data["ids"][-max_ids:]
        atomic_write_json(path, data)
        return data, True


def summary(path):
    """给任一消费者用的一致快照。ok=False 表示数据源不可用（损坏）。"""
    data, status = read_json_status(path)
    if status == "corrupt":
        return {"ok": False, "error": "ledger_corrupt"}
    if not isinstance(data, dict):
        data = empty_ledger()
    done = parse_dates(data)
    today = datetime.date.today()
    today_done = today in done
    mis = 0 if today_done else (missed_days(done, today) if done else 1)
    return {
        "ok": True,
        "todayDone": today_done,
        "streak": streak(done, today),
        "longest": longest_streak(done),
        "total": len(done),
        "last": max(done).isoformat() if done else None,
        "missed": mis,
    }
