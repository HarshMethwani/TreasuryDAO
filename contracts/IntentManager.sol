// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract IntentManager {
    struct Intent {
        address token;
        address recipient;
        uint256 amount;
        uint256 frequency;
        uint256 nextExecution;
        bool active;
    }

    mapping(address => Intent[]) public userIntents;
    address public multiSigWalletAddress;

    event IntentCreated(
        address indexed user,
        uint256 indexed intentId,
        address token,
        address recipient,
        uint256 amount,
        uint256 frequency,
        uint256 nextExecution
    );
    event IntentExecuted(
        address indexed user,
        uint256 indexed intentId,
        uint256 timestamp
    );
    event IntentCancelled(address indexed user, uint256 indexed intentId);

    modifier onlyMultiSig() {
        require(msg.sender == multiSigWalletAddress, "Only MultiSigWallet can execute");
        _;
    }

    constructor(address _multiSigWalletAddress) {
        multiSigWalletAddress = _multiSigWalletAddress;
    }

    function createIntent(
        address token,
        address recipient,
        uint256 amount,
        uint256 frequency,
        uint256 startTime
    ) external {
        require(frequency > 0, "Frequency must be greater than zero");
        require(startTime >= block.timestamp, "Start time must be in the future");

        Intent memory newIntent = Intent({
            token: token,
            recipient: recipient,
            amount: amount,
            frequency: frequency,
            nextExecution: startTime,
            active: true
        });

        userIntents[msg.sender].push(newIntent);
        uint256 intentId = userIntents[msg.sender].length - 1;

        emit IntentCreated(
            msg.sender,
            intentId,
            token,
            recipient,
            amount,
            frequency,
            startTime
        );
    }

    function executeIntent(address user, uint256 intentId) external onlyMultiSig {
        Intent storage intent = userIntents[user][intentId];
        require(intent.active, "Intent is not active");
        require(
            block.timestamp >= intent.nextExecution,
            "Intent execution time not reached"
        );

        // Transfer the tokens
        IERC20(intent.token).transferFrom(
            user,
            intent.recipient,
            intent.amount
        );

        // Update next execution time
        intent.nextExecution += intent.frequency;

        emit IntentExecuted(user, intentId, block.timestamp);
    }

    function cancelIntent(uint256 intentId) external {
        Intent storage intent = userIntents[msg.sender][intentId];
        require(intent.active, "Intent is already inactive");
        intent.active = false;

        emit IntentCancelled(msg.sender, intentId);
    }
}
