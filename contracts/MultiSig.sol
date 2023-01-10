// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Multisig {
    address[] owners;
    Transaction[] transactions;

    mapping(address => bool) private isOwner;
    mapping(uint256 => mapping(address => bool)) private confirmed;

    uint256 required;
    struct Transaction {
        address to;
        uint256 amount;
        bytes data;
        uint256 txIndex;
        bool executed;
        uint256 confirmCount;
    }

    modifier onlyOwner() {
        require(isOwner[msg.sender], "you are not an ownerFF");
        _;
    }

    modifier txExist(uint256 _txIndex) {
        require(_txIndex < transactions.length, " transaction doesn't exist");
        _;
    }
    modifier notExecuted(uint256 _txIndex) {
        require(!transactions[_txIndex].executed, "Already executed");
        _;
    }
    modifier notConfirmed(uint256 _txIndex) {
        require(!confirmed[_txIndex][msg.sender], "Already confirmed");
        _;
    }

    constructor(address[] memory _owners, uint256 _required) {
        require(_owners.length > 1, "must be mmore than 1 owner");
        require(
            _owners.length >= _required && _required > 0,
            "Invalid require input"
        );
        for (uint256 i = 0; i < _owners.length; i++) {
            address owner = _owners[i];

            require(owner != address(0), "invalid address");
            require(!isOwner[owner], "Owner is already added");

            isOwner[owner] = true;
            owners.push(owner);
        }

        required = _required;
    }

    function submit(
        address _to,
        uint256 _amount,
        bytes calldata _data
    ) external onlyOwner {
        uint256 _txIndex = transactions.length;

        confirmed[_txIndex][msg.sender]= true;

        transactions.push(
            Transaction({
                to: _to,
                amount: _amount,
                data: _data,
                txIndex: _txIndex,
                executed: false,
                confirmCount: 1
            })
        );
    }

    function approve(uint256 _txIndex)
        external
        onlyOwner
        txExist(_txIndex)
        notConfirmed(_txIndex)
        notExecuted(_txIndex)
    {
        confirmed[_txIndex][msg.sender] = true;
        transactions[_txIndex].confirmCount += 1;
        if (transactions[_txIndex].confirmCount == required) {
            execute(_txIndex);
        }
    }

    function execute(uint256 _txIndex) internal notExecuted(_txIndex) {
        Transaction storage transaction = transactions[_txIndex];

        transaction.executed = true;
        (bool result, ) = transaction.to.call{value: transaction.amount}("");

        require(result, " tx failed ");
    }

    function revoke() external {}

    function allTxs() external view returns(Transaction[] memory){
        return transactions;
    }

    function singleTx(uint _index) view external returns(Transaction memory) {
        return transactions[_index];

    }

    receive() external payable {}
}
