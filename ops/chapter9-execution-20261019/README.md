# 第九章落实：真实专题、双站图文与公开指南

本批发布与核验：2026-10-19。PayForGPT新增1篇、Nano Banana更新1篇现有文章、公开指南新增1篇主稿；同一问题的5个相关查询集中在每站一个主页面，未拆成5篇同义文。

| 入口 | 本次变化 |
| --- | --- |
| [PayForGPT教程](https://payforgpt.com/ai-subscriptions/getgpt-review) | 官网、卡密与原账号验收；7段、5FAQ、6个商家来源、1幅原创流程图 |
| [Nano Banana教程](https://nano-banana.lol/ai-subscriptions/getgpt-alternative) | 更新原URL，保留首发日期；7段、6FAQ、8来源、1幅原创流程图 |
| [公开指南主稿](../../docs/19-getgpt-card-code-checklist.md) | 商家入口、三份记录、对照表和脱敏材料模板，按主题回链双站 |

五个候选查询为GETGPT Pro、GETGPT、getgpt.pro官网、GETGPT靠谱吗、GETGPT卡密兑换。公开指南现有19篇主稿、75个分配候选查询、9个主题组；归档副本不另算原创文章。这些数字是编辑清单，未验证搜索量或排名。

## 这一轮如何应用竞品研究

4个指定公开仓库已按提交固定README、渲染HTML、目录与部分修改记录。[研究证据](public-research.json)保留来源、时间和哈希；[GETGPT商家原始来源回执](merchant-sources.json)记录本轮使用的页面。

- jiangyy：README有32个去重站外href，主要连接gptpro20x.com和gptpro5x.com；树中60个articles文件不自动代表60篇独立原创。
- li132：两条商业链接带明确GitHub/README来源参数。
- CZGPT：总览连接4个本地专题。
- he20000405：总览、15个本地指南链接、官方来源和风险说明。

据此完善已有指南的任务导航、专题层级、原始来源和上下文深层链接。维护者与两站的运营关系明确披露，UTM不含订单或账号资料；已有GETGPT订单继续回原商家处理。没有把出站链接推断为同一控制人、真实来源占比或成交效果。

## 对研究中排名与权重说法的核验更正

四份样本经GitHub REST渲染的README站外链接均观察到nofollow。不能据Markdown原文未写rel，认定已验证dofollow或主站继承100%权重；链接仍可能帮助读者找到相关资料。排名采用多种页面和网站信号，见[Google排名系统说明](https://developers.google.com/search/docs/appearance/ranking-systems-guide)。

本次官方资料不支持固定3–6个月等待期、48–72小时第一名或Git空提交提排名的承诺。[抓取与索引说明](https://developers.google.com/search/docs/crawling-indexing/ask-google-to-recrawl)区分抓取申请与实际索引；[sitemap说明](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap)要求lastmod反映可核验的重要修改。jiangyy抽查的一次Auto-update新增99行文章，不能仅凭提交标题叫它空提交。

新增内容按真实问题提供信息与下一步，保留首发日期，只记录实际复核。发布评价需事实和样本，优惠需真实条件，链接需与上下文相关；[Google垃圾内容政策](https://developers.google.com/search/docs/essentials/spam-policies)解释链接垃圾、低价值规模内容和过期域名滥用边界。

## 发布验收

两站相关门禁、生产构建和独立审稿通过，推送main后经各自正常生产工作流部署。普通公开网址回读核对了文章、canonical、日期、锚点、来源、图像字节、指南入口、sitemap与llms。详见[源码与检查回执](release.json)、[公开回读](live-readback.json)和[IndexNow回执](indexnow.json)。

IndexNow接受5个更新HTML URL的通知，不等于Bing或Google已收录。公开HTTP与静态解析不冒充浏览器排版或交易实测；本轮没有网站流量、排名、真实付款或交付归因数据。

飞书的5个关键词完成标记另行验收，本目录随后补充写入与保全回执。SKU履约、授权真实界面与评价、服务端来源到付款/交付归因、实际效果数据仍分别待验收。
