// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity =0.8.17;

import "../../core/interfaces/ITradingPairExchange.sol";
import "../../core/TradingPairExchange.sol";
import "hardhat/console.sol";

library DEXLibrary {
    function sortTokens(address tokenA, address tokenB) internal pure returns (address token0, address token1) {
        require(tokenA != tokenB, "DEXLibrary: IDENTICAL_ADDRESSES");
        (token0, token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
        require(token0 != address(0), "DEXLibrary: ZERO_ADDRESS");
    }

    function pairFor(address factory, address tokenA, address tokenB) internal pure returns (address pair) {
        (address token0, address token1) = sortTokens(tokenA, tokenB);

        bytes32 salt = keccak256(abi.encode(token0, token1));
        /// type(TradingPairExchange).creationCode is the bytecode of the TradingPairExchange contract
        bytes memory bytecode = type(TradingPairExchange).creationCode;

        /// precomputed address of the TradingPairExchange contract using the factory, salt, and bytecode
        /// bytes1(0xff) is a constant used to indicate that the address is a contract creation address
        pair = address(uint160(uint256(keccak256(abi.encodePacked(bytes1(0xff), factory, salt, keccak256(bytecode))))));
    }

    function getReserves(address factory, address tokenA, address tokenB)
        internal
        view
        returns (uint256 reserveA, uint256 reserveB)
    {
        (address token0,) = sortTokens(tokenA, tokenB);
        (uint256 reserve0, uint256 reserve1,) = ITradingPairExchange(pairFor(factory, tokenA, tokenB)).getReserves();
        (reserveA, reserveB) = tokenA == token0 ? (reserve0, reserve1) : (reserve1, reserve0);
    }

    function quote(uint256 amountA, uint256 reserveA, uint256 reserveB) internal view returns (uint256 amountB) {
        require(amountA > 0, "DEXLibrary: INSUFFICIENT_AMOUNT");
        require(reserveA > 0 && reserveB > 0, "DEXLibrary: INSUFFICIENT_LIQUIDITY");
        amountB = (amountA * reserveB) / reserveA;
        // console.log("---------------------------------");
        // console.log(" amountA ", amountA);
        // console.log(" reserveB ", reserveB);
        // console.log(" reserveA ", reserveA);
        // console.log(" (amountA * reserveB) ", (amountA * reserveB));
        // console.log(" amountB ", amountB);
        // console.log("---------------------------------");
    }
}
