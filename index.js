const { WebSocketServer } = require('ws');
const fs = require('fs');
const path = require('path');

const config = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf-8'));

function getGroupConfig(groupId) {
  const group = config.groups[groupId];
  if (group && group.enabled === false) return null;
  return {
    enabled: group?.enabled ?? config.default.enabled,
    wikiUrl: group?.wikiUrl ?? config.default.wikiUrl,
  };
}

function parseLinkTitle(raw) {
  return raw.replace(/^:/, '').replace(/ /g, '_');
}

function parseTemplateTitle(raw) {
  if (raw.startsWith(':')) {
    return raw.slice(1).replace(/ /g, '_');
  }
  if (raw.includes(':')) {
    return raw.replace(/ /g, '_');
  }
  return 'Template:' + raw.replace(/ /g, '_');
}

function processMessage(raw, wikiUrl) {
  let text = raw;
  text = text.replace(/\[\[([^\]]+)\]\]/g, (match, content) => {
    const title = parseLinkTitle(content);
    const url = wikiUrl.replace('{{title}}', title);
    return encodeURI(url);
  });
  text = text.replace(/\{\{([^\}]+)\}\}/g, (match, content) => {
    const title = parseTemplateTitle(content);
    const url = wikiUrl.replace('{{title}}', title);
    return encodeURI(url);
  });
  return text;
}

const wss = new WebSocketServer({ host: config.ws.host, port: config.ws.port });
console.log(`[WikiLink] 反向 WS 服务已启动 ws://${config.ws.host}:${config.ws.port}`);

wss.on('connection', (ws) => {
  console.log('[WikiLink] Snowluma 已连接');

  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data.toString());
      if (msg.post_type === 'meta_event') return;
      if (msg.post_type !== 'message' || msg.message_type !== 'group') return;

      const groupConfig = getGroupConfig(String(msg.group_id));
      if (!groupConfig || !groupConfig.enabled) return;

      const rawText = msg.raw_message || '';
      const processed = processMessage(rawText, groupConfig.wikiUrl);

      if (processed !== rawText) {
        ws.send(JSON.stringify({
          action: 'send_group_msg',
          params: { group_id: msg.group_id, message: processed },
        }));
      }
    } catch (err) {
      console.error('[WikiLink] 处理消息出错:', err.message);
    }
  });

  ws.on('close', () => console.log('[WikiLink] Snowluma 已断开'));
  ws.on('error', (err) => console.error('[WikiLink] WS 错误:', err.message));
});

wss.on('error', (err) => {
  console.error('[WikiLink] 服务错误:', err.message);
  process.exit(1);
});
