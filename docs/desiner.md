# ERC20代币学习项目设计文档

## 1. 项目概述

本项目旨在通过手动实现ERC20代币合约，帮助开发者深入理解以太坊代币标准的核心机制。项目包含两个主要合约：
1. `LearnToken` - 完全手动实现的ERC20标准代币
2. `TokenSale` - 简单的代币销售合约，用于演示代币经济模型

## 2. 合约设计

### 2.1 LearnToken合约

#### 2.1.1 状态变量

| 变量名 | 类型 | 可见性 | 描述 |
|--------|------|--------|------|
| `name` | `string` | `public` | 代币名称("LearnToken") |
| `symbol` | `string` | `public` | 代币符号("LTK") |
| `decimals` | `uint8` | `public` | 代币小数位数(18) |
| `_totalSupply` | `uint256` | `private` | 代币总供应量 |
| `_balances` | `mapping(address => uint256)` | `private` | 地址余额映射 |
| `_allowances` | `mapping(address => mapping(address => uint256))` | `private` | 授权额度映射 |
| `owner` | `address` | `public` | 合约所有者地址 |

#### 2.1.2 函数设计

**核心ERC20函数**:

1. `totalSupply()`
   - 功能：返回代币总供应量
   - 实现：直接返回`_totalSupply`
   - 注意：无状态修改

2. `balanceOf(address account)`
   - 功能：查询指定地址余额
   - 实现：从`_balances`映射中读取
   - 注意：需验证输入地址不为零地址

3. `transfer(address to, uint256 amount)`
   - 功能：代币转账
   - 实现：
     - 检查`to`不是零地址
     - 检查发送方余额充足
     - 更新双方余额
     - 触发`Transfer`事件
   - 注意：重入攻击风险(本项目未使用ReentrancyGuard)

4. `approve(address spender, uint256 amount)`
   - 功能：授权其他地址使用代币
   - 实现：
     - 更新`_allowances`映射
     - 触发`Approval`事件
   - 注意：前端应用需处理授权前后端一致性问题

5. `allowance(address owner, address spender)`
   - 功能：查询授权额度
   - 实现：从`_allowances`映射中读取
   - 注意：无状态修改

6. `transferFrom(address from, address to, uint256 amount)`
   - 功能：从授权地址转账
   - 实现：
     - 检查`to`不是零地址
     - 检查`from`余额充足
     - 检查授权额度充足
     - 更新余额和授权额度
     - 触发`Transfer`事件
   - 注意：授权额度可能被前端误用

**扩展功能**:

1. `mint(address to, uint256 amount)`
   - 功能：增发代币(仅所有者)
   - 实现：
     - 权限检查
     - 调用内部`_mint`函数
   - 注意：需严格控制权限

2. `burn(uint256 amount)`
   - 功能：销毁代币
   - 实现：
     - 检查余额充足
     - 更新余额和总供应量
     - 触发`Transfer`事件(转到零地址)
   - 注意：销毁不可逆

3. `_mint(address account, uint256 amount)` (private)
   - 功能：内部铸币逻辑
   - 实现：
     - 检查`account`不是零地址
     - 更新总供应量和余额
     - 触发`Transfer`事件(从零地址)
   - 注意：不直接暴露给外部

#### 2.1.3 事件

1. `Transfer(address indexed from, address indexed to, uint256 value)`
   - 触发时机：代币转移时
   - 用途：追踪代币流动

2. `Approval(address indexed owner, address indexed spender, uint256 value)`
   - 触发时机：授权额度变更时
   - 用途：追踪授权关系

### 2.2 TokenSale合约

#### 2.2.1 状态变量

| 变量名 | 类型 | 可见性 | 描述 |
|--------|------|--------|------|
| `token` | `LearnToken` | `public` | 代币合约实例 |
| `owner` | `address payable` | `public` | 合约所有者 |
| `tokensPerEth` | `uint256` | `public` | ETH兑换代币比率 |

#### 2.2.2 函数设计

1. `buyTokens() payable`
   - 功能：使用ETH购买代币
   - 实现：
     - 检查发送的ETH大于0
     - 计算应得代币数量
     - 检查合约代币余额充足
     - 执行代币转账
     - 触发`TokensPurchased`事件
   - 注意：精确计算兑换数量，防止舍入错误

2. `withdrawEth()`
   - 功能：提取合约ETH(仅所有者)
   - 实现：
     - 权限检查
     - 转账ETH给所有者
   - 注意：使用`transfer`而非`call`避免重入

