const { expect } = require("chai");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { ethers } = require("hardhat");
const { bigNumberSqrt } = require("../helpers/math-helpers.js");
const BigNumber = require("bignumber.js");

describe("Router contract", () => {
  async function deployRouterFixture() {
    const amountADesired = ethers.utils.parseUnits("1", 18); // 1 AAVE
    const amountBDesired = ethers.utils.parseUnits("56", 18); // 56 DAI
    const amountAMin = ethers.utils.parseUnits("0.99", 18); // 0.99 AAVE (1% slippage)
    const amountBMin = ethers.utils.parseUnits("55.44", 18); // 55.44 DAI (1% slippage)

    const [deployer, liquidityProvider] = await ethers.getSigners();

    const FactoryContract = await ethers.getContractFactory("Factory");
    const factory = await FactoryContract.deploy(deployer.address);
    const factoryObj = await factory.deployed();

    // Connect router to signer
    const router = await deployedRouter.connect(liquidityProvider);

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
      .approve(router.address, ethers.utils.parseUnits("130", 18));
    await daiToken
      .connect(liquidityProvider)
      .approve(router.address, ethers.utils.parseUnits("130", 18));

    return {
      aaveToken,
      daiToken,
      amountADesired,
      amountBDesired,
      amountAMin,
      amountBMin,
      router,
      liquidityProvider,
    };
  }

  describe("Minting Liquidity Tokens", () => {
    it("should remit payment of the protocol fee to the exchange developer account", async () => {});
  });
});
