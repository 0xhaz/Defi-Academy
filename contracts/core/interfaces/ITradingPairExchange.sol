// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity =0.8.17;

interface ITradingPairExchange {
    function initialize(address, address) external;
    function getReserves() external view returns (uint112 _reserve0, uint112 _reserve1, uint32 _blockTimestampLast);
    function mint(address to) external returns (uint256 liquidity);
    function burn(address to) external returns (uint256 amount0, uint256 amount1);
    function transferFrom(address from, address to, uint256 value) external returns (bool);
}
