# 2026-10-29 跨设备订单找回稿件与验收范围

更新既有 `docs/13-support-ticket-query.md`，保留主URL和2026-10-19首次发表日。补充资料分流表、两站原邮箱验证找回步骤、合成情境、脱敏客服模板与完成检查；主稿总数仍19，稳定归档不另计新稿。

- 本地验证：27项测试通过；同步预览/生成与check通过，61份Markdown、395个本地链接检查通过；再次同步无漂移。
- 匿名GET核验：两站order与guide均HTTP200，order含当前邮箱找回文案；两站恢复能力均enabled=true。详见 [只读回执](landing-readback.json)。没有发送验证码或查看用户订单。
- 官方来源与结论范围见 [来源记录](sources.json)，可发布渠道及历史未发布状态见 [渠道记录](channels.json)。
## 本轮发布结果

- **公开指南已发布。** [PR #3](https://github.com/hyai-dev/ai-subscription-guide/pull/3)已合并，源码提交为 `1ec7f7986b4d1a0b3bc1dfa57cf1e133220093d4`；[固定版本主稿](https://github.com/hyai-dev/ai-subscription-guide/blob/1ec7f7986b4d1a0b3bc1dfa57cf1e133220093d4/docs/13-support-ticket-query.md)可追溯，验证工作流通过。主稿仍19篇，稳定归档没有另计新文章。
- **公开空白清单已发布。** [跨设备找单与售后交接模板 Gist](https://gist.github.com/siuserxiaowei/8bfd05a22934eca0eff43ebce7d32dae)为另一个可复制资产，帮助用户准备脱敏材料；它没有复制整篇长文。
- 主Agent已完成两处资产的匿名HTML读取及raw文本字节比对，均HTTP200、与审稿文本相同且包含两站相关入口。完整提交、链接、哈希与范围见 [发布回执](publication-receipt.json)。
- 两处资产都在GitHub，不能说成两个平台。企鹅号、微信公众号本轮仍未发布。

## 发布前快照如何阅读

最初审稿时的“未提交、未推送”状态保存在 [渠道记录](channels.json)的 `beforePublicationSnapshot`，仅用于追溯当时的观察；当前结果看 `finalChannels` 和发布回执。旧平台注册失败或无法连接的记录，不代表当前登录状态已核实，也不代表曾经发表成功。

运营关系在正文与README继续披露。公开发布不代表被搜索引擎收录、产生排名、访客或成交。
