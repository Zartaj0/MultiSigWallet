// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.0;

contract Hello {
    uint a;

    function inc() external {
        if (a < 200) {
            a += 1;
        }
    }

    function dec() external {
        if (a > 100) {
            a += 1;
        }
    }
}

contract Test is Hello{
    function echidna_test_a() external view {
        require(a>100 || a<200);
    }
}
//docker run -it --rm -v C:\Users\Asus\Desktop\solidityCodes\MultiSig\contracts:/code trailofbits/eth-security-toolbox       
//echidna-test Test.sol --contract Test
