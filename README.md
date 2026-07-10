# onebot-wikilink

基于 OneBot v11 反向 WebSocket 协议的 QQ 机器人，连接 Snowluma 使用。检测群消息中的 `[[条目]]` 和 `{{模板}}` 语法，自动替换为编码后的 wiki 链接。

## 需求

- Node.js >= 18

## 配置

编辑 `config.json`：

```json
{
  "ws": {
    "host": "0.0.0.0",
    "port": 6700
  },
  "default": {
    "enabled": true,
    "wikiUrl": "https://zh.wikipedia.org/wiki/{{title}}"
  },
  "groups": {
    "群号1": { "enabled": true },
    "群号2": {
      "enabled": true,
      "wikiUrl": "https://wiki.biligame.com/mc/{{title}}"
    }
  }
}
```

- `default` — 全局默认配置
- `groups` — 按群覆盖，不列出的群按 `default` 走；`"enabled": false` 关闭

## 使用

```bash
npm install
npm start
```

在 Snowluma 配置中设置反向 WebSocket 地址为 `ws://你的IP:6700`。

## 链接转换规则

| 输入 | 输出路径 |
|------|---------|
| `[[太阳]]` | `wiki/太阳` (encodeURI 编码中文) |
| `{{Test}}` | `wiki/Template:Test` |
| `{{:Test}}` | `wiki/Test` |
| `{{Namespace:Test}}` | `wiki/Namespace:Test` |

消息中的中文自动 URL 编码，空格替换为下划线，使 sbtx 等客户端能正确高亮链接。

## 协议

MIT
