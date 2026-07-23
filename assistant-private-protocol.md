# 智能助手私有协议

本文档描述智能助手 V2 在 Dify `answer` 文本中支持的私有协议格式。普通内容按 Markdown 渲染；私有协议通过 Markdown fenced code block 承载，客户端解析后渲染为按钮、菜单或 function call 入口。

## 基本规则

- 普通文本使用 Markdown。
- 私有协议必须放在独立代码块中。
- 私有协议代码块不会作为代码显示，会被客户端解析成 UI。
- JSON 解析失败时，客户端会把原代码块按普通 Markdown 内容回退显示。
- `type` 未传时默认按 `buttons` 处理；传入未支持的 `type` 时，原代码块会回退为 Markdown。
- `items` 按项容错：格式错误或缺少必填字段的 item 会被忽略；若没有任何有效 item，原代码块会回退为 Markdown。
- 当前支持的代码块标识：
  - `dodex-actions`

## Markdown 支持范围

当前客户端支持常见 Markdown 块级渲染：

- 标题：`#` 到 `######`
- 段落
- 引用：`>`
- 无序列表：`-`、`*`、`+`
- 代码块：```` ``` ````
- 表格
- 图片：`![alt](url)`

示例：

````markdown
## eSIM 激活说明

> 激活前请确认设备已联网。

- 打开我的 eSIM
- 选择待激活套餐
- 按系统提示完成安装

| 步骤 | 操作 |
| --- | --- |
| 1 | 扫码或本机激活 |
| 2 | 开启数据漫游 |

![激活示意图](https://example.com/esim-guide.png)
````

## 候选按钮/菜单/列表

使用 `dodex-actions` 输出多个候选操作。

### 字段

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `type` | string | 否 | 展示类型。`buttons` 为按钮组，`menu` 为下拉菜单，`list` 为商品样式列表，`qrcode` 为二维码，`command` 为自动执行命令。默认 `buttons` |
| `direction` | string | 否 | 按钮组方向。`horizontal` 横向，`vertical` 纵向。默认 `horizontal` |
| `wrap` | boolean | 否 | 按钮组横向展示时是否自动换行。默认 `false` |
| `items` | array | 是 | 候选项列表 |
| `items[].id` | string | 否 | 候选项 ID；不传时客户端会使用 `label` |
| `items[].label` | string | 是 | 展示文案 |
| `items[].title` | string | 否 | `type: "list"` 时的主标题；不传时使用 `label` |
| `items[].subtitle` | string | 否 | `type: "list"` 时的子标题 |
| `items[].price` | string | 否 | `type: "list"` 时的价格文案 |
| `items[].imageUrl` | string | 否 | `type: "list"` 时的左侧图片 URL |
| `items[].message` | string | 否 | 点击后作为用户消息继续发送；优先级高于 `value` / `submitText` |
| `items[].value` | string | 否 | 点击后作为用户消息继续发送 |
| `items[].submitText` | string | 否 | 点击后作为用户消息继续发送；与 `value` 等价 |
| `items[].function` | object | 否 | 点击后执行 function call；`show_menu` 例外：先展示底部菜单 |

说明：

- `direction` 仅对 `type: "buttons"` 生效；兼容字段名：`direction`、`layoutDirection`、`buttonDirection`、`orientation`。
- `direction: "vertical"` 时按钮纵向排列，每个按钮独占一行。
- `direction: "horizontal"` 且 `wrap: true` 时按钮横向排列，空间不足自动换行。
- `type: "menu"` 不受 `direction` / `wrap` 影响。
- `type: "qrcode"` 使用每个 `items[].value` 作为二维码内容；二维码仅展示、不响应点击。可选传 `label` / `title` 作为二维码下方说明。
- `type: "command"` 不渲染 UI；客户端收到后自动依次执行每个 item 的 function call。item 可直接使用 function 结构（`name`、`arguments`），或包在 `function` 字段中。
- `type: "command"` 以消息 ID 与 action 块下标作为执行键，同一条消息在重组或滚动复用时只会执行一次。
- `type: "list"` 每个 item 渲染为一个列表元素：传入 `imageUrl` 时左侧展示图片；未传或为空时不显示图片占位区域，右侧主标题、子标题、价格直接左对齐。点击整行触发 `function`，未传 `function` 时按 `message` / `value` / `submitText` 继续发送消息。
- 当 `items[].function.name` 为 `show_menu` 时，客户端从与 `name` 同级的 `items[].function.items` 读取选项并从底部弹出菜单；用户选择后按选项的 `message` / `value` / `submitText` 发送消息。
- `type: "list"` 兼容字段名：
  - 主标题：`title`、`label`、`name`
  - 子标题：`subtitle`、`subTitle`、`description`、`desc`
  - 价格：`price`、`priceText`、`amount`
  - 图片：`imageUrl`、`image_url`、`image`、`thumbnail`、`picture`

### 按钮组示例

````markdown
请选择下一步：

```dodex-actions
{
  "type": "buttons",
  "direction": "horizontal",
  "wrap": true,
  "items": [
    {
      "id": "buy_plan",
      "label": "购买套餐",
      "function": {
        "name": "open_page",
        "arguments": {
          "route": "mall"
        }
      }
    },
    {
      "id": "contact_service",
      "label": "联系客服",
      "value": "我想联系客服"
    }
  ]
}
```
````

### 下拉菜单示例

````markdown
请选择问题类型：

```dodex-actions
{
  "type": "menu",
  "items": [
    {
      "id": "order",
      "label": "订单问题",
      "value": "我要咨询订单问题"
    },
    {
      "id": "esim",
      "label": "eSIM 激活",
      "value": "我要咨询 eSIM 激活"
    }
  ]
}
```
````

### 商品列表示例

````markdown
为你推荐以下套餐：

```dodex-actions
{
  "type": "list",
  "items": [
    {
      "id": "jp_5gb_30d",
      "title": "日本 5GB 30天",
      "subtitle": "高速流量，支持 eSIM 自动激活",
      "price": "$9.90",
      "imageUrl": "https://example.com/japan-esim.png",
      "function": {
        "name": "open_page",
        "arguments": {
          "route": "mall"
        }
      }
    }
  ]
}
```
````

### 二维码示例

````markdown
请使用另一台设备扫码安装：

```dodex-actions
{
  "type": "qrcode",
  "items": [
    {
      "id": "activation_code",
      "label": "eSIM 安装码",
      "value": "LPA:1$example"
    }
  ]
}
```
````

### 自动执行命令示例

````markdown
```dodex-actions
{
  "type": "command",
  "items": [
    {
      "name": "open_page",
      "arguments": {
        "route": "card_pack"
      }
    }
  ]
}
```
````

### 待激活套餐示例

````markdown
你有以下待激活套餐：

```dodex-actions
{
  "type": "list",
  "items": [
    {
      "id": "jp_5gb_30d",
      "title": "日本 5GB 30天",
      "subtitle": "高速流量，支持 eSIM 自动激活",
      "price": "$9.90",
      "imageUrl": "https://example.com/japan-esim.png",
      "function": {
        "name": "show_menu",
        "items": [
          {
            "id": "activate",
            "label": "本机激活",
            "value": "我要在本机激活"
          },
          {
            "id": "qrcode",
            "label": "显示二维码",
            "value": "直接显示二维码"
          }
        ]
      }
    }
  ]
}
```
````

### 后续方案：支付摘要卡 `type: "payment"`

该类型暂不实现，先作为后续需求记录。

目标是在智能助手 V2 对话中解析 `dodex-actions` 的 `type: "payment"`，渲染一张订单支付摘要卡，而不是把完整订单支付页嵌入聊天消息。推荐形态：

```json
{
  "type": "payment",
  "orderId": 12345
}
```

建议实现范围：

- 使用 `orderId` 拉取订单必要信息，展示商品、金额、订单状态等摘要。
- 卡片底部提供「去支付」按钮，点击后关闭 V2 sheet 并复用现有 `OrderNavigator.toPay(orderId)` 进入完整支付页。
- 不在 V2 卡片内直接承载完整支付流程，避免重复处理优惠券弹窗、支付国家选择、WebView 收银台、外部浏览器回跳、支付结果确认等复杂状态。

不建议直接把完整订单支付页搬进聊天卡片，原因：

- 现有支付页是完整页面结构，包含 `AppScaffold`、顶部栏、底部支付按钮、弹窗和生命周期回跳处理。
- 直接嵌入会引入嵌套滚动、弹窗层级、返回键和支付 WebView 跳转等风险。
- 若同一会话出现多个支付卡片，还需要额外处理多个订单支付状态并存的问题。

若后续必须在卡片内完成支付，需要先重构支付模块，拆出可嵌入的 `OrderPayContent` / `OrderPayEmbeddedCard`，并为 embedded mode 单独适配底部按钮、弹窗、Web 支付跳转和回跳确认。

## Function 调用

不再支持 `dodex-function`。所有 function 必须放在 `dodex-actions` 的 `items[].function` 中；单个可点击入口使用 `type: "buttons"`，不需要渲染的自动调用使用 `type: "command"`。

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `items[].function.name` | string | 是 | 函数名 |
| `items[].function.arguments` | object | 否 | 函数参数；客户端按字符串参数处理 |
| `items[].function.items` | array | 仅 `show_menu` 必填 | 底部菜单选项，与 `name` 同级 |

单个可点击入口示例：

````markdown
```dodex-actions
{
  "type": "buttons",
  "items": [
    {
      "id": "open_card_pack",
      "label": "打开我的 eSIM",
      "function": {
        "name": "open_page",
        "arguments": {
          "route": "card_pack"
        }
      }
    }
  ]
}
```
````

## 当前支持的函数

### `show_menu`

展示底部菜单。将其配置在 `dodex-actions` 任意 item（通常是商品列表项）的 `function` 中；点击该 item 才会打开菜单。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `items` | array | 是 | 菜单选项，至少需要一个有效选项 |
| `items[].id` | string | 否 | 选项 ID；不传时使用 `label` |
| `items[].label` | string | 是 | 选项展示文案 |
| `items[].message` | string | 否 | 选择后发送的用户消息，优先级最高 |
| `items[].value` | string | 否 | 选择后发送的用户消息 |
| `items[].submitText` | string | 否 | 选择后发送的用户消息 |
| `items[].subtitle` | string | 否 | 选项副标题 |

示例：

````markdown
```dodex-actions
{
  "type": "buttons",
  "items": [
    {
      "id": "activation_method",
      "label": "选择激活方式",
      "function": {
        "name": "show_menu",
        "items": [
          {"id": "activate", "label": "本机激活", "value": "我要在本机激活"},
          {"id": "qrcode", "label": "显示二维码", "value": "直接显示二维码"}
        ]
      }
    }
  ]
}
```
````

### `open_page` / `navigate`

跳转到 App 内页面。

| 参数 | 类型 | 必填 | 支持值 |
| --- | --- | --- | --- |
| `route` | string | 是 | `home`、`mall`、`store`、`category`、`card_pack`、`esim`、`wallet`、`mine`、`me`、`assistant`、`goods_detail`、`goods`、`product_detail`、`product`、`pay`、`payment`、`order_pay`、`order_payment` |
| `prdtId` | number/string | 商品详情必填 | 商品 ID，用于跳转商品详情页 |
| `pskuId` | number/string | 否 | 默认选中的商品 SKU ID |
| `orderId` | number/string | 支付页必填 | 订单 ID，用于跳转支付页 |

说明：

- `home`：首页
- `mall` / `store` / `category`：商城
- `card_pack` / `esim` / `wallet`：我的 eSIM
- `mine` / `me`：我的
- `assistant`：智能助手
- `goods_detail` / `goods` / `product_detail` / `product`：商品详情页，必须同时传 `prdtId`；可传 `pskuId` 默认选中对应 SKU
- `pay` / `payment` / `order_pay` / `order_payment`：订单支付页，必须传 `orderId`

### `refresh_card_pack`

刷新「我的 eSIM / 卡包」列表，不关闭智能助手，也不切换当前页面。无需传参。

兼容函数名：`refresh_card_pack`、`refresh_cardpack`、`refresh_esim_list`。

可将该 function 放在任意 action item 的 `function` 字段中；需要自动刷新时使用 `type: "command"`。

支付页示例：

将 `open_page` 配置在按钮 item 的 `function` 中，并传入 `route: "pay"` 与 `orderId`。

### `open_pay` / `open_payment` / `pay` / `payment` / `order_pay` / `order_payment`

直接跳转到订单支付页。点击后客户端会先关闭智能助手 V2 sheet，再进入 App 现有支付页。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `orderId` | number/string | 是 | 订单 ID |

兼容参数名：`orderId`、`order_id`、`odId`、`id`。

将该 function 配置在按钮 item 的 `function` 中，并传入 `orderId`。

### `send_message`

将指定文本作为用户消息继续发送给 Dify。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `text` | string | 是 | 要发送的用户消息 |

将该 function 配置在按钮 item 的 `function` 中，并传入 `text`。

商品详情示例：

将 `open_page` 配置在按钮 item 的 `function` 中，并传入 `route: "goods_detail"`、`prdtId` 和可选的 `pskuId`。

### `download_profile` / `downloadProfile`

使用已知 ACCode 与订单明细 ID 触发 App 内 eSIM Profile 下载。点击后客户端会先关闭智能助手 V2 sheet，跳转到「我的 eSIM / 卡包」Tab，再按设备能力处理。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `ACCode` | string | 是 | eSIM Profile 下载使用的 ACCode |
| `orderDetailId` | number/string | 是 | 订单明细 ID，用于安装成功后的服务端履约回调 |

兼容参数名：`ACCode`、`acCode`、`activationCode`、`code`。

订单明细 ID 兼容参数名：`orderDetailId`、`order_detail_id`、`odId`、`detailId`。

兼容函数名：`download_profile`、`downloadProfile`、`download_esim_profile`、`downloadEsimProfile`。

说明：

- `ACCode` 与 `orderDetailId` 都必须传入；缺任一参数时客户端不会触发下载。
- 如果设备不支持 eSIM，客户端会在卡包页展示 ACCode 二维码弹窗。
- 如果设备支持 eSIM，客户端会调用系统 eSIM 下载接口；安装成功广播到达后调用订单履约回调接口。
- 系统 eSIM 下载结果仍走 App 现有安装广播处理和卡包页安装结果弹窗。

将该 function 配置在按钮或列表 item 的 `function` 中，并传入 `ACCode` 与 `orderDetailId`。

### `showACQRCode` / `show_ac_qr_code`

使用已知 ACCode 直接展示 eSIM 安装二维码。点击后客户端会先关闭智能助手 V2 sheet，跳转到「我的 eSIM / 卡包」Tab，并复用卡包页现有 AC 二维码弹窗。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `ACCode` | string | 是 | 用于生成二维码的 ACCode / LPA 安装码 |

兼容参数名：`ACCode`、`acCode`、`activationCode`、`code`。

兼容函数名：`showACQRCode`、`show_ac_qr_code`、`show_ac_qrcode`、`show_activation_qr`、`showActivationQr`。

说明：

- 该 function 只展示二维码，不请求履约接口获取 ACCode。
- 该 function 不触发系统 eSIM 下载，也不触发安装成功后的服务端履约回调。
- 适用于 Dify 已经拿到 ACCode，只需要让用户扫码安装的场景。
- 如需本机直接下载 profile 并在安装成功后履约，应使用 `download_profile`，且必须同时传 `ACCode` 与 `orderDetailId`。

将该 function 配置在按钮或列表 item 的 `function` 中，并传入 `ACCode`。

## 完整回答示例

````markdown
## 可以帮你处理这些问题

> 如果你已经购买套餐，可以直接进入我的 eSIM 查看待激活套餐。

| 场景 | 建议 |
| --- | --- |
| 未购买 | 先购买目的地套餐 |
| 已购买 | 进入我的 eSIM 激活 |

```dodex-actions
{
  "type": "buttons",
  "items": [
    {
      "id": "go_mall",
      "label": "购买套餐",
      "function": {
        "name": "open_page",
        "arguments": {
          "route": "mall"
        }
      }
    },
    {
      "id": "go_esim",
      "label": "查看我的 eSIM",
      "function": {
        "name": "open_page",
        "arguments": {
          "route": "card_pack"
        }
      }
    },
    {
      "id": "ask_activation",
      "label": "查看激活步骤",
      "value": "请告诉我 eSIM 激活步骤"
    },
    {
      "id": "show_ac_qr",
      "label": "显示安装二维码",
      "function": {
        "name": "showACQRCode",
        "arguments": {
          "ACCode": "LPA:1$example"
        }
      }
    }
  ]
}
```
````
