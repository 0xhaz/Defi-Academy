// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity =0.8.17;

import "./interfaces/IFactory.sol";
import "./TradingPairExchange.sol";
import "./interfaces/ITradingPairExchange.sol";

contract Factory is IFactory {
    address public feeToSetter;

    mapping(address => mapping(address => address)) public getTradingPair;
    address[] public allTradingPairs;

    event TradingPairCreated(address indexed token0, address indexed token1, address pair, uint256);

    constructor(address _feeToSetter) {
        feeToSetter = _feeToSetter;
    }

    function createTradingPair(address tokenA, address tokenB) external returns (address pair) {
        require(tokenA != tokenB, "DEX: IDENTICAL_ADDRESSES");
        (address token0, address token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
        require(tokenA != address(0) && tokenB != address(0), "DEX: ZERO_ADDRESS");
        require(getTradingPair[token0][token1] == address(0), "DEX: PAIR_EXISTS");

        bytes32 salt = keccak256(abi.encode(token0, token1));
        TradingPairExchange tpe = new TradingPairExchange{salt: salt}();
        pair = address(tpe);

        ITradingPairExchange(pair).initialize(token0, token1);
        getTradingPair[tokenA][tokenB] = pair;
        getTradingPair[tokenB][tokenA] = pair;
        allTradingPairs.push(pair);

        emit TradingPairCreated(tokenA, tokenB, pair, allTradingPairs.length);
    }
}