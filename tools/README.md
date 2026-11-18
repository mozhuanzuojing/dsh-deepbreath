# dsh-deepbreath · 邮件问责（可选配套工具）

配合 `dsh-deepbreath` 插件使用：插件负责"做呼吸 + 记录完成"，这里这套小工具负责"记账落盘 + 漏做一整天就发邮件到你的邮箱"。**所有密钥都在你自己的机器上，各配各的，不共享。**

## 前置
- Windows + **Python 3**（`python`/`pythonw` 在 PATH 上）；
- 在 DSH 里装好 `dsh-deepbreath` 插件（本仓库根目录）。

## 一次性配置（用你自己的发件邮箱）
1. **准备发件邮箱的"授权码"**（不是登录密码）：
   - **163**：网页版 设置 → POP3/SMTP/IMAP → 开启 SMTP → 生成授权码；
   - **QQ**：设置 → 账户 → 开启 SMTP → 生成授权码；
   - **Gmail**：开启两步验证 → 生成"应用专用密码"。
2. **运行配置向导**（交互式）：
   ```
   python setup_mail.py
   ```
   依次填：发件邮箱、服务商(163/qq/gmail…)、授权码、收件地址、（可选）阈值。
   它会写 `config.json` + `.env`（`DSH_MAIL_PASSWORD=你的授权码`）。
3. **验证发信**：`python send_test.py`（真发一封到收件地址，确认能收到）。
4. **注册计划任务**（按你的系统选一个）：
   - **Windows**：`powershell -ExecutionPolicy Bypass -File .\enable_all.ps1`
   - **macOS**：`bash enable_all.sh`（用 launchd，记账 KeepAlive + 每日检查）
   - **Linux**：`bash enable_all.sh`（用 crontab：`@reboot` 启动记账 + 每日 `check_hour` 检查）
   - 卸载：Windows `schtasks /Delete /TN dsh-deepbreath-recorder /F` 等；macOS/Linux `bash disable_all.sh`
   - 均按 `check_hour`（默认 22:00）检查漏做。

> ⚠ 没有 dry-run：配好后**漏做就会真发**。所以务必先 `send_test.py` 确认收件地址/授权码正确，再启用计划任务。

## 文件
- `setup_mail.py` 配置向导；`config.example.json` / `.env.example` 示例
- `recorder.py` 本机记账服务（`127.0.0.1:8765`，原子写+锁+幂等）
- `check_missed.py` 每日检查；`ledger_store.py` 账本公共模块
- `send_test.py` 发一封测试邮件；`mark_done.py` 手动打卡（可选）
- `enable_all.ps1` 注册计划任务

## 安全与边界
- `.env` / `password.txt` **不要提交 git、不要外发**；`.gitignore` 已排除。
- 每个使用者用**自己的**发件邮箱与授权码；不要共用别人的。
- 可随时在发件邮箱侧**重置授权码**。
- 只把"完成一次呼吸"这一最小事件写本地 `ledger.json`，**不读取、不外发任何会话内容**。

## 常见服务商 SMTP
| 服务商 | smtp_host | 端口 | SSL |
|---|---|---|---|
| 163 | smtp.163.com | 465 | 是 |
| 126 | smtp.126.com | 465 | 是 |
| QQ | smtp.qq.com | 465 | 是 |
| Gmail | smtp.gmail.com | 587 | 否(STARTTLS) |
| Outlook | smtp.office365.com | 587 | 否(STARTTLS) |
