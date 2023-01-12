// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// @title Multisig
/// @author Zartaj
/// @notice this contract serves you as a joint wallet where you and your partners can store your funds
/// safely and can only withdraw if everyone agrees on the withdrawl
/// @dev This is the base contract. Users will create wallet from the factory contract.

contract MultiSig {
    //events
    event DepositedEther(address depositor, uint amount, uint timestamp);
    event DepositedErc20(
        address depositor,
        uint amount,
        address TokenAddress,
        uint timestamp
    );
    event SubmittedErc20(
        address SubmittedBy,
        address to,
        address TokenAddress,
        uint amount,
        uint timestamp
    );
    event SubmittedEther(
        address SubmittedBy,
        address to,
        uint amount,
        uint timestamp
    );
    event Approved(address approvedBy, Transaction transaction, uint timestamp);
    event Executed(address to, Transaction transaction, uint timestamp);

    //state Variables
    uint256 requiredApproval;
    address[] owners;
    Transaction[] transactions;
    //mapppings
    mapping(address => bool) private isOwner;
    mapping(uint256 => mapping(address => bool)) private confirmed;
    mapping(uint => address) internal TokenAddress;

    //enum
    enum Type {
        ERC20,
        Ether
    }

    //structs
    struct Transaction {
        address submittedBy;
        address to;
        uint256 amount;
        bytes data;
        uint256 txIndex;
        bool executed;
        uint256 confirmCount;
        Type _type;
    }

    //modifiers
    modifier onlyOwner() {
        require(isOwner[msg.sender], "you are not an owner");
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

    //constructor
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

        requiredApproval = _required;
    }

    function allTxs() external view returns (Transaction[] memory) {
        return transactions;
    }

    //view functions
    function singleTx(uint _index) external view returns (Transaction memory) {
        return transactions[_index];
    }

    function balanceErc20(address ERC20) public view returns (uint) {
        return IERC20(ERC20).balanceOf(address(this));
    }

    //write functions
    function submitERC20Tx(
        address _to,
        address ERC20,
        uint _amount,
        bytes memory _data
    ) external {
        uint balance = balanceErc20(ERC20);

        require(_amount <= balance, "Not enough balance");
        uint256 _txIndex = transactions.length;

        confirmed[_txIndex][msg.sender] = true;

        transactions.push(
            Transaction({
                submittedBy: msg.sender,
                to: _to,
                amount: _amount,
                data: _data,
                txIndex: _txIndex,
                executed: false,
                confirmCount: 1,
                _type: Type.ERC20
            })
        );

        TokenAddress[_txIndex] = ERC20;

        emit SubmittedErc20(msg.sender, _to, ERC20, _amount, block.timestamp);
    }

    function submitEtherTx(
        address _to,
        uint256 _amount,
        bytes calldata _data
    ) external onlyOwner {
        uint256 _txIndex = transactions.length;

        confirmed[_txIndex][msg.sender] = true;

        transactions.push(
            Transaction({
                submittedBy: msg.sender,
                to: _to,
                amount: _amount,
                data: _data,
                txIndex: _txIndex,
                executed: false,
                confirmCount: 1,
                _type: Type.Ether
            })
        );

        emit SubmittedEther(msg.sender, _to, _amount, block.timestamp);
    }

    function approveTx(
        uint256 _txIndex
    )
        external
        onlyOwner
        txExist(_txIndex)
        notExecuted(_txIndex)
        notConfirmed(_txIndex)
    {
        confirmed[_txIndex][msg.sender] = true;
        transactions[_txIndex].confirmCount += 1;
        if (transactions[_txIndex].confirmCount == requiredApproval) {
            executeTx(_txIndex);
        }
        emit Approved(msg.sender, transactions[_txIndex], block.timestamp);
    }

    function executeTx(uint256 _txIndex) internal notExecuted(_txIndex) {
        Transaction storage transaction = transactions[_txIndex];

        if (transaction._type == Type.Ether) {
            transaction.executed = true;
            (bool result, ) = transaction.to.call{value: transaction.amount}(
                ""
            );

            require(result, " tx failed ");
        } else {
            address token = TokenAddress[_txIndex];

            IERC20(token).transfer(transaction.to, transaction.amount);
        }
        emit Executed(transaction.to, transaction, block.timestamp);
    }

    receive() external payable {
        emit DepositedEther(msg.sender, msg.value, block.timestamp);
    }
}
