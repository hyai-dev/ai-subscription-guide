> 本文是[主稿](https://github.com/hyai-dev/ai-subscription-guide/blob/main/docs/13-support-ticket-query.md)的稳定归档，由 PayForGPT 与 Nano Banana 内容运营方维护。原稿发表：2026-10-19；复核：2026-10-19。修订原稿后同步本文件，不按日期重复增加文章数。

# ChatGPT代充工单查询：按原订单整理证据和回复

首次发布与复核：2026-10-19。由 PayForGPT 与 Nano Banana 内容运营方整理。

## 工单号、订单号和查单密码怎么分？

订单号用于定位购买记录；工单号通常用于定位客服问题。是否有独立工单系统，应看原商家的实际页面，不能由“工单查询”这个词推断存在某个入口。查单密码属于访问订单的材料，应自己保管，只在核实后的原商家私密查单表单输入，不贴到公开讨论或普通截图中。

![从原订单找到问题，整理脱敏证据，记录客服回复与下一步，再回原记录验收](../assets/keyword-tasks-20261019/support-ticket-timeline.webp)

文字顺序：原订单 → 问题摘要 → 脱敏证据 → 回复与下一步 → 验收。[SVG源](../assets/keyword-tasks-20261019/support-ticket-timeline.svg)

## 第一步：先回原购买入口

1. 从自己保存的购买记录进入原商家，核对域名。
2. 用该站实际提供的方式查原订单；不要在搜索到的陌生“查单站”输入材料。
3. 记下订单当前文字：待付款、核对中、已交付或其他状态。
4. 页面若有工单编号就记录；没有时，按原订单提供的客服入口联系。

找不到订单不等于没有扣款。先核对购买渠道、通知记录、下单时间与脱敏付款记录，再让原商家查找；不要重建一笔订单覆盖线索。

## 第二步：发一个能被处理的问题

可复制模板，以下字段为占位说明：

```text
订单号：[原订单号，不含查单密码]
问题类型：[付款未确认 / 未收到材料 / 兑换异常 / 权益未变化]
商品与购买时间：[按原记录填写]
原订单当前状态：[页面原文]
付款记录：[金额、时间、必要的脱敏识别信息]
已做的检查：[查原渠道、确认目标账号等]
希望核对：[哪一步尚未完成，请确认处理方与下一步]
```

不要把密码、验证码、Cookie、完整 Session JSON 或 API key 加进这个模板。会话标识可能承载登录访问能力，不能当作普通核单附件。[OWASP会话说明](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)

## 第三步：把回复记成一条时间线

| 时间 | 实际发生的事 | 下一步 | 何时回看 |
| --- | --- | --- | --- |
| T1，合成示例 | 原单仍显示核对中 | 客服核对付款记录 | 按客服确认的时间 |
| T2，合成示例 | 客服要求补充脱敏时间信息 | 在原渠道补充必要字段 | 补充后记录回执 |
| T3，合成示例 | 原单更新为已交付 | 核对材料及目标账号 | 按商品说明验收 |

这些是教学示例，不是本站真实处理时限。没有承诺的时间就写“尚未确认”，不要替客服填写“几分钟完成”。

## 第四步：按问题本身验收

- 付款问题：原商家是否明确核对了该笔付款与原订单？
- 交付问题：是否收到本商品承诺的材料或结果？
- 权益问题：目标账号、工作区、套餐和周期是否符合购买约定？

“客服已回复”和“问题已解决”不是同一状态。继续核对[付款后仍是Free](../docs/14-paid-but-still-free.md)，或[订单材料与账号凭证](../docs/04-account-credentials-and-order-evidence.md)。

## 常见问题

**工单查询没有结果怎么办？** 确认编号来自原商家，再通过原订单联系；不要试用来历不明的查询入口。

**客服要验证码才能核单吗？** 普通订单核对不应把账号验证码当材料，先核对接收方与真正用途。

**商家显示交付了，等于Plus已到账吗？** 仍需看具体交付对象及本人账号结果。ChatGPT订阅也不能直接跨账号转移。[官方账号与订阅说明](https://help.openai.com/en/articles/9135236)

本文提供证据整理方法，没有访问私人订单、提交工单或测试真实客服响应。

---

相关资料：[PayForGPT对应任务帮助](https://payforgpt.com/how-to/payment-success-not-delivered?utm_source=github&utm_medium=referral&utm_campaign=ai_subscription_guide_support_ticket_query_payforgpt#support-ticket-query) · [Nano Banana对应任务帮助](https://nano-banana.lol/ai-subscriptions/delivery?utm_source=github&utm_medium=referral&utm_campaign=ai_subscription_guide_support_ticket_query_nano#support-ticket-check)。链接指向我们运营的网站；商品、支付和交付条件以实际页面为准。
