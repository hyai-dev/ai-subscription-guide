# 第十三批：参考同行原文后的双站图文教程

2026-10-20，本批按飞书原第02站第11–15条推进。先读26篇真实同行文章和1个销售页，再结合15个当前官方来源重组任务顺序；每站新增5篇，共10篇。文章分别撰写，不复制同行段落、截图或未验证的商家承诺。

| 任务 | PayForGPT | Nano Banana |
| --- | --- | --- |
| GPT-6 Astra怎么用、买什么 | [图文教程](https://payforgpt.com/ai-subscriptions/gpt6-astra-access-billing) | [图文教程](https://nano-banana.lol/ai-subscriptions/gpt6-astra-access-billing) |
| Pro升降档与账期 | [图文教程](https://payforgpt.com/ai-subscriptions/chatgpt-pro-change-billing-cycle) | [图文教程](https://nano-banana.lol/ai-subscriptions/chatgpt-pro-change-billing-cycle) |
| Codex credits自动补充 | [图文教程](https://payforgpt.com/ai-subscriptions/codex-credit-auto-top-up) | [图文教程](https://nano-banana.lol/ai-subscriptions/codex-credit-auto-top-up) |
| Astra API费用估算 | [图文教程](https://payforgpt.com/ai-subscriptions/gpt6-astra-api-cost-estimate) | [图文教程](https://nano-banana.lol/ai-subscriptions/gpt6-astra-api-cost-estimate) |
| API模型、账单和速率错误 | [图文教程](https://payforgpt.com/ai-subscriptions/openai-api-model-access-billing-errors) | [图文教程](https://nano-banana.lol/ai-subscriptions/openai-api-model-access-billing-errors) |

两个站均由我们运营。上表是按问题分流的教学入口，不代表两个网站是彼此独立的第三方推荐。

## 实际参考了什么

PayForChat的9篇样本提供“先回答付费对象、再拆套餐/用量、最后给对应窄问题入口”的组织方法；GETGPT的10篇及1个销售页提供当前条件、办理步骤、购买后验收和材料模板。另读用户指定教程站7篇，重点学习CodexGuide登录课的动作、应看到结果、异常分流和完成清单。

本轮增加原文没有讲透的字段表、可填写记录、5个原创图解概念及可复算例子。自动补充minimum/target/月cap和Pro完整变更结算，在样本中未找到足够深的逐步原文，相关规则来自当前官方资料；没有冒称学到了竞品已实测的流程。

来源样本、读取时间/哈希、适配任务和官方更正见[研究记录](research.json)。历史灰度、固定倍率、赠送活动、商家商品名称、到账或退款承诺没有移植为本站事实。

## 新页与旧主词页的关系

Codex充值、GPT代充与ChatGPT Pro充值继续由两站原有主页面承接，补当前专题链接；GPT-6 Astra与GPT6充值合并到一篇模型入口主文。5个新页面解决不同任务，旧主页面更新不计新增文章。

两站共15个原生比较/字段表、10幅站点配图和FAQ/记录模板。API成本用相同2K总输出的合成对照：270K输入2.80美元，300K输入6.15美元；按Standard无缓存假设，未含工具/税等费用，不是真实调用或商家报价。

## 发布与验证

源码：[Nano 9d2f88b](https://github.com/hyai-dev/nano-banana-web/commit/9d2f88beadbd08901f4e8405766aefdb689ba320) · [PayForGPT 69e77e5](https://github.com/hyai-dev/payforgpt-web/commit/69e77e56bd85ae41837cbea3480b2dd22ddbd490)。

双站生产构建、必需检查与独立审稿通过，线上42个去重普通URL最后608项检查通过，涵盖10篇文章、20个SVG/WebP资产、双站目录/ItemList/sitemap/llms及6个旧入口。PayForGPT额外旧回归脚本受已有Node TSX导入问题阻断，已单独保留；不写成所有测试通过。

Nano原工作流只使用构建阶段成功证据，整体已取消；[既有备用流程](https://github.com/hyai-dev/nano-banana-web/actions/runs/39371941878)部署相同SHA后成功。PayForGPT的[构建与部署](https://github.com/hyai-dev/payforgpt-web/actions/runs/39371458629)成功。普通HTTP读回与工作流证据分开记录。

[源码与检查回执](release.json) · [线上回读](live-readback.json) · [图解及哈希](figures.json)。18个更新HTML URL的[IndexNow通知](indexnow.json)受理，不等于Bing/Google已收录。

飞书以原行完成标记及后附回执为准。公共指南仍19篇主稿，本目录是执行与发布记录，不另计教程数。未进行真实订单、账号升级、自动扣款或API请求，也不声称本轮带来排名、流量或转化增长。
