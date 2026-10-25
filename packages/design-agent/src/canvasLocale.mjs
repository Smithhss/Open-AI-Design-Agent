const zh = {
  'Canvas is not ready': '画布尚未就绪，请稍后再试。',
  'Local image editing is not connected yet. Deselect the image to generate a new one.': '本地导入图片暂不支持助手改图；请取消选中后再生成新图。本次未提交生成。',

  'Today': '今天', 'Yesterday': '昨天', 'New Session': '新会话', 'New chat': '新对话',
  'Go Back': '返回', 'Home': '首页', 'Design Agent Studio': '无限画布',
  'Toggle Sessions': '切换会话列表', 'No previous sessions': '暂无历史会话',
  'Total Sessions': '会话总数', 'Rename': '重命名', 'Delete': '删除',
  'Open Chat': '打开对话', 'Hide Chat': '收起对话', 'Creative Agent': '创作助手',
  'Auto Model • Multi-tool Access': '自动选择模型 · 创作工具', 'API Docs': '接口文档',
  'Copy Message': '复制消息', 'Assets': '素材', 'Skills': '技能', 'Audio': '音频',
  'No matches found': '没有匹配结果', 'Upload Image': '上传图片', 'Agent Skills': '助手技能',
  'Expert Skills': '专业技能', 'Session Assets': '会话素材',
  'No assets generated yet': '暂无生成素材', 'Specialized workflow': '专用工作流',
  'Dismiss': '关闭', 'Reply to continue.': '回复后继续。', 'Approve & Execute': '确认并执行',
  'Cancel': '取消', 'Approve': '确认', 'Reject': '拒绝', 'Support': '支持',
  'Dark Mode': '深色模式', 'available': '可用', 'Managed by FYT': '额度以 FYT 控制台为准',
  'Copied to clipboard': '已复制到剪贴板', 'Failed to copy': '复制失败',
  'Upload failed': '上传失败', 'Failed to establish session': '创建会话失败',
  'Session renamed': '会话已重命名', 'Failed to rename session': '重命名会话失败',
  'Session deleted': '会话已删除', 'Failed to delete session': '删除会话失败',
  'Are you sure you want to delete this session?': '确定删除此会话吗？',
  'Start with an idea or mention assets using @...': '描述你的想法，或使用 @ 引用素材…',
  'Copy': '复制', 'Cut': '剪切', 'Duplicate': '创建副本', 'Bring to Front': '置于顶层',
  'Send to Back': '置于底层', 'Move Up': '上移一层', 'Move Down': '下移一层',
  'Export As': '导出为', 'Export all as PNG': '导出全部为 PNG', 'Download': '下载',
  'Paste copied element': '粘贴已复制元素', 'Paste': '粘贴', 'Zoom In': '放大', 'Zoom Out': '缩小',
  'Done': '已完成', 'User': '用户', 'Agent': '助手', 'Bronze': '基础版',
};

export function canvasText(locale, text) {
  return locale === 'zh' ? zh[text] || text : text;
}
