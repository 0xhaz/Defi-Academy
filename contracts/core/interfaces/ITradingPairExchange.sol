// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity =0.8.17;

interface ITradingPairExchange {
    function initialize(address, address) external;
    function getReserves() external view returns (uint112 _reserve0, uint112 _reserve1);
}
