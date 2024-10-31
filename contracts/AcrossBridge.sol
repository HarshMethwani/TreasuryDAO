// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

// Interface for the Across Protocol Bridge
interface IAcrossBridge {
    function deposit(
        address recipient,
        address token,
        uint256 amount,
        uint256 destinationChainId
    ) external payable;
}
interface IERC20 {
        function transferFrom(
            address sender,
            address recipient,
            uint256 amount
        ) external returns (bool);

        function approve(address spender, uint256 amount) external returns (bool);
}

contract AcrossBridge {
    IAcrossBridge public acrossBridge;

    event BridgeInitiated(
        address indexed user,
        address indexed token,
        uint256 amount,
        uint256 destinationChainId
    );

    constructor(address _acrossBridge) {
        acrossBridge = IAcrossBridge(_acrossBridge);
    }

    function bridgeTokens(
        address token,
        uint256 amount,
        address recipient,
        uint256 destinationChainId
    ) external payable {
        // Transfer tokens from user to this contract
        IERC20(token).transferFrom(msg.sender, address(this), amount);

        // Approve Across Bridge to spend tokens
        IERC20(token).approve(address(acrossBridge), amount);

        // Initiate the bridge
        acrossBridge.deposit{value: msg.value}(
            recipient,
            token,
            amount,
            destinationChainId
        );

        emit BridgeInitiated(msg.sender, token, amount, destinationChainId);
    }

    
}
