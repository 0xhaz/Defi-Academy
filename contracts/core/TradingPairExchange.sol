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

    /// uint112 - 1 storage slot is 256 bits (32 bytes), so the reserve0 and reserve1 variables are packed into a single storage slot
    function getReserves() external view returns (uint112 _reserve0, uint112 _reserve1) {
        _reserve0 = reserve0;
        _reserve1 = reserve1;
    }
}
