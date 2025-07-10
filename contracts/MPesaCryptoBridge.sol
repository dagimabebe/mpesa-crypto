
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract MPesaCryptoBridge is Ownable, ReentrancyGuard {

    IERC20 public token;
    
    uint256 public bridgeFee = 50; // 0.5%
 
    mapping(string => bool) public processedMpesaTx;
    
    event Deposit(
        string indexed mpesaTxID,
        address indexed recipient,
        uint256 amount,
        uint256 timestamp
    );
    
    event Withdrawal(
        address indexed sender,
        string phone,
        uint256 amount,
        string mpesaTxID,
        uint256 timestamp
    );
    
    event BridgeFeeUpdated(uint256 newFee);
    event TokensWithdrawn(uint256 amount);

    constructor(address _tokenAddress) {
        token = IERC20(_tokenAddress);
    }

   
    function deposit(
        string memory _mpesaTxID,
        address _recipient,
        uint256 _amount
    ) external onlyOwner nonReentrant {
        require(!processedMpesaTx[_mpesaTxID], "Transaction already processed");
        require(_amount > 0, "Invalid amount");
        require(_recipient != address(0), "Invalid recipient");
        
        processedMpesaTx[_mpesaTxID] = true;
        
        // Calculate and deduct bridge fee
        uint256 fee = (_amount * bridgeFee) / 10000;
        uint256 netAmount = _amount - fee;
        
        // Transfer tokens to recipient
        require(
            token.transfer(_recipient, netAmount),
            "Transfer failed"
        );
        
        emit Deposit(_mpesaTxID, _recipient, netAmount, block.timestamp);
    }

    
    function withdraw(
        string memory _phone,
        uint256 _amount,
        string memory _mpesaTxID
    ) external nonReentrant {
        require(_amount > 0, "Invalid amount");
        require(bytes(_phone).length == 12, "Invalid phone number");
        require(!processedMpesaTx[_mpesaTxID], "Transaction ID already used");
        
        // Calculate and deduct bridge fee
        uint256 fee = (_amount * bridgeFee) / 10000;
        uint256 netAmount = _amount - fee;
        
        // Transfer tokens from user to contract
        require(
            token.transferFrom(msg.sender, address(this), _amount),
            "Transfer failed"
        );
        
        processedMpesaTx[_mpesaTxID] = true;
        
        emit Withdrawal(
            msg.sender,
            _phone,
            netAmount,
            _mpesaTxID,
            block.timestamp
        );
    }

    // ========== ADMIN FUNCTIONS ==========
    
   
    function updateBridgeFee(uint256 _newFee) external onlyOwner {
        require(_newFee <= 500, "Fee too high"); // Max 5%
        bridgeFee = _newFee;
        emit BridgeFeeUpdated(_newFee);
    }

   
    function withdrawFees() external onlyOwner {
        uint256 balance = token.balanceOf(address(this));
        require(balance > 0, "No fees to withdraw");
        
        require(
            token.transfer(owner(), balance),
            "Transfer failed"
        );
        
        emit TokensWithdrawn(balance);
    }
}
