// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title BountyEscrow
 * @dev A simple escrow contract for managing bounties with USDC
 * 
 * Features:
 * - Lock USDC into escrow for a specific task
 * - Release funds to task completer
 * - Refund funds if deadline passes
 */
contract BountyEscrow is Ownable, ReentrancyGuard {
    IERC20 public usdcToken;
    
    struct Bounty {
        address poster;
        uint256 amount;
        string taskId;
        uint256 deadline;
        bool released;
        bool refunded;
    }
    
    mapping(bytes32 => Bounty) public bounties;
    
    event BountyLocked(
        bytes32 indexed bountyId,
        address indexed poster,
        uint256 amount,
        string taskId,
        uint256 deadline
    );
    
    event BountyReleased(
        bytes32 indexed bountyId,
        address indexed recipient,
        uint256 amount
    );
    
    event BountyRefunded(
        bytes32 indexed bountyId,
        address indexed poster,
        uint256 amount
    );
    
    constructor(address _usdcToken) {
        usdcToken = IERC20(_usdcToken);
    }
    
    /**
     * @dev Lock USDC into escrow for a bounty
     * @param _taskId Unique identifier for the task
     * @param _amount Amount of USDC to lock (in wei, 6 decimals)
     * @param _deadline Timestamp when bounty expires
     * @return bountyId The unique ID of the locked bounty
     */
    function lockBounty(
        string memory _taskId,
        uint256 _amount,
        uint256 _deadline
    ) external nonReentrant returns (bytes32) {
        require(_amount > 0, "Amount must be greater than 0");
        require(_deadline > block.timestamp, "Deadline must be in the future");
        
        // Transfer USDC from caller to contract
        require(
            usdcToken.transferFrom(msg.sender, address(this), _amount),
            "USDC transfer failed"
        );
        
        // Create unique bounty ID
        bytes32 bountyId = keccak256(abi.encodePacked(_taskId, msg.sender, block.timestamp));
        
        // Store bounty
        bounties[bountyId] = Bounty({
            poster: msg.sender,
            amount: _amount,
            taskId: _taskId,
            deadline: _deadline,
            released: false,
            refunded: false
        });
        
        emit BountyLocked(bountyId, msg.sender, _amount, _taskId, _deadline);
        return bountyId;
    }
    
    /**
     * @dev Release bounty funds to task completer (only poster can call)
     * @param _bountyId ID of the bounty to release
     * @param _recipient Address to receive the funds
     */
    function releaseBounty(bytes32 _bountyId, address _recipient)
        external
        nonReentrant
    {
        Bounty storage bounty = bounties[_bountyId];
        
        require(bounty.amount > 0, "Bounty does not exist");
        require(!bounty.released, "Bounty already released");
        require(!bounty.refunded, "Bounty already refunded");
        require(msg.sender == bounty.poster, "Only poster can release");
        require(_recipient != address(0), "Invalid recipient");
        
        bounty.released = true;
        
        // Transfer USDC to recipient
        require(
            usdcToken.transfer(_recipient, bounty.amount),
            "USDC transfer failed"
        );
        
        emit BountyReleased(_bountyId, _recipient, bounty.amount);
    }
    
    /**
     * @dev Refund bounty to poster if deadline has passed
     * @param _bountyId ID of the bounty to refund
     */
    function refundBounty(bytes32 _bountyId) external nonReentrant {
        Bounty storage bounty = bounties[_bountyId];
        
        require(bounty.amount > 0, "Bounty does not exist");
        require(!bounty.released, "Bounty already released");
        require(!bounty.refunded, "Bounty already refunded");
        require(
            block.timestamp > bounty.deadline,
            "Deadline has not passed yet"
        );
        
        bounty.refunded = true;
        
        // Refund USDC to poster
        require(
            usdcToken.transfer(bounty.poster, bounty.amount),
            "USDC transfer failed"
        );
        
        emit BountyRefunded(_bountyId, bounty.poster, bounty.amount);
    }
    
    /**
     * @dev Get bounty details
     * @param _bountyId ID of the bounty
     * @return bounty The bounty struct
     */
    function getBounty(bytes32 _bountyId)
        external
        view
        returns (Bounty memory)
    {
        return bounties[_bountyId];
    }
    
    /**
     * @dev Check if bounty deadline has passed
     * @param _bountyId ID of the bounty
     * @return isExpired True if deadline has passed
     */
    function isExpired(bytes32 _bountyId) external view returns (bool) {
        return block.timestamp > bounties[_bountyId].deadline;
    }
}
