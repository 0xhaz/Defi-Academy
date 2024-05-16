// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity =0.8.17;

interface IRouter {
    function depositLiquidity(
        address tokenA,
        address tokenB,
        uint256 amountADesired,
        uint256 amountBDesired,
        uint256 amountAMin,
        uint256 amountBMin,
        address to
    ) external returns (uint256 amountA, uint256 amountB, uint256 liquidity);
}
