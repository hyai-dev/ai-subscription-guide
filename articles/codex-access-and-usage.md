> 本文是[主稿](https://github.com/hyai-dev/ai-subscription-guide/blob/main/docs/02-codex-topup-guide.md)的稳定归档，由 PayForGPT 与 Nano Banana 内容运营方维护。原稿发表：2026-10-14；复核：2026-10-21。修订原稿后同步本文件，不按日期重复增加文章数。

# Codex 购买前先核对：登录方式、当前可用功能与实际用量

首次发布：2026-10-14；复核：2026-10-21。由 PayForGPT 与 Nano Banana 内容运营方按 OpenAI Docs 公开资料整理，没有执行真实登录、充值或模型测试。

## 30 秒先看结果

先用当前可用账号确认功能和用量，再决定是否购买。**Codex 的 ChatGPT 登录与 API key 登录有不同的访问、计费与管理路径，“Codex充值”不能一概理解为买 Plus 或 Pro。**

官方说明本地 Codex 可使用 ChatGPT 或 API key 登录，云端 Codex 要求 ChatGPT 登录；具体客户端、工作区及功能权限分别核对。[官方登录说明](https://learn.chatgpt.com/docs/auth)

![先核对本人账号、原购买渠道与用量，再判断是否需要改变订阅；旧账单和新购买分别确认](../assets/illustrated-20261018/renewal-v1.webp)

教学示意：付款、订阅权益和可用额度不是同一个状态。

## 第一步：认清当前登录与购买对象

| 当前情况 | 先确认什么 | 不能混淆的事项 |
| --- | --- | --- |
| ChatGPT 登录 | 本人账号、工作区、可见功能与用量 | 商家交付不等于目标账号已有权益 |
| API key 本地使用 | API 组织、计费、额度和管理员要求 | API 用量与 ChatGPT 订阅不是同一账单 |
| 企业或学校工作区 | 成员身份、角色、席位与开放功能 | 个人套餐不会自动改变组织授权 |
| 看不到某功能 | 客户端、开放范围、权限与官方说明 | 不直接推断必须买更贵套餐 |

当前价格与功能以[官方说明](https://learn.chatgpt.com/docs/pricing)和本人界面为准。这里不固化价格、固定任务次数或“多数人够用”的结论。

### 搜“Codex订阅”或“Codex Pro充值”，先对上这三本账

![先判断登录方式：ChatGPT登录核对套餐及可用用量；额外credits核对自己的用量面板；API key登录核对API组织账单](../assets/codex-ledgers-20261021/three-ledgers.webp)

原创解释图，非官方截图；下面的表格提供相同信息。

| 你实际想解决什么 | 去哪里取数 | 下一步 |
| --- | --- | --- |
| 想订阅或调整个人套餐 | 本人ChatGPT套餐、原订阅渠道、下个账期 | 先比较需要的功能，再看是否需要调整套餐 |
| 已有套餐，但可用用量不足 | 本人用量面板显示的剩余量、重置时间及可购买credits入口 | 按当前账号可见选项判断等待、缩小任务或补充credits；不直接重复买月卡 |
| 用API key运行本地任务，提示余额或限额 | 对应API组织/项目的计费和限制页面 | 找API账单或组织管理员；续费ChatGPT套餐不能代替这一步 |

官方将ChatGPT登录的订阅访问、可用的额外credits与API key用量计费分别说明；具体可用选项取决于账号、客户端和工作区。套餐名称相同，也不能据此保证每位用户看到同样功能。[登录方式](https://learn.chatgpt.com/docs/auth)、[用量与credits](https://learn.chatgpt.com/docs/pricing)

“Codex Pro”不是本文替商家确认的官方独立商品名。看到5x、20x或“无限”等标签，先让卖方写清对应套餐、交付对象、有效期起算、适用条件和售后；不能拿一个倍率推导固定任务数。

## 第二步：记录真正的限制

选一个可核对的小任务，记录实际结果、用量提示和工具权限，区分代码环境、访问、额度和付款问题。

```text
登录路径：ChatGPT / API key / 组织提供的其他方式
客户端与工作区：
具体任务与当前可用功能：
实际报错或用量提示（不含凭证）：
已执行的检查与结果：
是否确有需要改变的权限、权益或额度：
```

### 两个已填写的判断例子

以下均为合成教学案例，不是真实订单或产品实测。

**例子A：套餐仍有效，编辑器却提示API余额不足。** 小林记录到自己使用API key登录，报错来自该API项目。此时先核对API组织和账单，不能因为已经买过Plus，就要求商家再发一张Plus月卡解决API余额。

**例子B：ChatGPT登录后，用量面板显示达到本周期限制。** 小周先保存界面上的限制名称和重置时间，检查当前账号有没有额外credits入口。若功能本身可用，只是本周期用量耗尽，就比较等待或补充用量的成本；不要把“再买月卡”当成默认答案。可用时，CLI会话中的`/status`也可用于查看剩余用量，具体以[官方用量说明](https://learn.chatgpt.com/docs/pricing)和本人界面为准。

这两个例子用同一条判断规则：**先找报错对应的账本，再决定处理付款、权限还是用量。**

可以先看[Codex 第一个小任务](../docs/07-codex-first-task.md)，用固定输入与预期练习验收，再决定是否购买。

## 第三步：确需购买时，比较完整条件

核对商品、账号归属、交付对象、周期、币种税费、资格、原续费状态和售后。付款方式以实际结算页为准，不泛称所有渠道均支持微信或 USDT，也不由商家收款方式推导官方服务资格。

已有订单先查原订单，不重复付款。订单材料、付款确认、商家交付和账号实际权益分别验收。查单密码保存在自己的可信位置，不贴到公开 Issue 或教程截图。客服核单先提供订单号和脱敏材料。

密码、验证码、Cookie、Session JSON、API key 不作为普通客服备注或核单材料。免密码不等于没有凭证访问风险，见[凭证与订单证据](../docs/04-account-credentials-and-order-evidence.md)。

## 第四步：按问题找下一步

- 访问问题：回本人账号与当前官方功能/权限说明核对。
- 已扣款或续费失败：看[付款渠道与账单](../docs/05-payment-channels-and-billing-records.md)、[续费状态](../docs/06-renewal-and-price-comparison.md)。
- 我们两站的任务入口：[PayForGPT Codex指南](https://payforgpt.com/codex?utm_source=github&utm_medium=referral&utm_campaign=ai_subscription_guide_codex_access_payforgpt)、[Nano Banana Codex指南](https://nano-banana.lol/codex?utm_source=github&utm_medium=referral&utm_campaign=ai_subscription_guide_codex_access_nano)。它们是我们运营的商家网站；是否购买、实际供给、支付和交付条件分别核对。

## 本次更正与来源

已删除旧版“Codex本质总是买ChatGPT订阅”、未经测量的套餐适用推断，以及“地区稳定账号就安静”的说法。保留路径避免旧引用失效，历史稿不作为当前建议。

2026-10-21重新读取[Authentication](https://learn.chatgpt.com/docs/auth)、[Pricing](https://learn.chatgpt.com/docs/pricing)，补充三账本分流、已填写案例与双站任务入口。原URL、首次发表日和旧图保留。本文不创建API key或调用API，不替代平台资格与账单规则。

---

相关资料：[PayForGPT Codex任务入口](https://payforgpt.com/codex?utm_source=github&utm_medium=referral&utm_campaign=ai_subscription_guide_codex_access_payforgpt) · [Nano Banana Codex任务入口](https://nano-banana.lol/codex?utm_source=github&utm_medium=referral&utm_campaign=ai_subscription_guide_codex_access_nano)。链接指向我们运营的网站；商品、支付和交付条件以实际页面为准。
