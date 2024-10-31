// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "../lib/permit2/src/interfaces/ISignatureTransfer.sol";

contract GaslessTransfer {
    ISignatureTransfer public immutable permit2;

    event GaslessTransferExecuted(address indexed owner, address indexed recipient, address indexed token, uint256 amount);

    constructor(address _permit2Address) {
        permit2 = ISignatureTransfer(_permit2Address);
    }
    function gaslessTransfer(
        address token,
        uint256 amountAllowed,
        uint256 amountTransfer,
        uint256 nonce,
        uint256 deadline,
        bytes calldata signature,
        address recipient
    ) external {
        permit2.permitTransferFrom(
            ISignatureTransfer.PermitTransferFrom({
                permitted: ISignatureTransfer.TokenPermissions({
                    token: token,
                    amount: amountAllowed
                }),
                nonce: nonce,
                deadline: deadline
            }),
            ISignatureTransfer.SignatureTransferDetails({
                to: recipient, // Directly send to recipient
                requestedAmount: amountTransfer
            }),
            msg.sender, 
            signature // EIP-712 signature from the token owner
        );

        emit GaslessTransferExecuted(msg.sender, recipient, token, amountTransfer);
    }
}
