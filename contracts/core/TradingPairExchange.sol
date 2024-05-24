// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity =0.8.17;

import "./interfaces/ITradingPairExchange.sol";
import "./interfaces/IERC20.sol";
import "./LiquidityTokenERC20.sol";
import "./libraries/Math.sol";
import "./interfaces/IFactory.sol";
import "hardhat/console.sol";

contract TradingPairExchange is ITradingPairExchange, LiquidityTokenERC20 {
    uint256 public constant MINIMUM_LIQUIDITY = 10 ** 3;

    address public factoryAddr;
    address public tokenA;
    address public tokenB;

    uint112 private reserve0;
    uint112 private reserve1; // uses single storage slot to save on gas
    uint32 private blockTimestampLast;

    uint256 public kLast; // reserve0 * reserve1, as of immediately after the most recent liquidity event
    uint256 private unlocked = 1;

    event Mint(address indexed sender, uint256 amount0, uint256 amount1);

    modifier lock() {
        require(unlocked == 1, "DEX: LOCKED");
        unlocked = 0;
        _;
        unlocked = 1;
    }

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

    function _mintFee(uint112 _reserve0, uint112 _reserve1) private returns (bool feeOn) {
        address feeTo = IFactory(factoryAddr).feeTo();
        feeOn = feeTo != address(0);
        // console.log("------ inside _mintFee ------");

        uint256 _kLast = kLast; // gas savings

        if (feeOn) {
            if (_kLast != 0) {
                // console.log("------ inside _kLast ------");
                uint256 rootK = Math.sqrt(Math.mul(_reserve0, _reserve1)); // calculate the sqrt of the product of the reserves
                uint256 rootKLast = Math.sqrt(_kLast); // calculate the sqrt of the last reserves

                if (rootK > rootKLast) {
                    // console.log("------ inside rootK > rootKLast ------");
                    uint256 numerator = totalSupply * (rootK - rootKLast);
                    uint256 denominator = (rootK * 5) + rootKLast; // 5 is the fee percentage
                    uint256 liquidity = numerator / denominator;
                    if (liquidity > 0) _mint(feeTo, liquidity); // mint the fee to the feeTo address
                }
            }
        } else if (_kLast != 0) {
            kLast = 0;
        }
    }

    function mint(address to) external lock returns (uint256 liquidity) {
        (uint112 _reserve0, uint112 _reserve1,) = getReserves();
        uint256 balance0 = IERC20(tokenA).balanceOf(address(this));
        uint256 balance1 = IERC20(tokenB).balanceOf(address(this));
        uint256 amount0 = balance0 - _reserve0;
        uint256 amount1 = balance1 - _reserve1;

        bool feeOn = _mintFee(_reserve0, _reserve1);

        uint256 _totalSupply = totalSupply; // gas savings
        if (_totalSupply == 0) {
            liquidity = Math.sqrt(amount0 * amount1) - MINIMUM_LIQUIDITY; // Geometric Mean of amount0 and amount1
            // console.log("---- liquidity tokens minted ----", liquidity);
            _mint(address(0), MINIMUM_LIQUIDITY);
        } else {
            liquidity = Math.min((amount0 * _totalSupply) / reserve0, (amount1 * _totalSupply) / reserve1);
            // console.log("liquidity min ", liquidity);
        }

        require(liquidity > 0, "DEX: INSUFFICIENT_LIQUIDITY_MINTED");

        _mint(to, liquidity);
        _update(balance0, balance1);

        if (feeOn) kLast = Math.mul(_reserve0, _reserve1); // reserve0 and reserve1 are up-to-date

        emit Mint(msg.sender, amount0, amount1);
    }

    function burn(address to) external lock returns (uint256 amountASent, uint256 amountBSent) {
        (uint112 _reserve0, uint112 _reserve1,) = getReserves();
        address _token0 = tokenA;
        address _token1 = tokenB;
        uint256 balance0 = IERC20(_token0).balanceOf(address(this));
        uint256 balance1 = IERC20(_token1).balanceOf(address(this));
        uint256 liquidity = balanceOf[address(this)];

        bool feeOn = _mintFee(_reserve0, _reserve1);
        uint256 _totalSupply = totalSupply; // cache variable for gas savings
        amountASent = (liquidity * balance0) / _totalSupply; // using balance0 and balance1 ensures the ratio is preserved
    }

    function transferFrom(address from, address to, uint256 value)
        public
        override(ITradingPairExchange, LiquidityTokenERC20)
        returns (bool)
    {
        (bool transferSuccess) = super.transferFrom(from, to, value);
        return transferSuccess;
    }
}
