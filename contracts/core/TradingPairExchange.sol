// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity =0.8.17;

import "./interfaces/ITradingPairExchange.sol";

contract TradingPairExchange is ITradingPairExchange {
    address public factoryAddr;
    address public tokenA;
    address public tokenB;

    uint112 private reserve0;
    uint112 private reserve1; // uses single storage slot to save on gas

    constructor() {
        factoryAddr = msg.sender;
    }

    function initialize(address _tokenA, address _tokenB) external {
        require(msg.sender == factoryAddr, "DEX: FORBIDDEN");
        tokenA = _tokenA;
        tokenB = _tokenB;
    }
}
