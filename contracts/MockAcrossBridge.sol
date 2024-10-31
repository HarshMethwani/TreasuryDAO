// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;
interface IERC20 {
    function transferFrom(
        address sender,
        address recipient,
        uint256 amount
    ) external returns (bool);
}

contract MockAcrossBridge {
    function deposit(
        address recipient,
        address token,
        uint256 amount,
        uint256 destinationChainId
    ) external payable {
        // Simulate token transfer to the bridge
        IERC20(token).transferFrom(msg.sender, address(this), amount);
    }

    // Interface for ERC20
}
