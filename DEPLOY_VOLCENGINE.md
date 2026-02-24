# 飞书数据同步平台 - 火山引擎部署指南

## 前置要求
1. 火山引擎账号（需要实名认证）
2. 安装Docker
3. 安装火山引擎CLI工具（可选）

## 部署步骤

### 1. 构建Docker镜像
```bash
docker build -t feishu-sync-tool:latest .
```

### 2. 测试本地运行
```bash
docker run -p 3000:3000 -e FEISHU_APP_ID=your_app_id -e FEISHU_APP_SECRET=your_app_secret feishu-sync-tool:latest
```

### 3. 推送到火山引擎镜像仓库
```bash
# 登录火山引擎镜像仓库
docker login --username=your_username registry.volcengine.com

# 标记镜像
docker tag feishu-sync-tool:latest registry.volcengine.com/your_namespace/feishu-sync-tool:latest

# 推送镜像
docker push registry.volcengine.com/your_namespace/feishu-sync-tool:latest
```

### 4. 在火山引擎控制台创建容器服务
1. 登录火山引擎控制台
2. 进入"容器服务" -> "容器应用"
3. 点击"创建应用"
4. 选择"从镜像仓库创建"
5. 填写应用信息：
   - 应用名称：feishu-sync-tool
   - 镜像地址：registry.volcengine.com/your_namespace/feishu-sync-tool:latest
   - 容器端口：3000
6. 配置环境变量：
   - FEISHU_APP_ID：您的飞书应用ID
   - FEISHU_APP_SECRET：您的飞书应用密钥
7. 点击"创建"

### 5. 配置域名和访问
1. 在应用详情页，点击"域名配置"
2. 添加域名或使用火山引擎提供的默认域名
3. 配置HTTPS证书（推荐）

## 环境变量说明
- `FEISHU_APP_ID`：飞书应用ID（必需）
- `FEISHU_APP_SECRET`：飞书应用密钥（必需）
- `PORT`：应用端口（默认3000）
- `NODE_ENV`：运行环境（production）

## 注意事项
1. 确保防火墙开放3000端口
2. 建议配置HTTPS证书
3. 定期更新镜像版本
4. 监控应用运行状态和日志

## 故障排查
1. 查看容器日志：`docker logs <container_id>`
2. 检查环境变量配置
3. 确认网络连接正常
4. 验证飞书API凭证是否有效