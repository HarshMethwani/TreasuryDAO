// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

contract MultiSigWallet {
    address[] public owners;
    uint256 public requiredConfirmations;
    uint256 public transactionCount;
    uint256 public thresholdAmount;

    struct Transaction {
        address to;
        uint256 value;
        bytes data;
        bool executed;
        uint256 confirmations;
    }

    mapping(uint256 => mapping(address => bool)) public confirmations;
    mapping(uint256 => Transaction) public transactions;

    event Deposit(address indexed sender, uint256 amount);
    event TransactionCreated(
        uint256 indexed txId,
        address indexed creator,
        address to,
        uint256 value,
        bytes data
    );
    event TransactionConfirmed(uint256 indexed txId, address indexed owner);
    event TransactionExecuted(uint256 indexed txId);

    modifier onlyOwner() {
        require(isOwner(msg.sender), "Not owner");
        _;
    }

    modifier txExists(uint256 txId) {
        require(transactions[txId].to != address(0), "Transaction does not exist");
        _;
    }

    modifier notExecuted(uint256 txId) {
        require(!transactions[txId].executed, "Transaction already executed");
        _;
    }

    modifier notConfirmed(uint256 txId) {
        require(!confirmations[txId][msg.sender], "Transaction already confirmed");
        _;
    }

    constructor(
        address[] memory _owners,
        uint256 _requiredConfirmations,
        uint256 _thresholdAmount
    ) {
        require(_owners.length >= _requiredConfirmations, "Invalid parameters");
        owners = _owners;
        requiredConfirmations = _requiredConfirmations;
        thresholdAmount = _thresholdAmount;
    }

    receive() external payable {
        emit Deposit(msg.sender, msg.value);
    }

    function submitTransaction(
        address to,
        uint256 value,
        bytes memory data
    ) public onlyOwner {
        uint256 txId = transactionCount;
        transactions[txId] = Transaction({
            to: to,
            value: value,
            data: data,
            executed: false,
            confirmations: 0
        });
        transactionCount += 1;

        emit TransactionCreated(txId, msg.sender, to, value, data);
    }

    function confirmTransaction(uint256 txId)
        public
        onlyOwner
        txExists(txId)
        notExecuted(txId)
        notConfirmed(txId)
    {
        confirmations[txId][msg.sender] = true;
        transactions[txId].confirmations += 1;

        emit TransactionConfirmed(txId, msg.sender);

        if (transactions[txId].confirmations >= requiredConfirmations) {
            executeTransaction(txId);
        }
    }

    function executeTransaction(uint256 txId)
        internal
        txExists(txId)
        notExecuted(txId)
    {
        Transaction storage txn = transactions[txId];
        require(
            txn.value >= thresholdAmount,
            "Transaction value below threshold"
        );

        (bool success, ) = txn.to.call{value: txn.value}(txn.data);
        require(success, "Transaction failed");

        txn.executed = true;

        emit TransactionExecuted(txId);
    }

    function submitExecuteIntentTransaction(
        address intentManager,
        address user,
        uint256 intentId
    ) public onlyOwner {
        bytes memory data = abi.encodeWithSignature(
            "executeIntent(address,uint256)",
            user,
            intentId
        );
        submitTransaction(intentManager, 0, data);
    }

    function isOwner(address account) internal view returns (bool) {
        for (uint256 i; i < owners.length; i++) {
            if (owners[i] == account) return true;
        }
        return false;
    }
}
