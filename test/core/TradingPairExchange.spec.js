const { expect } = require("chai");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { ethers } = require("hardhat");
const { bigNumberSqrt } = require("../helpers/math-helpers.js");
const BigNumber = require("bignumber.js");

describe("TradingPairExchange contract", () => {
  async function deployTradingPairexchangeFixture() {
    const amountADesired = ethers.utils.parseUnits("1", 18); // 1 AAVE
    const amountBDesired = ethers.utils.parseUnits("56", 18); // 56 DAI

    const [deployer, liquidityProvider, exchangeDev] =
      await ethers.getSigners();

    const FactoryContract = await ethers.getContractFactory("Factory");
    const factory = await FactoryContract.deploy(deployer.address);
    await factory.deployed();

    const AaveTokenContract = await ethers.getContractFactory("ERC20Basic");
    const aaveToken = await AaveTokenContract.deploy(
      "Aave Stablecoin",
      "AAVE",
      18,
      deployer.address
    );
    await aaveToken.deployed();

    const DAITokenContract = await ethers.getContractFactory("ERC20Basic");
    const daiToken = await DAITokenContract.deploy(
      "Dai Stablecoin",
      "DAI",
      18,
      deployer.address
    );
    await daiToken.deployed();

    await aaveToken.mint(
      liquidityProvider.address,
      ethers.utils.parseUnits("130", 18)
    );

    await daiToken.mint(
      liquidityProvider.address,
      ethers.utils.parseUnits("130", 18)
    );

    // Liquidity Provider approves the router to spend their tokens
    await aaveToken
      .connect(liquidityProvider)
      .approve(deployer.address, ethers.utils.parseUnits("130", 18));
    await daiToken
      .connect(liquidityProvider)
      .approve(deployer.address, ethers.utils.parseUnits("130", 18));

    const tradingPairExchangeContract = await factory.createTradingPair(
      aaveToken.address,
      daiToken.address
    );
    const receipt = await tradingPairExchangeContract.wait();
    const tradingPairExchangeAddress = receipt.events[0].args[2];

    // console.log("Receipt: ", receipt.events[0]);
    // console.log("TradingPairExchange address: ", tradingPairExchangeAddress);

    const tradingPairExchange = await ethers.getContractAt(
      "TradingPairExchange",
      tradingPairExchangeAddress,
      deployer
    );

    return {
      aaveToken,
      daiToken,
      amountADesired,
      amountBDesired,
      factory,
      liquidityProvider,
      exchangeDev,
      tradingPairExchange,
    };
  }

  describe("Minting Liquidity Tokens", () => {
    it("should remit payment of the protocol fee to the exchange developer account", async () => {
      const {
        aaveToken,
        daiToken,
        amountADesired,
        amountBDesired,
        factory,
        liquidityProvider,
        exchangeDev,
        tradingPairExchange,
      } = await loadFixture(deployRouterFixture);

      await factory.setFeeTo(exchangeDev.address);

      await aaveToken.transferFrom(
        liquidityProvider.address,
        tradingPairExchange.address,
        amountADesired
      );

      await daiToken.transferFrom(
        liquidityProvider.address,
        tradingPairExchange.address,
        amountBDesired
      );
      await tradingPairExchange.mint(liquidityProvider.address);

      await aaveToken.transferFrom(
        liquidityProvider.address,
        tradingPairExchange.address,
        ethers.utils.parseUnits(".25", 18)
      );

      await daiToken.transferFrom(
        liquidityProvider.address,
        tradingPairExchange.address,
        ethers.utils.parseUnits("14", 18)
      );
      await tradingPairExchange.mint(liquidityProvider.address);

      await aaveToken.transferFrom(
        liquidityProvider.address,
        tradingPairExchange.address,
        ethers.utils.parseUnits(".25", 18)
      );

      await daiToken.transferFrom(
        liquidityProvider.address,
        tradingPairExchange.address,
        ethers.utils.parseUnits("14", 18)
      );
      await tradingPairExchange.mint(liquidityProvider.address);

      const exchangeDevAccountBalance = await tradingPairExchange.balanceOf(
        exchangeDev.address
      );
      const formattedExchangeDevAccountBalance = ethers.utils.formatUnits(
        exchangeDevAccountBalance,
        18
      );
      expect(formattedExchangeDevAccountBalance).to.equal(
        "0.322556671273615636"
      );
    });

    it("should update a Liquidity Provider's account after a deposit into a new pool", async () => {
      const {
        aaveToken,
        daiToken,
        amountADesired,
        amountBDesired,
        factory,
        liquidityProvider,
        exchangeDev,
        tradingPairExchange,
      } = await loadFixture(deployRouterFixture);

      await aaveToken.transferFrom(
        liquidityProvider.address,
        tradingPairExchange.address,
        amountADesired
      );

      await daiToken.transferFrom(
        liquidityProvider.address,
        tradingPairExchange.address,
        amountBDesired
      );
      await tradingPairExchange.mint(liquidityProvider.address);

      const liquidityProviderAccountBalance =
        await tradingPairExchange.balanceOf(liquidityProvider.address);
      const formattedLiquidityProviderAccountBalance = ethers.utils.formatUnits(
        liquidityProviderAccountBalance,
        18
      );
      expect(formattedLiquidityProviderAccountBalance).to.equal(
        "7.483314773547881771"
      );
    });

    it("should update a Liquidity Provider's account after a deposit into an existing pool", async () => {
      const {
        aaveToken,
        daiToken,
        amountADesired,
        amountBDesired,
        liquidityProvider,
        tradingPairExchange,
      } = await loadFixture(deployRouterFixture);

      await aaveToken.transferFrom(
        liquidityProvider.address,
        tradingPairExchange.address,
        amountADesired
      );

      await daiToken.transferFrom(
        liquidityProvider.address,
        tradingPairExchange.address,
        amountBDesired
      );
      await tradingPairExchange.mint(liquidityProvider.address);

      // Transfer tokens from liquidity provider account to AAVE/DAI pool
      await aaveToken.transferFrom(
        liquidityProvider.address,
        tradingPairExchange.address,
        ethers.utils.parseUnits(".25", 18)
      );

      await daiToken.transferFrom(
        liquidityProvider.address,
        tradingPairExchange.address,
        ethers.utils.parseUnits("14", 18)
      );
      await tradingPairExchange.mint(liquidityProvider.address);

      const liquidityProviderAccountBalance =
        await tradingPairExchange.balanceOf(liquidityProvider.address);
      const formattedLiquidityProviderAccountBalance = ethers.utils.formatUnits(
        liquidityProviderAccountBalance,
        18
      );
      expect(formattedLiquidityProviderAccountBalance).to.equal(
        "9.354143466934852463"
      );
    });
  });

  describe("Burning Liquidity Tokens", () => {
    async function deploySecondaryTradingPairexchangeFixture() {
      const amountADesired = ethers.utils.parseUnits("1", 18); // 1 AAVE
      const amountBDesired = ethers.utils.parseUnits("56", 18); // 56 DAI

      const [deployer, liquidityProvider, exchangeDev] =
        await ethers.getSigners();

      const FactoryContract = await ethers.getContractFactory("Factory");
      const factory = await FactoryContract.deploy(deployer.address);
      await factory.deployed();

      const AaveTokenContract = await ethers.getContractFactory("ERC20Basic");
      const aaveToken = await AaveTokenContract.deploy(
        "Aave Stablecoin",
        "AAVE",
        18,
        deployer.address
      );
      await aaveToken.deployed();

      const DAITokenContract = await ethers.getContractFactory("ERC20Basic");
      const daiToken = await DAITokenContract.deploy(
        "Dai Stablecoin",
        "DAI",
        18,
        deployer.address
      );
      await daiToken.deployed();

      await aaveToken.mint(
        liquidityProvider.address,
        ethers.utils.parseUnits("130", 18)
      );

      await daiToken.mint(
        liquidityProvider.address,
        ethers.utils.parseUnits("130", 18)
      );

      // Liquidity Provider approves the router to spend their tokens
      await aaveToken
        .connect(liquidityProvider)
        .approve(deployer.address, ethers.utils.parseUnits("130", 18));
      await daiToken
        .connect(liquidityProvider)
        .approve(deployer.address, ethers.utils.parseUnits("130", 18));

      const tradingPairExchangeContract = await factory.createTradingPair(
        aaveToken.address,
        daiToken.address
      );
      const receipt = await tradingPairExchangeContract.wait();
      const tradingPairExchangeAddress = receipt.events[0].args[2];

      // console.log("Receipt: ", receipt.events[0]);
      // console.log("TradingPairExchange address: ", tradingPairExchangeAddress);

      const tradingPairExchange = await ethers.getContractAt(
        "TradingPairExchange",
        tradingPairExchangeAddress,
        deployer
      );

      // First depositing the liquidity
      await aaveToken.transferFrom(
        liquidityProvider.address,
        tradingPairExchange.address,
        amountADesired
      );

      await daiToken.transferFrom(
        liquidityProvider.address,
        tradingPairExchange.address,
        amountBDesired
      );

      await tradingPairExchange.mint(liquidityProvider.address);

      return {
        aaveToken,
        daiToken,
        amountADesired,
        amountBDesired,
        factory,
        deployer,
        liquidityProvider,
        exchangeDev,
        tradingPairExchange,
      };
    }
    it("should debit a Liquidity Provider's account after burning Liquidity Tokens", async () => {
      const { deployer, liquidityProvider, tradingPairExchange } =
        await deploySecondaryTradingPairexchangeFixture();

      // Liquidity Provider approve deployer to transfer their liquidity tokens
      await tradingPairExchange
        .connect(liquidityProvider)
        .approve(deployer.address, ethers.utils.parseUnits("5", 18));

      // Transfer Liquidity Tokens to TradingPairExchange
      await tradingPairExchange.transferFrom(
        liquidityProvider.address,
        tradingPairExchange.address,
        ethers.utils.parseUnits("4", 18)
      );

      // Burn Liquidity Tokens
      await tradingPairExchange.burn(liquidityProvider.address);
    });

    it("should send Liquidity Provider ERC20 tokens proportional to amount of Liquidity Tokens burned", async () => {});

    it("should remit payment of the Protocol Fee to the Exchange Developer account", async () => {});
  });
});
