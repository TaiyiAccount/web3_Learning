pragma solidity >=0.4.16;

import "./LearnToken.sol"; 
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract TokenSale is Ownable, ReentrancyGuard {
    using SafeMath for uint256;

    LearnToken public token;
    address payable public owner;
    uint256 public tokensPerEth = 0.001 ether;

    constructor(LearnToken _token) {
        token = _token;
        owner = payable(msg.sender);
    }
    
    event TokensPurchased(address buyer, uint256 ethAmount, uint256 tokenAmount); // 记录代币购买事件
    event TokensWithdrawn(address owner, uint256 amount); // 记录代币提取事件

    function buyTokens() external payable nonReentrant {
        require(msg.value > 0, "Amount must be greater than 0");
        uint256 tokens = msg.value.mul(tokensPerEth);
        require(token.balanceOf(address(this)) >= tokens, "Not enough tokens in the contract"); 
        token.transfer(msg.sender, tokens);
        emit TokensPurchased(msg.sender, msg.value, tokens);
    }

    function withdrawEth() external onlyOwner {
        require(address(this).balance > 0, "No ETH in the contract");
        owner.transfer(address(this).balance); 
    }

    function withdrawTokens(uint256 amount) external onlyOwner {
        require(amount > 0, "Amount must be greater than 0");
        require(token.balanceOf(address(this)) >= amount, "Not enough tokens in the contract");
        token.transfer(msg.sender, amount);
        emit TokensWithdrawn(msg.sender, amount);
    }

    function setTokensPerEth(uint256 newTokensPerEth) external onlyOwner {
        tokensPerEth = newTokensPerEth;
    }

    function setTokenAddress(address newTokenAddress) external onlyOwner {
        token = LearnToken(newTokenAddress);
    }
}