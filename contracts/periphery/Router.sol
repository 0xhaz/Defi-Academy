// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity =0.8.17;

import "./interfaces/IRouter.sol";
import "../core/interfaces/IFactory.sol";
import "./libraries/DEXLibrary.sol";

contract Router is IRouter {
    address public immutable factoryAddr;

    constructor(address _factoryAddr) {
        factoryAddr = _factoryAddr;
    }

    function depositLiquidity(
        address tokenA,
        address tokenB,
        uint256 amountADesired,
        uint256 amountBDesired,
        uint256 amountAMin,
        uint256 amountBMin
    ) external returns (uint256 amountA, uint256 amountB) {
        (amountA, amountB) = _depositLiquidity(tokenA, tokenB, amountADesired, amountBDesired, amountAMin, amountBMin);
    }

    function _depositLiquidity(
        address tokenA,
        address tokenB,
        uint256 amountADesired,
        uint256 amountBDesired,
        uint256 amountAMin,
        uint256 amountBMin
    ) internal returns (uint256 amountA, uint256 amountB) {
        if (IFactory(factoryAddr).getTradingPair(tokenA, tokenB) == address(0)) {
            IFactory(factoryAddr).createTradingPair(tokenA, tokenB);
        }

        (uint256 reserveA, uint256 reserveB) = DEXLibrary.getReserves(factoryAddr, tokenA, tokenB);

        if (reserveA == 0 && reserveB == 0) {
            (amountA, amountB) = (amountADesired, amountBDesired);
        }
    }
}
