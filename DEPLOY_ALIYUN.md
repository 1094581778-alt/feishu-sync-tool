# 阿里云函数计算部署指南

本指南将帮助您将飞书数据同步平台部署到阿里云函数计算（FC）。

## 前置要求

- 已安装 Node.js (>= 18.0.0)
- 已安装 pnpm
- 已注册阿里云账号
- 已开通阿里云函数计算服务

## 部署步骤

### 步骤1：安装 Serverless Devs 工具

Serverless Devs 是阿里云推荐的函数计算部署工具。

```bash
npm install -g @serverless-devs/s
```

### 步骤2：配置阿里云凭证

1. 登录阿里云控制台：https://fc.console.aliyun.com/
2. 进入「访问控制」->「用户」->「创建用户」
3. 创建用户并授予 `AliyunFCFullAccess` 权限
4. 创建 AccessKey 并保存 AccessKey ID 和 AccessKey Secret
5. 在本地配置凭证：

```bash
s config add
```

按照提示输入：
- AccountID：您的阿里云账号ID（在控制台右上角查看）
- AccessKeyID：刚才创建的 AccessKey ID
- AccessKeySecret：刚才创建的 AccessKey Secret

### 步骤3：构建项目

在项目根目录执行：

```bash
pnpm build
```

### 步骤4：部署到阿里云函数计算

```bash
s deploy
```

部署过程中会提示确认配置，输入 `y` 确认即可。

### 步骤5：获取访问地址

部署成功后，Serverless Devs 会输出访问地址，格式如下：

```
url: https://xxx.cn-hangzhou.fc.aliyuncs.com/2016-08-15/proxy/feishu-sync-tool/feishu-sync-tool/
```

## 配置说明

### s.yaml 配置文件

项目根目录的 `s.yaml` 文件包含了函数计算的配置：

```yaml
edition: 3.0.0
name: feishu-sync-tool
access: default

services:
  feishu-sync-tool:
    component: fc
    props:
      region: cn-hangzhou          # 区域，可修改为其他区域
      service:
        name: feishu-sync-tool
        description: 飞书数据同步平台
        internetAccess: true       # 允许公网访问
      function:
        name: feishu-sync-tool
        description: 飞书数据同步平台 - Next.js应用
        runtime: custom            # 自定义运行时
        codeUri: ./
        memorySize: 512            # 内存大小（MB）
        timeout: 30                # 超时时间（秒）
        cpu: 0.5                   # CPU配额
        diskSize: 512              # 磁盘大小（MB）
        instanceConcurrency: 10    # 实例并发数
        environmentVariables:
          NODE_ENV: production
          PORT: 9000
        customRuntimeConfig:
          command:
            - node
          args:
            - server.js
      triggers:
        - name: httpTrigger
          type: http
          config:
            authType: anonymous    # 匿名访问
            methods:
              - GET
              - POST
              - PUT
              - DELETE
              - HEAD
              - OPTIONS
              - PATCH
      customDomains:
        - domainName: auto         # 自动分配域名
          protocol: HTTP
          routeConfigs:
            - path: /*
```

### 可选配置项

#### 修改区域

如果您希望部署到其他区域，可以修改 `region` 字段：

```yaml
region: cn-beijing      # 北京
region: cn-shanghai     # 上海
region: cn-guangzhou    # 广州
region: cn-shenzhen     # 深圳
```

#### 修改资源配置

根据实际需求调整资源配置：

```yaml
memorySize: 1024        # 增加内存到 1GB
timeout: 60             # 增加超时时间到 60 秒
cpu: 1.0                # 增加 CPU 配额
```

#### 配置自定义域名

如果您有自己的域名，可以配置自定义域名：

```yaml
customDomains:
  - domainName: your-domain.com
    protocol: HTTPS
    certConfig:
      certName: your-cert-name
      certificate: your-certificate-content
      privateKey: your-private-key-content
    routeConfigs:
      - path: /*
```

## 环境变量配置

飞书相关的环境变量需要在阿里云控制台配置：

1. 登录阿里云函数计算控制台
2. 找到部署的函数
3. 进入「配置」->「环境变量」
4. 添加以下环境变量：

```
FEISHU_APP_ID=cli_a90a9d996078dbd9
FEISHU_APP_SECRET=5N3YZhsGq2exd036bRZVNb6WcsrK2NJQ
```

## 费用说明

阿里云函数计算采用按量付费模式：

- **调用次数**：100万次/月免费，超出部分 ¥0.0133/万次
- **执行时间**：每月免费 400,000 CU-秒，超出部分 ¥0.00003167/CU-秒
- **公网流量**：每月免费 1GB，超出部分 ¥0.50/GB

对于个人使用场景，免费额度完全足够。

## 常用命令

### 查看函数信息

```bash
s info
```

### 查看函数日志

```bash
s logs
```

### 本地调试

```bash
s local start
```

### 删除函数

```bash
s remove
```

### 更新函数

```bash
s deploy
```

## 故障排查

### 部署失败

1. 检查 Node.js 版本是否 >= 18.0.0
2. 检查 `pnpm build` 是否成功
3. 检查阿里云凭证是否正确配置
4. 检查区域是否开通函数计算服务

### 访问超时

1. 增加 `timeout` 配置
2. 增加 `memorySize` 配置
3. 检查飞书 API 是否正常

### 环境变量未生效

1. 在阿里云控制台检查环境变量配置
2. 重新部署函数
3. 查看函数日志确认环境变量是否加载

## 优势

相比其他部署方式，阿里云函数计算具有以下优势：

1. **按需付费**：不用不花钱，适合个人和小团队
2. **自动扩缩容**：根据访问量自动调整资源
3. **国内访问快**：部署在国内，访问速度快
4. **零运维**：无需管理服务器
5. **免费额度充足**：个人使用基本免费

## 参考资料

- [阿里云函数计算文档](https://help.aliyun.com/product/50980.html)
- [Serverless Devs 文档](https://www.serverless-devs.com/)
- [Next.js 部署文档](https://nextjs.org/docs/deployment)
