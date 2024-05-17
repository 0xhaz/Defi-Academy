const { expect } = require("chai");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { ethers } = require("hardhat");

describe("Router contract", () => {
  async function deployRouterFixture() {
    // /* AAVE/DAI, 1 AAVE = $56 USD, 1 DAI = $1 USD */
    // const aaveERC20Token = "0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9";
    // const daiERC20Token = "0x6B175474E89094C44Da98b954EedeAC495271d0F";

    const amountADesired = ethers.utils.parseUnits("1", 18); // 1 AAVE
    const amountBDesired = ethers.utils.parseUnits("56", 18); // 56 DAI
    const amountAMin = ethers.utils.parseUnits("0.99", 18); // 0.99 AAVE (1% slippage)
    const amountBMin = ethers.utils.parseUnits("55.44", 18); // 55.44 DAI (1% slippage)

    const [deployer, liquidityProvider] = await ethers.getSigners();

    const FactoryContract = await ethers.getContractFactory("Factory");
    const factory = await FactoryContract.deploy(deployer.address);
    const factoryObj = await factory.deployed();

    const RouterContract = await ethers.getContractFactory("Router");
    const deployedRouter = await RouterContract.deploy(factoryObj.address);
    await deployedRouter.deployed();

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

  describe("Deposit Liquidity", () => {
    describe("Should only allow a deposit of two ERC20 tokens of equal value", () => {
      it("should deposit amountADesired and amountBDesired for a new liquidity pool", async () => {
        const {
          aaveToken,
          daiToken,
          amountADesired,
          amountBDesired,
          amountAMin,
          amountBMin,
          router,
          liquidityProvider,
        } = await loadFixture(deployRouterFixture);

        const { amountA, amountB } = await router.callStatic.depositLiquidity(
          aaveToken.address,
          daiToken.address,
          amountADesired,
          amountBDesired,
          amountAMin,
          amountBMin,
          liquidityProvider.address
        );

        const formattedAmountA = ethers.utils.formatUnits(amountA);
        const formattedAmountB = ethers.utils.formatUnits(amountB);
        const formattedAmountADesired =
          ethers.utils.formatUnits(amountADesired);
        const formattedAmountBDesired =
          ethers.utils.formatUnits(amountBDesired);

        expect(formattedAmountA).to.equal(formattedAmountADesired);
        expect(formattedAmountB).to.equal(formattedAmountBDesired);
      });

      /// only - run only this test
      it("should deposit the optimal ratio of tokens for an existing pool", async () => {
        const {
          aaveToken,
          daiToken,
          amountADesired,
          amountBDesired,
          amountAMin,
          amountBMin,
          router,
          liquidityProvider,
        } = await loadFixture(deployRouterFixture);

        await router.depositLiquidity(
          aaveToken.address,
          daiToken.address,
          amountADesired,
          amountBDesired,
          amountAMin,
          amountBMin,
          liquidityProvider.address
        );

        const faultyAmountADesired = ethers.utils.parseUnits("10", 18);
        const faultyAmountBDesired = ethers.utils.parseUnits("56", 18);

        const { amountA, amountB } = await router.callStatic.depositLiquidity(
          aaveToken.address,
          daiToken.address,
          faultyAmountADesired,
          faultyAmountBDesired,
          amountAMin,
          amountBMin,
          liquidityProvider.address
        );

        const formattedAmountA = ethers.utils.formatUnits(amountA);
        const formattedAmountB = ethers.utils.formatUnits(amountB);
        const formattedAmountADesired =
          ethers.utils.formatUnits(amountADesired);
        const formattedAmountBDesired =
          ethers.utils.formatUnits(amountBDesired);

        expect(formattedAmountA).to.equal(formattedAmountADesired);
        expect(formattedAmountB).to.equal(formattedAmountBDesired);
      });
    });

    describe("Should mint the correct number of liquidity tokens", () => {
      it("for a new liquidity pool", async () => {
        const {
          aaveToken,
          daiToken,
          amountADesired,
          amountBDesired,
          amountAMin,
          amountBMin,
          router,
          liquidityProvider,
        } = await loadFixture(deployRouterFixture);

        const { amountA, amountB } = await router.callStatic.depositLiquidity(
          aaveToken.address,
          daiToken.address,
          amountADesired,
          amountBDesired,
          amountAMin,
          amountBMin,
          liquidityProvider.address
        );

        const geometricMean = null; // Calculate the geometric mean of amountA and amountB
        expect(liquidity).to.equal(geometricMean);
      });
    });
  });
});
