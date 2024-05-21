// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity =0.8.17;

interface IFactory {
    function getTradingPair(address tokenA, address tokenB) external view returns (address pair);
    function createTradingPair(address tokenA, address tokenB) external returns (address pair);
    function feeTo() external view returns (address);
}
