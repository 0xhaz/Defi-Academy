const { expect } = require("chai");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { ethers } = require("hardhat");

describe("Router contract", () => {
  async function deployRouterFixture() {
    /* AAVE/DAI, 1 AAVE = $56 USD, 1 DAI = $1 USD */
    const aaveERC20Token = "0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9";
    const daiERC20Token = "0x6B175474E89094C44Da98b954EedeAC495271d0F";

    const amountADesired = ethers.utils.parseUnits("1", 18); // 1 AAVE
    const amountBDesired = ethers.utils.parseUnits("56", 18); // 56 DAI
    const amountAMin = ethers.utils.parseUnits("0.99", 18); // 0.99 AAVE (1% slippage)
    const amountBMin = ethers.utils.parseUnits("55.44", 18); // 55.44 DAI (1% slippage)

    const [deployer] = await ethers.getSigners();

    const FactoryContract = await ethers.getContractFactory("Factory");
    const factory = await FactoryContract.deploy(deployer.address);
    const factoryObj = await factory.deployed();

    const RouterContract = await ethers.getContractFactory("Router");
    const router = await RouterContract.deploy(factoryObj.address);
    await router.deployed();

    return {
      aaveERC20Token,
      daiERC20Token,
      amountADesired,
      amountBDesired,
      amountAMin,
      amountBMin,
      router,
    };
  }

  describe("Deposit Liquidity", () => {
    describe("Should only allow a deposit of two ERC20 tokens of equal value", () => {
      it("should deposit amountADesired and amountBDesired for a new liquidity pool", async () => {
        const {
          aaveERC20Token,
          daiERC20Token,
          amountADesired,
          amountBDesired,
          amountAMin,
          amountBMin,
          router,
        } = await loadFixture(deployRouterFixture);

        const { amountA, amountB } = await router.callStatic.depositLiquidity(
          aaveERC20Token,
          daiERC20Token,
          amountADesired,
          amountBDesired,
          amountAMin,
          amountBMin
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
      it.only("should deposit the optimal ratio of tokens for an existing pool", async () => {
        const {
          aaveERC20Token,
          daiERC20Token,
          amountADesired,
          amountBDesired,
          amountAMin,
          amountBMin,
          router,
        } = await loadFixture(deployRouterFixture);

        await router.callStatic.depositLiquidity(
          aaveERC20Token,
          daiERC20Token,
          amountADesired,
          amountBDesired,
          amountAMin,
          amountBMin
        );

        const { amountA, amountB } = await router.callStatic.depositLiquidity(
          aaveERC20Token,
          daiERC20Token,
          amountADesired,
          amountBDesired,
          amountAMin,
          amountBMin
        );
      });
    });
  });
});
