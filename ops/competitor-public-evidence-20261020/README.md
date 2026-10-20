# 2026-10-20 公开竞品证据复核与双站下一步

复核对象为 PayForChat、GETGPT，以及原研究报告第十至十四章点名的工具、文章与站外页面。这里记录可复查的发现和建议，不把页面声明当成成交实测，不把研究建议标成已经上线。本文由 Nano Banana、PayForGPT 的维护方整理，具有相关商业关系。

## 本次改变了哪些判断

| 原判断 | 本次核查 | 对执行的影响 |
| --- | --- | --- |
| 292篇已索引文章，按118/86/88精确分类 | 当前sitemap有304个唯一URL，按路径分为218个主文章详情、56个Grok详情、30个其他页；历史分类没有逐URL标签表 | 从真实目录建立可复算地图，分别统计URL、文章、收录、点击 |
| 第十二章13个示例都是真实文章 | 6个有正文、H1和自canonical；7个返回“文章未找到”，含noindex，尽管HTTP为200 | 先核正文，避免拿不存在的标题和路径安排写作 |
| MarkCopy强制附加不可删除署名 | 当前默认示例稿有品牌段，整篇可编辑；静态复制和导出链未见二次强制追加 | 可以学实用工具及清楚的品牌入口；不能按强制署名预测外链规模 |
| GETGPT直接访问全部来自微信，清理参数就会变Direct | 直接访问估算可查到，组成与清理参数的因果没有证据 | 来源与成交分开验收，不能通过地址栏外观推断归因 |
| 几个万星仓库都给这两站导流 | 本次README核查发现多处实际目标是别的平台 | 每条外链保留来源页、实际href、rel与固定版本 |
| 发票和IP工具是我们尚未建设的独占优势 | 双站已有相关入口；PayForChat也已公开宣传Business与开票服务 | 优先补商品条件、材料、真实演示、报价及订单归因 |

sitemap只能帮助发现URL，不保证抓取或索引；见[Google官方说明](https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview)。本轮的304不是“304篇已收录文章”。

## 流量：可以确认的估算与仍然未知的部分

