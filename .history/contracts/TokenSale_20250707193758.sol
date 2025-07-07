pragma solidity ^0.8.0;

import "./LearnToken.sol";  
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract TokenSale is Ownable, ReentrancyGuard {
 
    LearnToken public token;
    uint256 public tokensPerEth = 0.001 ether;

    constructor(LearnToken _token) Ownable(msg.sender) {
        token = _token;
    }

    event TokensPurchased(address buyer, uint256 ethAmount, uint256 tokenAmount); // 记录代币购买事件
    event TokensWithdrawn(address owner, uint256 amount); // 记录代币提取事件

    function buyTokens() external payable nonReentrant {
        require(msg.value > 0, "Amount must be greater than 0");
        uint256 tokens = msg.value * tokensPerEth;
        require(token.balanceOf(address(this)) >= tokens, "Not enough tokens in the contract"); 
        token.transfer(msg.sender, tokens);
        emit TokensPurchased(msg.sender, msg.value, tokens);
    }

    function withdrawEth() external onlyOwner {
        require(address(this).balance > 0, "No ETH in the contract");
        payable(owner()).transfer(address(this).balance); 
    }

    function withdrawTokens(uint256 amount) external onlyOwner {
        require(amount > 0, "Amount must be greater than 0");
        require(token.balanceOf(address(this)) >= amount, "Not enough tokens in the contract");
        token.transfer(owner(), amount);
        emit TokensWithdrawn(owner(), amount);
    }

    function setTokensPerEth(uint256 newTokensPerEth) external onlyOwner {
        tokensPerEth = newTokensPerEth;
    }

    function setTokenAddress(address newTokenAddress) external onlyOwner {
        token = LearnToken(newTokenAddress);
    }
}