# ⚠️ 权限问题解决方案

## 问题说明

您的项目遇到了 `EPERM: operation not permitted` 错误，这是macOS系统级别的权限问题。

## 💡 推荐解决方法（按优先级）

### 方法1：在系统终端中运行（最简单）

1. 打开 **终端（Terminal）** 或 **iTerm2**
2. 执行以下命令：

```bash
cd /Users/raysteve/AIAccounting
./start.sh
```

或者直接：

```bash
cd /Users/raysteve/AIAccounting
yarn dev
```

### 方法2：检查杀毒/清理软件

如果您安装了以下软件，请将项目目录添加到白名单：
- CleanMyMac
- Avast
- Norton
- Kaspersky
- 其他杀毒软件

**添加到白名单的路径：**
```
/Users/raysteve/AIAccounting
```

### 方法3：修复权限（需要管理员权限）

在终端中执行：

```bash
cd /Users/raysteve/AIAccounting
sudo chmod -R 755 node_modules
sudo xattr -cr node_modules
yarn dev
```

### 方法4：使用npx直接运行

```bash
cd /Users/raysteve/AIAccounting
npx next dev
```

### 方法5：重新安装在不同位置

将项目移动到用户目录下的其他位置：

```bash
# 复制到桌面
cp -r /Users/raysteve/AIAccounting ~/Desktop/AIAccounting-new
cd ~/Desktop/AIAccounting-new
rm -rf node_modules yarn.lock
yarn install
yarn dev
```

## 🔍 诊断命令

运行以下命令检查文件权限：

```bash
cd /Users/raysteve/AIAccounting
ls -la@ node_modules/next/dist/client/components/router-reducer/compute-changed-path.js
```

## 📞 如果以上方法都不行

1. 检查是否有杀毒软件在后台运行
2. 重启电脑后再试
3. 尝试在Docker中运行项目
4. 联系系统管理员检查macOS安全设置

## ✅ 成功启动后

访问 **http://localhost:3000** 即可使用系统。

---

**项目位置：** `/Users/raysteve/AIAccounting`  
**演示时间：** 本周四  
**DDL：** 2025-11-27