3. `withdrawTokens(uint256 amount)`
   - 功能：提取合约代币(仅所有者)
   - 实现：
     - 权限检查
     - 调用代币合约的`transfer`
     - 触发`TokensWithdrawn`事件
   - 注意：检查合约实际代币余额

4. `setTokensPerEth(uint256 newRate)`
   - 功能：设置兑换比率(仅所有者)
   - 实现：
     - 权限检查
     - 更新`tokensPerEth`
   - 注意：比率变更应通知用户

#### 2.2.3 事件

1. `TokensPurchased(address buyer, uint256 ethAmount, uint256 tokenAmount)`
   - 记录代币购买详情

2. `TokensWithdrawn(address owner, uint256 amount)`
   - 记录代币提取记录

## 3. 关键实现细节

### 3.1 数值处理

1. **小数位数**：
   - 使用18位小数(与ETH一致)
   - 所有UI显示需格式化：`amount / 10^18`

2. **算术运算**：
   - 使用SafeMath模式(自动继承自Solidity 0.8+)
   - 示例：`_balances[from] -= amount`

### 3.2 权限控制

1. **所有权管理**：
   - 使用显式`owner`变量而非继承Ownable
   - 关键函数使用`require(msg.sender == owner)`

2. **授权机制**：
   - 双重映射存储授权：`_allowances[owner][spender]`
   - `transferFrom`需同时修改余额和授权额度

### 3.3 安全考虑

1. **输入验证**：
   ```solidity
   require(to != address(0), "ERC20: transfer to the zero address"
   ```

2. **状态变更顺序**：
   - 遵循Checks-Effects-Interactions模式
   - 先验证、再修改状态、最后外部调用

3. **重入风险**：
   - 本项目未使用ReentrancyGuard
   - 生产环境建议添加`nonReentrant`修饰器

## 4. 测试设计要点

### 4.1 LearnToken测试用例

1. **基础属性测试**：
   - 名称、符号、小数位验证
   - 初始供应量分配

2. **转账测试**：
   - 正常转账
   - 余额不足情况
   - 零地址转账

3. **授权测试**：
   - 授权额度设置
   - 授权转账
   - 超额授权尝试

4. **铸币/销毁测试**：
   - 所有者铸币权限
   - 非所有者铸币尝试
   - 代币销毁效果

### 4.2 TokenSale测试用例

1. **代币购买测试**：
   - 正常购买流程
   - ETH兑换比率计算
   - 代币不足情况

2. **资金提取测试**：
   - ETH提取权限
   - 代币提取权限
   - 非所有者提取尝试

3. **参数配置测试**：
   - 兑换比率更新
   - 权限控制验证

## 5. 部署策略

### 5.1 部署流程

1. **代币合约部署**：
   - 初始化供应量(如100万代币)
   - 所有者设为部署者地址

2. **销售合约部署**：
   - 传入代币合约地址
   - 设置初始兑换比率

3. **资金准备**：
   - 将部分代币转入销售合约(如50万)

### 5.2 参数配置建议

1. **代币参数**：
   - 名称：具有识别度的名称
   - 符号：3-5个大写字母
   - 小数：通常18位

2. **销售参数**：
   - 初始兑换率：基于预期估值
   - 销售总量：控制流通量

## 6. 已知问题与改进方向

### 6.1 当前限制

1. **代币合约**：
   - 简单的所有权模型(无转移所有权功能)
   - 无暂停机制
   - 无黑名单功能

2. **销售合约**：
   - 固定兑换比率
   - 无硬顶/软顶限制
   - 无时间限制

### 6.2 扩展建议

1. **进阶功能**：
   - 实现ERC20Permit(离线授权)
   - 添加代币冻结功能
   - 实现分层授权管理

2. **销售模型改进**：
   - 多阶段销售(预售/公售)
   - 动态价格机制
   - KYC验证集成

3. **安全增强**：
   - 添加ReentrancyGuard
   - 实现紧急停止模式
   - 引入时间锁机制

## 7. 使用说明

### 7.1 开发环境

1. **安装依赖**：
   ```bash
   npm install
   ```

2. **配置环境**：
   - 复制`.env.example`为`.env`
   - 填写Infura和私钥配置

### 7.2 测试命令

```bash
npx hardhat test
```

### 7.3 部署命令

```bash
npx hardhat run scripts/deploy.js --network sepolia
```

### 7.4 交互命令

```bash
npx hardhat run scripts/interact.js --network sepolia
```