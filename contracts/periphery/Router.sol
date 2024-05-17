// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity =0.8.17;

import "./interfaces/IRouter.sol";
import "../core/interfaces/IFactory.sol";
import "./libraries/DEXLibrary.sol";
import "./libraries/TransferHelper.sol";
import "../core/interfaces/ITradingPairExchange.sol";
import "hardhat/console.sol";

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
        uint256 amountBMin,
        address to
    ) external returns (uint256 amountA, uint256 amountB, uint256 liquidity) {
        (amountA, amountB) = _depositLiquidity(tokenA, tokenB, amountADesired, amountBDesired, amountAMin, amountBMin);

        address pair = DEXLibrary.pairFor(factoryAddr, tokenA, tokenB);
        TransferHelper.safeTransferFrom(tokenA, msg.sender, pair, amountA);
        TransferHelper.safeTransferFrom(tokenB, msg.sender, pair, amountB);
        liquidity = ITradingPairExchange(pair).mint(to);
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

        // console.log("---------------------------------");
        // console.log(" reserveA ", reserveA);
        // console.log(" reserveB ", reserveB);

        if (reserveA == 0 && reserveB == 0) {
            (amountA, amountB) = (amountADesired, amountBDesired);
        } else {
            uint256 amountBOptimal = DEXLibrary.quote(amountADesired, reserveA, reserveB);
            if (amountBOptimal <= amountBDesired) {
                require(amountBOptimal >= amountBMin, "DEXLibrary: INSUFFICIENT_B_AMOUNT");
                (amountA, amountB) = (amountADesired, amountBOptimal);
            } else {
                uint256 amountAOptimal = DEXLibrary.quote(amountBDesired, reserveB, reserveA);
                assert(amountAOptimal <= amountADesired);
                require(amountAOptimal >= amountAMin, "DEXLibrary: INSUFFICIENT_A_AMOUNT");
                (amountA, amountB) = (amountAOptimal, amountBDesired);
            }
        }
    }
}