[Similarweb的GETGPT公开页](https://www.similarweb.com/website/getgpt.pro/)在本次网页读取中标注2026年9月，展示约198.1K访问、环比36.02%、3.07页/访问、平均2分32秒、跳出率32.56%。页面明确说明是估算数据，不能当作对方GA4或真实买家记录。

该页的56.81%直接访问标注为桌面端。关键词区的自然77.41%/付费22.59%属于搜索部分的另一组口径，不能与Direct拼成一张全站占比表。免费页未完整展示所有渠道，不补猜剩余占比。公开引荐名单出现789ai.vip、5xgpt.com、v2ex.com；名单不是每个来源的具体导流页面清单。

PayForChat的Similarweb页本轮读取失败；Jina虽返回传输层200，正文为源站403拦截页。因此原报告的精确访问量、76.4%自然占比本轮保持未复核，不能标为刚刚验证。

[Similarweb的渠道定义](https://support.similarweb.com/hc/en-us/articles/115004173925-Marketing-Channels)说明Direct还可能包含无referrer的应用链接。它当前也区分Gen AI、Affiliates及自然/付费社交；研究时应记录报表版本，沿用“固定六格”并不充分。[Google Analytics说明](https://support.google.com/analytics/answer/15258820?hl=en)同样列出了来源缺失的多种原因。

`history.replaceState`改变当前历史条目和URL；[MDN说明](https://developer.mozilla.org/en-US/docs/Web/API/History/replaceState)并没有定义它会清掉所有已采集来源。具体归因还取决于采集顺序、referrer和统计规则。把清理URL、20天缓存、终身返佣和56.81%Direct串成已经验证的因果链，证据不够。

原文DR11与DR40本轮未取得同月原始报表。[Ahrefs定义](https://ahrefs.com/seo/glossary/domain-rating)说明DR是其自有的对数指标，不能用40除11称为“权重约4倍”，也不能单凭DR解释某个词多一倍访问。原文的逐词月量、19.8%–38.5%成交率、封卡潮搜索增长40%及其增长因果，仍缺可复核导出或交易样本。

## 真实站外入口：有链接与带来订单是两件事

### GETGPT的社区入口

普通HTML确认了两个不同的V2EX主题：

| 公开来源 | 实际href | rel | 可学习的承接方式 |
| --- | --- | --- | --- |
| [充值攻略](https://www.v2ex.com/t/1184594) | http://getgpt.pro/i/v1 与 https://getgpt.pro/i/v1；另有/gptget | nofollow | 正文从准备、购买记录转向兑换与验收；可见文字“官网”并不展示完整邀请路径 |
| [银行卡被拒绝的提问](https://www.v2ex.com/t/1182439) | https://getgpt.pro/ip | nofollow、noopener | 回复具体问题时，先链接对应工具而非一律链接首页 |

这里证明帖子及href存在，不证明推荐者身份、帖子的付款人数或工具能判断模型质量。正文里的Session安全保证、地区和“家宽即可成功”等说法没有被本轮继承。不同V2EX镜像和AMP页面按同一主题去重。

789ai.vip当前公开首页是登录入口；5xgpt.com首页本次未见直接GETGPT锚链接，均未登录、提交表单或追踪隐藏渠道。它们仍是估算报表中的待查线索，不冒充已核实的具体外链。

### GETGPT的站外专题与GitHub入口

[csguide公开sitemap](https://csguide.cn/sitemap.xml)有221个唯一URL；`/private/`下71个，其中62个`.html`详情路径、9个目录路径。路径名private不表示需要鉴权。本轮读了8个主题目录、5篇文章全文，并另取6篇详情的元数据和锚链接；没有把62个详情全算成逐字审读、独立意图或已索引内容。

11个详情样本中9个正文含GETGPT链接；邀请锚出现27次，去重为7个href，例如`/i/csguide`、`/i/csguide-codex1`、`/i/gpt6`、`/i/ip`。本轮没有请求这些推广目标。原文精确写的`/i/csguide1`未在这些样本出现，不能据此断言全域不存在。

更具体的来源丢失线索是：这27个邀请锚都设置了`rel="noopener noreferrer"`。[HTML标准](https://html.spec.whatwg.org/multipage/links.html#link-type-noreferrer)规定noreferrer抑制HTTP来源信息。它不移除href中的邀请ID；来源页不传Referer与目标站仍识别邀请路径可以并存。这比“改地址栏所以全算Direct”更有证据，但仍无法推导Direct中的比例、后端佣金规则或实付。

| 本轮全文原文 | 值得学习的问题组织 | 我们需要补充或重新核验 |
| --- | --- | --- |
| [Plus准备到验收](https://csguide.cn/private/gptplus-recharge.html) | 准备、购买、保存交付记录、兑换、核对结果；图紧邻动作 | 保存订单和异常分支；不继承会话资料安全保证 |
| [购买与兑换分段](https://csguide.cn/private/chatgpt-plus-tutorial.html) | 将交易记录和后续激活分成两步 | 与上一文意图接近，在本站合并到原主页面 |
| [Codex安装任务](https://csguide.cn/private/codex-install-tutorial.html) | 安装准备、来源选择、验证、首个任务、故障查询 | 官方当前认证方式和资格重查；购买只是可能分支 |
| [明确拒付提示](https://csguide.cn/private/chatgpt-your-card-has-been-declined.html) | 具体错误进入，再逐因素说明与处理分支 | 新增价值应是资金状态、原收费方、停止重复付款的判定；不继承成功率数字 |
| [Astra购买与使用入口](https://csguide.cn/private/gpt6-astra-recharge-how-to-use.html) | 区分界面、Codex和API，购买后分别验证 | 9月旧消息与当前资格分开；复用双站已有入口稿 |

GETGPT首页和csguide样本确有同一CDN图片引用；how2cs有指向csguide的公开链接。它们支持“推荐与素材关联”，不足以认定同一经营者、身份、粉丝规模或PBN。

下表核了6个仓库的固定版本：6份主README、2份语言版、1份docs索引及10份相关文件。不是全Git历史审计。

| 仓库 | 本次可确证的链接归属 | 固定提交证据 |
|---|---|---|
| LearnPrompt/LearnPrompt | 充值旧教程链接WildCard；本次中英README/相关文件及可见代码检索未见PFC/GETGPT | [旧教程第43行](https://github.com/LearnPrompt/LearnPrompt/blob/33db714b1713e50e3a831b51d7f47fd4978a4a31/docs/basics/%F0%9F%9F%A2%20how_to_Register_and_Recharge_ChatGPT.md#L43) |
| Awesome-independent-tools | 中英清单链接WildCard，不能归为PFC/GETGPT外链 | [清单第248行](https://github.com/yaolifeng0629/Awesome-independent-tools/blob/137dbab17d7e360394acafad7e4a08a0a9a1629f/README.md#L248) |
| hq450/fancyss | 当前README广告指向nf.video（银河录像局），本次未见PFC/GETGPT | [广告第7行](https://github.com/hq450/fancyss/blob/b19e82cb6a05e08990a96905353921819d44d134/README.md#L7) |
| tokenhunter475指南 | README有32个PayForChat链接实例、27个不同URL；部分含GitHub来源UTM。3个抽样教程也有任务相关回链 | [README第3行](https://github.com/tokenhunter475/awesome-chatgpt-plus-guide/blob/62b55654b47e36453a4818ee1e8c18750a7113b5/README.md#L3) |
| youngyangyang04指南 | README的5个商业链接实例均指向payai.plus，同一目标URL | [README第40行](https://github.com/youngyangyang04/gpt-daichong/blob/15bcd8a171bb94ef318e3ece4c14826bf39c2658/README.md#L40) |
| jiangyy-1指南 | README商业链接26次指gptpro20x、9次指gptpro5x；合计32个不同URL | [文章入口第9行](https://github.com/jiangyy-1/gpt-chongzhi-guide/blob/0fd6589961ba7aad0dddaace6e74a4df5bfc68d4/README.md#L9)、[充值入口第63行](https://github.com/jiangyy-1/gpt-chongzhi-guide/blob/0fd6589961ba7aad0dddaace6e74a4df5bfc68d4/README.md#L63) |

三个指南仓实际GitHub页面中的相应商业链接分别32、5、35个，均含nofollow。链接实例、不同URL和不同推荐者不是同一计数；它们可以是读者入口，不能据此承诺排名或成交。

还有一个重要统计陷阱：[tokenhunter的62b55654提交](https://github.com/tokenhunter475/awesome-chatgpt-plus-guide/commit/62b55654b47e36453a4818ee1e8c18750a7113b5)文本增删为0，但实际新增18张二进制截图，不是空提交。其余5仓所查最新提交也有文件变化。本轮没有空提交提高排名的证据。


## MarkCopy：工具值得学，传播规模不能凭代码推算

[MarkCopy](https://md.payforchat.com/)公开提供Markdown排版；本次读取入口引用的静态bundle，沿着示例内容、全文编辑状态、预览、复制和导出数据流核对，未运行脚本或点击复制。默认样稿含PayForChat链接；编辑/导入会替换当前全文，复制和导出读取当前内容，未见强制重新插入品牌段。

本轮确认两个外部域名有真实指向工具的a标签：[Bajins的Markdown工具目录](https://www.bajins.com/Other/Markdown.html)和[格律诗的软件推荐](https://www.jamecling.com/archives/759)。前者的GitHub源是同一内容来源，不重复计独立推荐。另一个工具介绍页只有可见域名文字，不计作锚链接。没有找到能证明“用户保留自动署名并发布”的样本，更不能推断上万条反链。

工具确有面向公众号、知乎、Markdown和PDF的不同处理分支；目标平台可能过滤或改写链接，PDF文件不等于可抓取网页反链。静态代码还存在图片上传服务路径，因此不能把整个工具宣传成所有内容永远只在本机处理。

我们可以先做更贴近买家任务的小工具：核对账期、核对购买对象或整理售后材料。工具先完成用户任务，再提供明示且可选择的相关入口；获客效果要另外记录。

## 第十二章13条URL逐项复核

| 路径（均位于www.payforchat.com） | 观察结果 |
| --- | --- |
| `/articles/chatgpt-plus-recharge-failed-solutions-2026` | 正文存在、自canonical |
| `/articles/chatgpt-access-token-session-json-guide-2026` | 正文存在、自canonical |
| `/articles/chatgpt-degraded-fix` | 正文存在、自canonical |
| `/articles/chatgpt-plus-showing-free-fix` | 正文存在、自canonical |
| `/articles/chatgpt-3ds-verification-failed` | 软404：文章未找到、无H1/canonical、含noindex |
| `/articles/chatgpt-pro-5x-vs-20x-comparison` | 正文存在、自canonical |
| `/articles/chatgpt-pro-200-worth-it` | 软404：文章未找到、无H1/canonical、含noindex |
| `/articles/chatgpt-daichong-ban-risk` | 软404：文章未找到、无H1/canonical、含noindex |
| `/articles/claude-3-7-vs-chatgpt-plus` | 软404：文章未找到、无H1/canonical、含noindex |
| `/articles/cursor-pro-subscription-guide` | 软404：文章未找到、无H1/canonical、含noindex |
| `/articles/codex-quota-chatgpt-pro-upgrade` | 正文存在、自canonical |
| `/articles/supergrok-recharge-guide` | 软404：文章未找到、无H1/canonical、含noindex |
| `/articles/openai-invoice-tax-guide` | 软404：文章未找到、无H1/canonical、含noindex |

13条都完成了普通HTTP、标题、H1、canonical、robots和sitemap匹配；本轮未逐字审读全部有效文章。附录保留逐项时间和哈希。软404结论只描述当前响应，不证明这些路径历史上从未存在。邻近题材的新URL也不能自动冒充同一原文。

## 企业采购：差距在可核对流程

[PayForChat企业页](https://www.payforchat.com/business-recharge)目前公开写有商家“5席起”、报价、工作区、开票需求及原工单续办流程。5席是该商家的接单条件，不能改写成OpenAI的官方最低席位。页面的开票和履约是商家声明，本轮没有付款或验证发票。

采购入口还有版本差异：网页读取器展示[team-purchase](https://www.payforchat.com/team-purchase)的独立批量采购表单，本次普通HTTP请求该地址却最终跳到business-recharge。记录两种结果，不能把它们直接算作当前两个独立的采购落地页或已验证流程。

我们的[PayForGPT团队页](https://payforgpt.com/team)和[Nano Business页](https://nano-banana.lol/business)已有采购/开票人工入口；两站帮助页也已区分收据、官方账单和本站订单。可借鉴之处是让读者在报价前明确：个人账号批量还是Business工作区、席位及周期、管理员归属、交付窗口、票据要求、后续增减席位如何办理。每项以本单客服确认和实际可交付商品为准。

自动生成一张PDF不能代替真实开票流程，开票也不能再宣传成同行没有的独占能力。两站已经有IP标签查询，新增一个相似路径不等于新增获客能力；IP标签也不能用于断言“模型降智”或保证付款。

## 双站的下一步：建议顺序与验收标准

以下是研究后的提案，尚未在本轮实施。

| 顺序 | 载体与已有基础 | 下一步交付 | 验收依据 |
| --- | --- | --- | --- |
| 1 | 双站现有商品页与四条原待办 | 逐SKU确认名称、账期、账号条件、交付、完成标准和异常处理 | 真实在售配置及明确的运营确认，解决旧5x/20x简称与当前权益的歧义 |
| 2 | PayForGPT企业页、报价准备模板 | 分开个人账号批量与Business采购；把报价前/交付后需要的材料排清 | 一份用户可读的报价及验收样例；开票主体和条件逐单确认 |
| 3 | Nano帮助、订单找回和充值排错 | 用已存在文章制作有真实授权界面的操作演示；补每步预期结果与失败分支 | 图片已脱敏获授权，按真实产品步骤核对；原创示意图继续标明示意 |
| 4 | 公开指南、两站任务教程 | 按一个读者问题制作可独立阅读的社区版教程，相关段落指向准确任务页 | 来源原文真实存在，官方规则已复核，链接/运营关系清楚；发布及效果另记 |
| 5 | 双站已有来源字段采集与建单传递 | 验证服务端来源到有效订单、确认付款、实际交付的关联和去重 | 后台状态与允许的数据字段对账；客户端点击、UTM、IndexNow受理均不计实付 |
| 6 | 小工具试验 | 先选购买前条件核对、账期核对或售后材料整理中的一个任务，避免凭空诊断风控 | 用户能得到完整结果、字段最少；观察有效使用和后续任务，不预先承诺获客量 |

文章选题按真实任务组织：先说明适用对象与当前条件，再给步骤、预期结果、失败分支及完成检查。相关查询归入同一主页面；两站按各自商品与读者场景调整材料和下一步，不用换品牌名的方式扩充页面数。同行原文用于研究问题结构，最终规则、例子和图示应可独立核验。

四条既有运营待办仍未验收完成：SKU条件、真实授权演示、服务端付款/交付归因、实际效果数据。上轮关键词验收记录为65/2500；本轮研究不新增文章或勾选下一关键词，也没有新部署或提交IndexNow。

## 范围、证据和维护

原始HTML、JS、全文和飞书完整XML仅作私下核查，不复制到公开仓库。公开成果包含衍生结论、必要标题、URL、时间、状态、哈希和固定提交锚点，见[核查证据](evidence.json)和[完整URL发现清单](url-inventory.json)。没有登录、交易、客服联系、发帖、PR或真实模型调用，也未进行浏览器交互测试。

本轮采用agent-reach的公开网页/Jina Reader及GitHub CLI后端。Exa与agent-reach CLI在当前环境不可用，使用可达的公开搜索发现来源，再回原页面核对；没有为本任务安装工具。GitHub检索限流部分保留断点，“未见”只适用于列明的读取范围。
