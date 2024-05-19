// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity =0.8.17;

import "./interfaces/ITradingPairExchange.sol";
import "./interfaces/IERC20.sol";
import "./LiquidityTokenERC20.sol";
import "./libraries/Math.sol";
import "hardhat/console.sol";

contract TradingPairExchange is ITradingPairExchange, LiquidityTokenERC20 {
    uint256 public constant MINIMUM_LIQUIDITY = 10 ** 3;

    address public factoryAddr;
    address public tokenA;
    address public tokenB;

    uint112 private reserve0;
    uint112 private reserve1; // uses single storage slot to save on gas
    uint32 private blockTimestampLast;

    event Mint(address indexed sender, uint256 amount0, uint256 amount1);

    constructor() {
        factoryAddr = msg.sender;
    }

    function initialize(address _tokenA, address _tokenB) external {
        require(msg.sender == factoryAddr, "DEX: FORBIDDEN");
        tokenA = _tokenA;
        tokenB = _tokenB;
    }

    /// uint112 - 1 storage slot is 256 bits (32 bytes), so the reserve0 and reserve1 variables are packed into a single storage slot
    function getReserves() public view returns (uint112 _reserve0, uint112 _reserve1, uint32 _blockTimestampLast) {
        _reserve0 = reserve0;
        _reserve1 = reserve1;
        _blockTimestampLast = blockTimestampLast;
    }

    function _update(uint256 balance0, uint256 balance1) internal {
        require(balance0 <= type(uint112).max && balance1 <= type(uint112).max, "DEX: OVERFLOW");
        reserve0 = uint112(balance0);
        reserve1 = uint112(balance1);

        // store block timestamp to calculate time elapsed since last update
        uint32 blockTimestamp = uint32(block.timestamp % 2 ** 32);
        blockTimestampLast = blockTimestamp;
    }

    function mint(address to) external returns (uint256 liquidity) {
        (uint112 _reserve0, uint112 _reserve1,) = getReserves();
        uint256 balance0 = IERC20(tokenA).balanceOf(address(this));
        uint256 balance1 = IERC20(tokenB).balanceOf(address(this));
        uint256 amount0 = balance0 - _reserve0;
        uint256 amount1 = balance1 - _reserve1;

        uint256 _totalSupply = totalSupply; // gas savings
        if (_totalSupply == 0) {
            liquidity = Math.sqrt(amount0 * amount1) - MINIMUM_LIQUIDITY; // Geometric Mean of amount0 and amount1
            _mint(address(0), MINIMUM_LIQUIDITY);
        } else {
            liquidity = Math.min((amount0 * _totalSupply) / reserve0, (amount1 * _totalSupply) / reserve1);
            // console.log("liquidity min ", liquidity);
        }

        require(liquidity > 0, "DEX: INSUFFICIENT_LIQUIDITY_MINTED");

        _mint(to, liquidity);
        _update(balance0, balance1);
        emit Mint(msg.sender, amount0, amount1);
    }
}
