pragma solidity >=0.4.16;

import "./interfaces/IERC20.sol";

contract LearnToken is IERC20 {
    string public name = "LearnToken";
    string public symbol = "LTK";
    uint8 public decimals = 18;
    uint256 private _totalSupply = 1000000000000000000000000;

    mapping(address => uint256) private _balances;
    mapping(address => mapping(address => uint256)) private _allowances;

    address private _owner;

    constructor() {
        _owner = msg.sender;
        _balances[msg.sender] = _totalSupply;
    }

    function totalSupply() external view returns (uint256) {
        return _totalSupply;
    }

    function balanceOf(address account) external view returns (uint256) {
        return _balances[account];
    }

    function transfer(address to, uint256 amount) external returns (bool) { 
        _transfer(msg.sender, to, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        _transfer(from, to, amount);
        return true;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        _approve(msg.sender, spender, amount);
        return true;
    }

    function allowance(address owner, address spender) external view returns (uint256) {
        return _allowances[owner][spender];
    }

    function _transfer(address from, address to, uint256 amount) internal {
        require(from != address(0), "ERC20: transfer from the zero address");
        require(to != address(0), "ERC20: transfer to the zero address");
        require(amount > 0, "ERC20: transfer amount must be greater than zero");
        require(_balances[from] >= amount, "ERC20: transfer amount exceeds balance");
        _balances[from] -= amount;
        _balances[to] += amount;
        emit Transfer(from, to, amount);
    }

    function _approve(address owner, address spender, uint256 amount) internal {
        require(owner != address(0), "ERC20: approve from the zero address");
        require(spender != address(0), "ERC20: approve to the zero address");
        _allowances[owner][spender] = amount;
    }
}