# Claude Code 分阶编程提示词 - SchoolBuzzMate-Uniapp

> **使用说明：**  
> 本文档包含完整的、可直接用于 Claude Code 的分阶提示词。  
> 按照阶段顺序执行，每个阶段完成后验证功能再进入下一阶段。

---

## 📋 目录

- [阶段一：项目初始化](#阶段一项目初始化)
- [阶段二：用户系统](#阶段二用户系统)
- [阶段三：商品功能](#阶段三商品功能)
- [阶段四：交易系统](#阶段四交易系统)
- [阶段五：社交功能](#阶段五社交功能)
- [阶段六：营销功能](#阶段六营销功能)
- [阶段七：管理后台](#阶段七管理后台)
- [阶段八：性能优化](#阶段八性能优化)
- [阶段九：测试上线](#阶段九测试上线)

---

## 阶段一：项目初始化

### Prompt 1.1：创建项目基础结构

```markdown
# 任务：创建 SchoolBuzzMate-Uniapp 项目基础结构

## 背景
我要基于芋道商城 (yudao-mall-uniapp) 创建一个校园社交交易项目 SchoolBuzzMate。
技术栈：UniApp + Vue3 + TypeScript + Vite5 + Pinia + wot-design-uni

## 要求
1. 参考芋道商城的目录结构
2. 使用 Vue3 + TypeScript + Vite
3. 集成 wot-design-uni 组件库
4. 配置 Pinia 状态管理
5. 配置 Vue Router（使用约定式路由）
6. 配置 UnoCSS 原子化CSS
7. 创建基础页面结构：首页、商品、订单、个人中心
8. 配置 tabBar

## 输出
1. 完整的项目目录结构
2. package.json 配置
3. vite.config.ts 配置
4. tsconfig.json 配置
5. 主要页面框架
6. 全局样式配置

## 请开始执行
请生成完整的项目代码和配置文件。
```

---

### Prompt 1.2：初始化 UniCloud 环境

```markdown
# 任务：初始化 UniCloud 云开发环境

## 背景
项目 MVP 阶段使用 UniCloud 阿里云作为后端。

## 要求
1. 创建 UniCloud 云服务空间配置
2. 创建以下云函数目录结构：
   - user-co/ (用户相关)
   - product-co/ (商品相关)
   - order-co/ (订单相关)
   - payment-co/ (支付相关)
   - social-co/ (社交相关)

3. 配置 uni-id（统一身份认证）
4. 配置 uni-pay（统一支付）
5. 创建云函数公共模块
6. 创建数据库集合定义文件

## 数据库集合清单
创建以下集合的 schema 文件：
- schools (学校信息)
- school_users (用户扩展信息)
- products (商品)
- product_categories (商品分类)
- orders (订单)
- payments (支付记录)
- comments (评论)
- favorites (收藏)
- messages (私信)
- coupons (优惠券)
- user_coupons (用户优惠券)
- points_log (积分记录)

## 请开始执行
生成 UniCloud 配置、云函数模板和数据库 schema。
```

---

### Prompt 1.3：配置开发工具和代码规范

```markdown
# 任务：配置开发工具链和代码规范

## 要求
1. 配置 ESLint + Prettier
2. 配置 Husky + lint-staged（代码提交前检查）
3. 配置 commitlint（commit message 规范）
4. 配置 .editorconfig
5. 配置 VSCode 推荐设置（settings.json、extensions.json）
6. 创建代码片段（snippets）
7. 配置路径别名

## 代码规范
- 使用 2 空格缩进
- 单引号字符串
- 不使用分号
- 组件名使用 PascalCase
- 文件名使用 kebab-case

## 请开始执行
生成所有配置文件。
```

---

## 阶段二：用户系统

### Prompt 2.1：实现 uni-id 微信登录

```markdown
# 任务：实现微信小程序登录功能

## 背景
使用 uni-id 实现统一身份认证。

## 功能需求
1. 微信小程序一键登录
2. 手机号+验证码登录（备用）
3. 登录状态保持
4. 未登录拦截
5. 用户信息授权

## 实现要求

### 前端部分
1. 创建登录页面 /pages/user/login
   - 微信登录按钮
   - 手机号登录表单
   - 用户协议勾选

2. 创建用户信息页面 /pages/user/profile
   - 头像、昵称
   - 学号、学院
   - 学生认证入口

3. 封装登录相关 API
   - loginByWeixin()
   - loginByMobile()
   - getUserInfo()
   - logout()

4. 实现登录拦截器
   - HTTP 请求拦截，添加 token
   - 页面路由拦截，检查登录状态

### 云函数部分
1. 配置 uni-id/config.json
2. 创建 user-co 云函数
3. 实现以下 action：
   - loginByWeixin (微信登录)
   - loginByMobile (手机登录)
   - getUserInfo (获取用户信息)
   - updateUserInfo (更新用户信息)

## 数据库操作
操作集合：
- uni-id-users (uni-id 内置)
- school_users (扩展信息)

## UI要求
- 简洁现代的设计风格
- 支持深色模式
- 加载状态提示
- 错误提示友好

## 请开始执行
生成完整的前端页面、云函数代码和配置文件。
```

---

### Prompt 2.2：实现学生认证功能

```markdown
# 任务：实现学生认证系统

## 功能需求
1. 学生证拍照上传
2. 填写真实姓名、学号、学院
3. 管理员审核（后期）
4. 认证状态展示

## 实现要求

### 前端部分
1. 创建学生认证页面 /pages/user/verify
   - 表单：真实姓名、学号、学院、年级、专业
   - 学生证照片上传（支持拍照）
   - 认证状态展示

2. 创建用户资料编辑页面 /pages/user/edit
   - 编辑个人资料
   - 选择学院、专业
   - 头像上传

### 云函数部分
在 user-co 中新增：
- submitVerification (提交认证)
- getVerificationStatus (查询认证状态)
- updateProfile (更新资料)

## 数据库操作
- 写入 school_users 集合
- 状态字段：is_verified (Boolean)

## 表单验证
- 姓名：2-20个字符
- 学号：必填，唯一
- 学生证：必填，至少1张

## 请开始执行
```

---

### Prompt 2.3：实现个人中心页面

```markdown
# 任务：实现个人中心页面

## 页面结构

### 1. 基本信息区域
- 头像（可点击修改）
- 昵称
- 学校、学院
- 学生认证标识

### 2. 数据统计
- 发布的商品数
- 售出的商品数
- 收藏数
- 信用分

### 3. 功能菜单（列表形式）
- 我的商品
  - 我发布的
  - 我售出的
  - 我买到的
- 我的收藏
- 我的优惠券
- 我的积分
- 学生认证
- 账号设置
  - 修改昵称
  - 更换手机号
  - 退出登录

## 要求
- 使用 wot-design-uni 组件
- 统计数据使用卡片样式
- 菜单列表使用 wd-cell-group
- 支持上拉刷新

## 请开始执行
生成页面代码。
```

---

## 阶段三：商品功能

### Prompt 3.1：实现商品发布功能

```markdown
# 任务：实现商品发布功能

## 功能需求
1. 拍照/从相册选择商品图片（最多9张）
2. 填写商品信息
   - 标题（必填，最多50字）
   - 描述（选填，最多500字）
   - 原价（必填）
   - 售价（必填）
   - 分类（必填，下拉选择）
   - 新旧程度（必填：全新、九成新、七成新、其他）
   - 标签（选填，最多5个）
3. 图片压缩上传（单张不超过200KB）
4. 发布成功提示

## 实现要求

### 前端页面 /pages/product/publish

使用 wot-design-uni 组件：
- wd-form 表单
- wd-input 输入框
- wd-textarea 文本域
- wd-select 下拉选择
- wd-upload 图片上传
- wd-button 提交按钮

表单验证：
- 标题：必填，2-50字
- 价格：必填，大于0
- 分类：必填
- 图片：必填，1-9张

### 云函数 product-co

新增 action：
- createProduct (发布商品)
- uploadImage (上传图片)

数据库操作：
- 插入 products 集合
- 自动设置：seller_id, create_date, status=1

## UI/UX要求
- 页面顶部固定标题
- 表单分组清晰
- 实时验证提示
- 提交时显示 loading
- 成功后跳转商品列表

## 请开始执行
生成完整代码。
```

---

### Prompt 3.2：实现商品列表和搜索

```markdown
# 任务：实现商品列表页面

## 功能需求
1. 商品列表展示（瀑布流/列表两种模式）
2. 下拉刷新、上拉加载更多
3. 搜索功能（关键词搜索）
4. 筛选功能
   - 分类筛选
   - 价格区间
   - 新旧程度
   - 最新发布/价格最低/浏览量最高
5. 商品卡片展示
   - 商品图片（首图）
   - 标题
   - 价格（突出显示）
   - 原价（划线）
   - 浏览量、点赞数
   - 卖家信息（可选）

## 实现要求

### 前端页面 /pages/product/list

组件：
- 搜索栏（顶部固定）
- 筛选栏（可横向滚动）
- 商品列表（使用 wd-grid 或自定义）
- 商品卡片组件 /components/ProductCard.vue
- 加载更多组件
- 空状态组件

分页加载：
- 每页 10 条
- 上拉加载更多
- 加载完提示

### 前端页面 /pages/product/search

- 搜索历史（本地存储）
- 热门搜索关键词
- 搜索建议

### 云函数 product-co

新增 action：
- getProductList (商品列表)
- searchProducts (搜索商品)
- getCategories (获取分类列表)

数据库查询：
- 条件查询：status=1（上架中）
- 关键词模糊匹配：title
- 多条件筛选
- 排序：create_date、price、view_count
- 分页：skip + limit

## 性能优化
- 图片懒加载
- 分页加载
- 搜索关键词防抖（300ms）
- 列表虚拟滚动（如需要）

## 请开始执行
```

---

### Prompt 3.3：实现商品详情页

```markdown
# 任务：实现商品详情页面

## 页面结构

### 1. 商品图片轮播
- 支持左右滑动
- 显示图片序号
- 支持预览大图
- 支持保存图片到相册

### 2. 基本信息
- 价格（大字突出）
- 标题
- 标签（分类、新旧程度等）
- 发布时间、浏览量

### 3. 卖家信息
- 头像
- 昵称
- 学院
- 信用分
- 关注按钮

### 4. 商品描述
- 详细描述
- 实拍图片

### 5. 底部操作栏
- 收藏按钮
- 点赞按钮
- 立即购买按钮
- 联系卖家按钮

## 功能需求
1. 点赞功能（实时计数）
2. 收藏功能
3. 分享功能（分享给好友、朋友圈）
4. 浏览量统计
5. 举报功能

## 云函数

product-co 新增：
- getProductDetail (获取详情)
- likeProduct (点赞)
- incrementView (增加浏览量)

## 特殊处理
- 如果是自己的商品，不显示购买按钮
- 如果商品已售出，显示"已售出"标识
- 如果商品已下架，提示用户

## 请开始执行
```

---

## 阶段四：交易系统

### Prompt 4.1：实现订单创建

```markdown
# 任务：实现订单创建功能

## 业务流程
1. 用户点击"立即购买"
2. 选择商品规格（如需要）
3. 填写收货信息（校内自提点选择）
4. 选择支付方式（微信支付）
5. 使用优惠券（如需要）
6. 提交订单
7. 调用支付

## 前端页面

### /pages/order/confirm (订单确认页)

表单字段：
- 商品列表展示（图片、标题、价格）
- 自提点选择（下拉选择）
- 联系人姓名
- 联系电话
- 备注信息
- 优惠券选择（可选）
- 订单金额计算
  - 商品金额
  - 优惠金额
  - 实际支付金额

底部：
- 提交订单按钮
- 显示应付金额

### /pages/order/create-result (订单创建结果页)

- 订单创建成功提示
- 订单信息展示
- 去支付按钮
- 查看订单按钮

## 云函数 order-co

新增 action：
- createOrder (创建订单)
- getOrderDetail (订单详情)

业务逻辑：
1. 验证商品是否存在、是否上架
2. 验证商品价格
3. 生成订单号（时间戳 + 随机数）
4. 检查优惠券是否有效
5. 计算最终金额
6. 插入 orders 集合
7. 更新商品状态为"待发货"（status=2）
8. 如果使用了优惠券，更新 user_coupons 状态

## 数据库操作

orders 集合：
```javascript
{
  order_no: "ORD20250101123456789",
  buyer_id: ObjectId,
  seller_id: ObjectId,
  product_id: ObjectId,
  amount: 100,
  discount_amount: 10,
  pay_amount: 90,
  status: 0, // 待支付
  address_info: {...},
  remark: "",
  create_date: Date,
}
```

## 请开始执行
```

---

### Prompt 4.2：集成 uni-pay 支付

```markdown
# 任务：集成 uni-pay 实现微信支付

## 功能需求
1. 微信支付下单
2. 支付回调处理
3. 订单状态更新
4. 支付结果展示

## 前端实现

### 支付流程
1. 用户点击"去支付"
2. 调用云函数创建支付订单
3. 调用 uni.requestPayment 发起支付
4. 支付成功/失败处理

### 页面修改

/pages/order/pay (支付页面)
- 显示支付金额
- 显示支付方式（微信支付）
- 支付按钮
- 支付倒计时（15分钟）
- 取消支付按钮

### API调用

```typescript
// 创建支付
const paymentRes = await uniCloud.callFunction({
  name: 'payment-co',
  data: {
    action: 'createPayment',
    params: {
      orderId: orderId,
      amount: amount,
      description: '订单支付'
    }
  }
})

// 发起支付
uni.requestPayment({
  provider: 'wxpay',
  timeStamp: paymentRes.timeStamp,
  nonceStr: paymentRes.nonceStr,
  package: paymentRes.package,
  signType: paymentRes.signType,
  paySign: paymentRes.paySign,
  success: () => {
    // 支付成功，跳转结果页
  },
  fail: () => {
    // 支付失败
  }
})
```

## 云函数 payment-co

新增 action：
- createPayment (创建支付订单)
- paymentCallback (支付回调)
- queryPayment (查询支付状态)

业务逻辑：
1. 调用 uni-pay 创建支付订单
2. 返回支付参数给前端
3. 处理支付成功回调
   - 更新 orders 状态为"待发货"（status=1）
   - 插入 payments 记录
   - 发送通知给卖家
   - 增加卖家积分

## 配置文件

uniCloud-aliyun/cloudfunctions/common/uni-config-center/uni-pay/config.json

配置微信支付参数：
- appid (小程序AppID)
- mchid (商户号)
- partnerKey (API密钥)

## 请开始执行
```

---

### Prompt 4.3：实现订单管理

```markdown
# 任务：实现订单管理功能

## 页面需求

### 1. 订单列表页 /pages/order/list

顶部 Tab 切换：
- 全部
- 待支付
- 待发货
- 待收货
- 已完成
- 已取消

订单卡片展示：
- 订单号
- 商品信息（图片、标题）
- 订单状态
- 金额信息
- 操作按钮
  - 待支付：去支付、取消订单
  - 待发货：联系卖家
  - 待收货：确认收货
  - 已完成：再次购买、评价
  - 已取消：删除

### 2. 订单详情页 /pages/order/detail

展示内容：
- 订单状态（进度条形式）
  - 创建订单 → 支付成功 → 发货 → 收货 → 完成
- 商品信息
- 收货信息
- 支付信息
- 订单信息（订单号、创建时间等）
- 操作按钮（根据状态显示）

## 云函数 order-co

新增 action：
- getOrderList (订单列表)
- cancelOrder (取消订单)
- confirmReceive (确认收货)
- deleteOrder (删除订单)

业务逻辑：
1. 订单列表：按状态筛选、分页
2. 取消订单：
   - 只能取消"待支付"状态的订单
   - 更新订单状态为"已取消"（status=4）
   - 如果使用了优惠券，退还优惠券
3. 确认收货：
   - 更新订单状态为"已完成"（status=3）
   - 更新商品状态为"已售出"（status=2）
   - 增加卖家信用分
   - 发送通知给买家

## 请开始执行
```

---

### Prompt 4.4：实现消息通知

```markdown
# 任务：实现消息通知系统

## 功能需求
1. 交易通知
   - 订单创建通知（卖家）
   - 支付成功通知（卖家）
   - 发货通知（买家）
   - 收货通知（卖家）
   - 订单完成通知（双方）
2. 系统通知
   - 审核通过通知
   - 违规通知
   - 活动通知

## 实现方案

### 前端

#### 1. 消息中心页面 /pages/message/index

Tab 分类：
- 交易消息
- 系统消息

消息列表：
- 消息图标/头像
- 标题
- 内容摘要
- 时间
- 未读标识

#### 2. 消息详情页面

- 完整消息内容
- 跳转相关链接（订单详情、商品详情）
- 标记已读

#### 3. 消息提醒

- 收到新消息时，tabBar 显示未读数
- 推送通知（微信小程序订阅消息）

### 云函数 social-co

新增 action：
- getMessages (获取消息列表)
- markAsRead (标记已读)
- sendMessage (发送消息)

### 数据库

messages 集合：
```javascript
{
  from_user_id: ObjectId,  // 发送者（系统消息为空）
  to_user_id: ObjectId,    // 接收者
  type: 1,                 // 1交易 2系统
  title: String,
  content: String,
  link_type: String,       // 跳转类型：order/product
  link_id: String,         // 跳转目标ID
  is_read: Boolean,
  create_date: Date,
}
```

## 请开始执行
```

---

## 阶段五：社交功能

### Prompt 5.1：实现评论功能

```markdown
# 任务：实现商品评论功能

## 功能需求
1. 在商品详情页展示评论列表
2. 用户可发表评论
3. 支持文字+图片
4. 支持回复评论
5. 评论点赞

## 前端实现

### 商品详情页新增区域

评论列表：
- 评论总数
- 评论排序（最新/最热）
- 评论项
  - 用户头像、昵称
  - 评论内容
  - 评论图片（最多3张）
  - 评论时间
  - 点赞按钮
  - 回复按钮
- 评论输入框（底部固定）

### 发表评论

底部输入框：
- 文本输入（最多200字）
- 添加图片按钮
- 发送按钮

### 云函数 social-co

新增 action：
- createComment (发表评论)
- getCommentList (获取评论列表)
- likeComment (点赞评论)
- replyComment (回复评论)

数据库操作：
comments 集合：
```javascript
{
  product_id: ObjectId,
  user_id: ObjectId,
  content: String,
  images: Array,
  parent_id: ObjectId,  // 父评论（回复时用）
  like_count: Number,
  create_date: Date,
}
```

## 请开始执行
```

---

### Prompt 5.2：实现收藏功能

```markdown
# 任务：实现商品收藏功能

## 功能需求
1. 收藏/取消收藏
2. 收藏列表
3. 收藏数统计

## 前端实现

### 商品详情页
- 收藏按钮（心形图标）
- 收藏状态（已收藏/未收藏）
- 收藏数展示

### 收藏列表页 /pages/favorite/list
- 商品卡片形式展示
- 左滑删除
- 批量管理
- 空状态提示

### 云函数 social-co

新增 action：
- toggleFavorite (切换收藏状态)
- getFavoriteList (获取收藏列表)
- isFavorited (检查是否已收藏)

数据库操作：
favorites 集合：
```javascript
{
  user_id: ObjectId,
  product_id: ObjectId,
  create_date: Date,
}
```

索引：
- user_id + product_id 联合唯一索引

## 请开始执行
```

---

### Prompt 5.3：实现私信聊天

```markdown
# 任务：实现用户私信功能

## 功能需求
1. 用户可给卖家发送私信
2. 私信列表（会话列表）
3. 私信详情（聊天界面）
4. 未读消息计数

## 前端实现

### 1. 私信列表页 /pages/message/chat-list

- 会话列表
  - 对方头像
  - 对方昵称
  - 最后一条消息
  - 最后消息时间
  - 未读数
- 下拉刷新
- 置顶会话（管理员）

### 2. 聊天页面 /pages/message/chat

- 聊天消息列表（上拉加载更多）
- 消息类型
  - 文本消息
  - 图片消息
  - 系统消息（如：交易提醒）
- 底部输入区
  - 文本输入
  - 图片发送
  - 发送按钮
- 实时滚动到底部

### 3. 商品详情页
- 添加"联系卖家"按钮
- 点击跳转聊天页面
- 自动发送商品卡片消息

### 云函数 social-co

新增 action：
- sendMessage (发送消息)
- getChatList (获取会话列表)
- getMessages (获取聊天记录)
- markMessagesRead (标记消息已读)

数据库操作：
messages 集合扩展：
```javascript
{
  from_user_id: ObjectId,
  to_user_id: ObjectId,
  content: String,
  type: 1,  // 1文本 2图片 3系统 4商品卡片
  images: Array,
  is_read: Boolean,
  create_date: Date,
}
```

## 特殊处理
- 发送图片需要压缩
- 消息实时推送（使用 WebSocket 或轮询）
- 离线消息处理

## 请开始执行
```

---

## 阶段六：营销功能

### Prompt 6.1：实现积分签到系统

```markdown
# 任务：实现积分签到系统

## 功能需求
1. 每日签到领积分
2. 积分规则配置
3. 积分记录查询
4. 积分展示

## 前端实现

### 1. 签到页面 /pages/marketing/sign-in

- 连续签到天数展示
- 今日签到按钮
- 签到记录列表
  - 签到日期
  - 获得积分
  - 连续天数
- 积分规则说明

### 2. 个人中心
- 显示当前积分
- 积分记录入口

### 云函数 marketing-co

新增 action：
- checkIn (签到)
- getSignInRecord (签到记录)
- getPointsLog (积分记录)

业务逻辑：
1. 检查今天是否已签到
2. 计算连续签到天数
3. 根据连续天数计算积分
   - 第1天：1积分
   - 第2天：2积分
   - 第3天：3积分
   - 第4-7天：5积分
   - 连续7天重置
4. 插入积分记录
5. 更新用户积分

数据库操作：
points_log 集合：
```javascript
{
  user_id: ObjectId,
  points: Number,  // 正数
  type: 2,         // 2签到
  description: "连续签到3天",
  create_date: Date,
}
```

## 请开始执行
```

---

### Prompt 6.2：实现优惠券系统

```markdown
# 任务：实现优惠券功能

## 功能需求
1. 优惠券领取
2. 优惠券列表
3. 我的优惠券
4. 下单时使用优惠券

## 前端实现

### 1. 优惠券领取页 /pages/marketing/coupons

- 优惠券卡片列表
  - 券名
  - 面额（满X减Y）
  - 使用条件
  - 有效期
  - 领取进度
  - 领取按钮（已领取/去领取/已领完）

### 2. 我的优惠券页 /pages/user/coupons

Tab 切换：
- 未使用
- 已使用
- 已过期

优惠券列表：
- 券名
- 面额
- 使用条件
- 有效期
- 使用状态
- 立即使用按钮（未使用）

### 3. 订单确认页修改

- 显示可用优惠券
- 选择优惠券
- 自动计算优惠金额

### 云函数 marketing-co

新增 action：
- getCouponList (优惠券列表)
- receiveCoupon (领取优惠券)
- getMyCoupons (我的优惠券)
- useCoupon (使用优惠券)
- checkCoupon (检查可用优惠券)

业务逻辑：
领取优惠券：
1. 检查优惠券是否有效（时间、数量）
2. 检查用户是否已领取
3. 插入 user_coupons
4. 更新 coupons.used_count

使用优惠券：
1. 检查优惠券是否可用
2. 检查订单金额是否满足条件
3. 计算优惠金额
4. 返回优惠信息

数据库操作：
coupons 集合：
```javascript
{
  name: String,
  type: 1,  // 1满减 2折扣
  discount_amount: Number,  // 减10元
  min_amount: Number,       // 满50可用
  total_count: Number,      // 总数量100
  used_count: Number,
  start_time: Date,
  end_time: Date,
  status: 1,  // 状态
}
```

user_coupons 集合：
```javascript
{
  user_id: ObjectId,
  coupon_id: ObjectId,
  status: 0,  // 0未使用 1已使用 2已过期
  use_time: Date,
  order_id: ObjectId,  // 使用的订单
}
```

## 请开始执行
```

---

### Prompt 6.3：实现拼团功能

```markdown
# 任务：实现拼团功能

## 功能需求
1. 发起拼团
2. 参与拼团
3. 拼团详情
4. 拼团列表
5. 拼团成功/失败处理

## 前端实现

### 1. 拼团活动页 /pages/marketing/group-buy

- 拼团商品列表
  - 商品图片、标题
  - 拼团价
  - 原价
  - 已拼团人数
  - 剩余名额
  - 进度条
  - 去拼团按钮

### 2. 拼团详情页 /pages/marketing/group-detail

- 商品信息
- 拼团信息
  - 团长信息
  - 参与人数/目标人数
  - 剩余时间
  - 进度条
- 参与用户列表
- 立即参与按钮

### 3. 发布商品扩展

- 是否开启拼团
- 拼团价格
- 拼团人数
- 拼团有效期

### 云函数 marketing-co

新增 action：
- createGroup (发起拼团)
- joinGroup (参与拼团)
- getGroupList (拼团列表)
- getGroupDetail (拼团详情)
- checkGroupSuccess (检查拼团是否成功)

业务逻辑：
发起拼团：
1. 检查商品是否支持拼团
2. 创建拼团记录
3. 设置团长为发起人

参与拼团：
1. 检查拼团是否已满
2. 检查拼团是否过期
3. 加入拼团
4. 检查是否达到目标人数
   - 是：拼团成功，更新状态
   - 否：继续等待

定时任务：
- 检查过期拼团，更新为失败状态
- 发送拼团成功/失败通知

数据库新增集合：
groups (拼团)
```javascript
{
  product_id: ObjectId,
  leader_id: ObjectId,  // 团长
  group_price: Number,
  target_count: Number,  // 目标人数
  current_count: Number,
  status: 0,  // 0进行中 1成功 2失败 3过期
  start_time: Date,
  end_time: Date,
}
```

group_users (拼团参与用户)
```javascript
{
  group_id: ObjectId,
  user_id: ObjectId,
  join_time: Date,
}
```

## 请开始执行
```

---

## 阶段七：管理后台

### Prompt 7.1：实现数据看板

```markdown
# 任务：实现管理后台数据看板

## 功能需求
1. 核心数据展示
2. 数据统计图表
3. 实时数据更新

## 前端页面 /pages/admin/dashboard

### 数据概览（卡片形式）
- 今日新增用户
- 今日订单数
- 今日交易额
- 活跃用户数

### 统计图表
- 用户增长趋势（折线图）
- 交易额趋势（柱状图）
- 商品分类占比（饼图）
- 热门商品TOP10

### 快捷操作
- 商品审核
- 用户管理
- 举报处理
- 优惠券发放

## 云函数 admin-co

新增 action：
- getDashboard (获取看板数据)
- getUserStats (用户统计)
- getOrderStats (订单统计)
- getProductStats (商品统计)

## 图表库
使用 uCharts 或 echarts-for-weixin

## 请开始执行
```

---

### Prompt 7.2：实现商品审核

```markdown
# 任务：实现商品审核功能

## 功能需求
1. 待审核商品列表
2. 商品详情查看
3. 审核通过/拒绝
4. 拒绝原因填写

## 前端页面 /pages/admin/product-audit

### 列表页
- Tab 切换：待审核、已通过、已拒绝
- 商品卡片
  - 图片、标题
  - 卖家信息
  - 提交时间
  - 审核状态
- 点击进入详情

### 审核弹窗
- 商品详情预览
- 审核操作
  - 通过按钮
  - 拒绝按钮
- 拒绝原因输入框
- 常用拒绝原因快捷选择

### 云函数 admin-co

新增 action：
- getAuditList (获取审核列表)
- auditProduct (审核商品)

业务逻辑：
审核通过：
- 更新商品 status=1
- 发送审核通过通知

审核拒绝：
- 更新商品 status=0
- 记录拒绝原因
- 发送审核拒绝通知

数据库扩展：
products 集合新增字段：
- audit_status: 0待审核 1通过 2拒绝
- audit_time: Date
- audit_reason: String (拒绝原因)

## 请开始执行
```

---

## 阶段八：性能优化

### Prompt 8.1：实现图片优化和懒加载

```markdown
# 任务：实现图片优化和懒加载

## 功能需求
1. 图片上传前压缩
2. 图片懒加载
3. 图片CDN加速
4. WebP格式支持

## 实现要求

### 图片压缩
修改图片上传逻辑：
- 使用 uni.compressImage 压缩
- 质量参数 80
- 单张不超过 200KB
- 宽度不超过 1200px

### 懒加载
创建懒加载组件 /components/LazyImage.vue
- 使用 IntersectionObserver API
- 图片进入视口时才加载
- 显示占位图
- 加载失败显示错误图

### CDN配置
- 所有图片URL替换为CDN地址
- 配置 CDN 域名

### 工具函数
创建 /utils/image.ts
- compressImage() 压缩
- getImageUrl() 获取CDN URL
- formatImage() 格式转换

## 请开始执行
```

---

### Prompt 8.2：实现数据缓存

```markdown
# 任务：实现数据缓存优化

## 功能需求
1. 首页数据缓存
2. 商品列表缓存
3. 用户信息缓存
4. 分类数据缓存

## 实现方案

### 缓存策略
使用 Pinia + uni.setStorageSync

### 缓存管理
创建 /utils/cache.ts

```typescript
// 设置缓存（带过期时间）
export function setCache(key: string, data: any, expire?: number)

// 获取缓存
export function getCache(key: string)

// 清除缓存
export function clearCache(key?: string)
```

### 缓存规则
1. 首页数据：缓存5分钟
2. 商品列表：缓存10分钟
3. 用户信息：缓存30分钟
4. 分类数据：缓存1小时
5. 搜索历史：本地持久化

### 缓存更新
- 用户主动刷新时清除
- 数据更新时清除相关缓存
- 缓存过期自动刷新

## 请开始执行
```

---

## 阶段九：测试上线

### Prompt 9.1：编写测试用例

```markdown
# 任务：编写核心功能测试用例

## 测试范围

### 单元测试
1. 工具函数测试
   - 价格格式化
   - 时间格式化
   - 图片压缩

2. 组件测试
   - ProductCard 渲染
   - 表单验证

### 集成测试
1. 登录流程测试
2. 商品发布流程测试
3. 订单创建流程测试
4. 支付流程测试

## 测试框架
使用 vitest

## 测试文件位置
/tests/unit/
/tests/integration/

## 请开始执行
生成测试代码。
```

---

### Prompt 9.2：准备上线

```markdown
# 任务：准备小程序上线

## 任务清单

### 1. 代码优化
- [ ] 移除 console.log（生产环境）
- [ ] 代码混淆压缩
- [ ] 检查所有接口地址
- [ ] 移除调试代码

### 2. 配置检查
- [ ] 配置生产环境API地址
- [ ] 配置域名白名单
- [ ] 配置合法域名
- [ ] 检查 AppID 配置

### 3. 资源检查
- [ ] 检查所有图片路径
- [ ] 检查 tabBar 图标
- [ ] 检查 logo 图片
- [ ] 检查静态资源

### 4. 功能测试
- [ ] 完整测试所有功能
- [ ] 兼容性测试（不同机型）
- [ ] 性能测试（加载速度）
- [ ] 压力测试（并发）

### 5. 文档准备
- [ ] 用户隐私协议
- [ ] 用户服务协议
- [ ] 隐私政策
- [ ] 使用帮助

### 6. 小程序审核准备
- [ ] 填写小程序信息
- [ ] 准备应用截图
- [ ] 准备演示视频
- [ ] 提交审核

## 构建命令
```bash
# 构建生产版本
pnpm run build:mp-weixin

# 使用HBuilderX发行
# 发行 -> 小程序-微信
```

## 请开始执行
生成检查清单文档和配置修改代码。
```

---

## 附录：常用代码片段

### A. 云函数标准模板

```typescript
'use strict';

const db = uniCloud.database()

exports.main = async (event, context) => {
  const { action, params } = event
  
  const actions = {
    // 在此注册 action
  }
  
  if (!actions[action]) {
    return { code: -1, msg: 'action不存在' }
  }
  
  try {
    const result = await actions[action](params, context)
    return { code: 0, msg: 'success', data: result }
  } catch (error) {
    return { code: -1, msg: error.message || '操作失败' }
  }
}
```

### B. 页面标准模板

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue'

const loading = ref(false)

onMounted(() => {
  // 初始化
})
</script>

<template>
  <view class="page">
    <!-- 内容 -->
  </view>
</template>

<style scoped>
.page {
  padding: 20rpx;
}
</style>
```

---

## 使用指南

### 如何使用这些 Prompt

1. **按顺序执行**：从阶段一开始，逐步完成每个 Prompt
2. **验证功能**：每个 Prompt 完成后，运行项目验证功能
3. **调整代码**：根据实际情况调整生成的代码
4. **提交代码**：验证通过后，提交代码到 Git
5. **继续下一步**：确认无误后，执行下一个 Prompt

### 执行示例

```bash
# 1. 执行 Prompt 1.1 后
pnpm install
pnpm run dev:h5

# 2. 验证项目是否能正常运行
# 3. 提交代码
git add .
git commit -m "feat: 初始化项目"

# 4. 继续执行 Prompt 1.2
```

---

**祝你开发顺利！🚀**