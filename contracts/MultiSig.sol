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
    event DepositedEther(address depositor, uint256 amount, uint256 timestamp);
    event DepositedErc20(
        address depositor,
        uint256 amount,
        address TokenAddress,
        uint256 timestamp
    );
    event SubmittedErc20(
        address SubmittedBy,
        address to,
        address TokenAddress,
        uint256 amount,
        uint256 timestamp
    );
    event SubmittedEther(
        address SubmittedBy,
        address to,
        uint256 amount,
        uint256 timestamp
    );
    event Approved(
        address approvedBy,
        Transaction transaction,
        uint256 timestamp
    );
    event Executed(address to, Transaction transaction, uint256 timestamp);
    event AddedOwner(address newOwner, uint256 timestamp);
    event removedOwner(address wasOwner, uint256 timestamp);
    event changedPolicy(uint256 newPolicy, uint256 timestamp);

    //state Variables
    uint256 public requiredApproval;
    bool public paused;
    address[] owners;
    Transaction[] transactions;
    Proposal[] proposals;

    //mapppings
    mapping(address => bool) private isOwner;
    mapping(uint256 => mapping(address => bool)) private confirmedTx;
    mapping(uint256 => mapping(address => bool)) private confirmedProposal;
    mapping(uint256 => OwnerProposal) internal OwnerMap;
    mapping(uint256 => PolicyProposal) internal PolicyMap;
    mapping(uint256 => PauseProposal) internal PauseMap;
    mapping(uint256 => address) internal TokenAddress;

    //enum
    enum Type {
        ERC20,
        Ether
    }
    enum ProposalType {
        RevokeOwner,
        AddNewOwner,
        ChangeRequired,
        pause
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

    struct Proposal {
        address submittedBy;
        ProposalType proposalType;
        uint256 Index;
        bool executed;
        uint256 confirmCount;
    }

    struct OwnerProposal {
        address owner;
        ProposalType proposalType;
    }

    struct PolicyProposal {
        uint256 previousSignRequirement;
        uint256 newRequiredSign;
    }

    struct PauseProposal {
        bool _pause;
    }

    //modifiers
    modifier onlyOwner() {
        require(isOwner[msg.sender], "you are not an owner");
        _;
    }

    modifier txExist(uint256 _txIndex) {
        require(_txIndex < transactions.length, "transaction doesn't exist");
        _;
    }
    modifier notExecuted(uint256 _txIndex) {
        require(!transactions[_txIndex].executed, "Already executed");
        _;
    }
    modifier notconfirmedTx(uint256 _txIndex) {
        require(!confirmedTx[_txIndex][msg.sender], "Already confirmedTx");
        _;
    }

    modifier isPaused() {
        require(!paused, "wallet is paused");
        _;
    }

    //constructor
    constructor(address[] memory _owners, uint256 _required) {
        require(_owners.length > 1, "must be mmore than 1 owner");
        require(
            _owners.length >= _required && _required > 1,
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

    //view functions
    function showOwners() external view returns (address[] memory) {
        return owners;
    }

    function allTxs() external view returns (Transaction[] memory) {
        return transactions;
    }

    function singleTx(
        uint256 _index
    ) external view returns (Transaction memory transaction) {
        return (transactions[_index]);
    }

    function balanceErc20(address ERC20) public view returns (uint256) {
        return IERC20(ERC20).balanceOf(address(this));
    }

    function TokenAddressForsubmittedTx(
        uint256 _txIndex
    ) external view returns (address) {
        return TokenAddress[_txIndex];
    }

    function allProposals() external view returns (Proposal[] memory) {
        return proposals;
    }

    function singleProposal(
        uint256 _index
    ) external view returns (Proposal memory) {
        return proposals[_index];
    }

    function ownerProposalDetails(uint8 _index) external view returns(OwnerProposal memory){
      return OwnerMap[_index];
    }   
    function policyProposalDetails(uint8 _index) external view returns(PolicyProposal memory){
      return PolicyMap[_index];
    }
       function pauseProposalDetails(uint8 _index) external view returns(PauseProposal memory){
      return PauseMap[_index];
    }

    function balanceEther() public view returns (uint) {
        return address(this).balance;
    }

    function checkOwner(address _addr) external view returns (bool) {
        return isOwner[_addr];
    }

    //write functions

    //Submit Proposals and Transactions

    function submitERC20Tx(
        address _to,
        address ERC20,
        uint256 _amount,
        bytes memory _data
    ) external onlyOwner isPaused {
        uint256 balance = balanceErc20(ERC20);

        require(_amount <= balance, "Not enough balance");
        uint256 _txIndex = transactions.length;

        confirmedTx[_txIndex][msg.sender] = true;

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
    ) external onlyOwner isPaused {
        require(_amount < balanceEther(), "Not enough balance");
        uint256 _txIndex = transactions.length;

        confirmedTx[_txIndex][msg.sender] = true;

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

    function submitProposal(
        uint8 _proposalType,
        address _owner,
        uint256 _requiredSign,
        bool _pause
    ) external onlyOwner {
        if (_proposalType == 0) {
            require(!paused, "wallet is paused");
            require(isOwner[_owner], "This address is not an owner");
            uint256 _index = proposals.length;
            proposals.push(
                Proposal({
                    submittedBy: msg.sender,
                    proposalType: ProposalType(_proposalType),
                    Index: _index,
                    executed: false,
                    confirmCount: 1
                })
            );
            OwnerMap[_index] = OwnerProposal({
                owner: _owner,
                proposalType: ProposalType(_proposalType)
            });
            confirmedProposal[_index][msg.sender] = true;
        } else if (_proposalType == 1) {
            require(!paused, "wallet is paused");
            require(_owner != address(0), "Zero address can't be owner");
            uint256 _index = proposals.length;
            proposals.push(
                Proposal({
                    submittedBy: msg.sender,
                    proposalType: ProposalType(_proposalType),
                    Index: _index,
                    executed: false,
                    confirmCount: 1
                })
            );
            OwnerMap[_index] = OwnerProposal({
                owner: _owner,
                proposalType: ProposalType(_proposalType)
            });
            confirmedProposal[_index][msg.sender] = true;
        } else if (_proposalType == 2) {
            require(!paused, "wallet is paused");
            require(
                _requiredSign > 1 && owners.length >= _requiredSign,
                "inavlid policy input"
            );
            uint256 _index = proposals.length;
            proposals.push(
                Proposal({
                    submittedBy: msg.sender,
                    proposalType: ProposalType(2),
                    Index: _index,
                    executed: false,
                    confirmCount: 1
                })
            );
            PolicyMap[_index] = PolicyProposal({
                previousSignRequirement: requiredApproval,
                newRequiredSign: _requiredSign
            });
            confirmedProposal[_index][msg.sender] = true;
        } else if (_proposalType == 3) {
            uint256 _index = proposals.length;
            proposals.push(
                Proposal({
                    submittedBy: msg.sender,
                    proposalType: ProposalType(3),
                    Index: _index,
                    executed: false,
                    confirmCount: 1
                })
            );
            PauseMap[_index] = PauseProposal({_pause: _pause});
            confirmedProposal[_index][msg.sender] = true;
        }
    }

    // Approve transaction and Approve Proposals
    function approveTx(
        uint256 _txIndex
    )
        external
        onlyOwner
        isPaused
        txExist(_txIndex)
        notExecuted(_txIndex)
        notconfirmedTx(_txIndex)
    {
        Transaction storage transaction = transactions[_txIndex];

        confirmedTx[_txIndex][msg.sender] = true;
        transaction.confirmCount += 1;
        if (transaction.confirmCount == requiredApproval) {
            if (
                transaction._type == Type.ERC20 ||
                transaction._type == Type.Ether
            ) {
                executeTx(_txIndex);
            }
        }
        emit Approved(msg.sender, transactions[_txIndex], block.timestamp);
    }

    function approveProposal(uint256 _index) external onlyOwner {
        require(_index < proposals.length, "invalid index");
        require(!proposals[_index].executed, "Already executed");
        require(!confirmedProposal[_index][msg.sender], "Already approved");

        if (proposals[_index].proposalType != ProposalType.pause) {
            require(!paused, "wallet is paused");

            confirmedProposal[_index][msg.sender] = true;
            proposals[_index].confirmCount += 1;

            if (proposals[_index].confirmCount == requiredApproval) {
                executeProposal(_index);
            }
        } else {
            confirmedProposal[_index][msg.sender] = true;
            proposals[_index].confirmCount += 1;

            if (proposals[_index].confirmCount == requiredApproval) {
                executeProposal(_index);
            }
        }
    }

    // Execute transaction and Execute Proposals

    function executeTx(
        uint256 _txIndex
    ) internal notExecuted(_txIndex) isPaused {
        Transaction storage transaction = transactions[_txIndex];

        if (transaction._type == Type.Ether) {
            transaction.executed = true;
            (bool result, ) = transaction.to.call{value: transaction.amount}(
                ""
            );

            require(result, " tx failed ");
        } else {
            address token = TokenAddress[_txIndex];
            transaction.executed = true;

            IERC20(token).transfer(transaction.to, transaction.amount);
        }
        emit Executed(transaction.to, transaction, block.timestamp);
    }

    function executeProposal(uint256 _index) internal onlyOwner {
        require(!proposals[_index].executed, "Already executed");
        require(
            proposals[_index].confirmCount == requiredApproval,
            "Not approved by everyone"
        );

        if (proposals[_index].proposalType == ProposalType(0)) {
            require(!paused, "wallet is paused");

            address ownerToRemove = OwnerMap[_index].owner;
            isOwner[ownerToRemove] = false;
            for (uint256 i; i < proposals.length - 1; ++i) {
                proposals[i] = proposals[i + 1];
            }
            proposals.pop();

            emit removedOwner(ownerToRemove, block.timestamp);
        } else if (proposals[_index].proposalType == ProposalType(1)) {
            require(!paused, "wallet is paused");
            address ownerToAdd = OwnerMap[_index].owner;
            isOwner[ownerToAdd] = true;
            owners.push(ownerToAdd);
            emit AddedOwner(ownerToAdd, block.timestamp);
        } else if (proposals[_index].proposalType == ProposalType(2)) {
            require(!paused, "wallet is paused");
            uint256 policyToChange = PolicyMap[_index].newRequiredSign;
            requiredApproval = policyToChange;
            emit changedPolicy(policyToChange, block.timestamp);
        } else if (proposals[_index].proposalType == ProposalType(3)) {
            paused = PauseMap[_index]._pause;
        }
    }

    receive() external payable {
        emit DepositedEther(msg.sender, msg.value, block.timestamp);
    }
}
