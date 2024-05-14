const { expect } = require("chai");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { ethers } = require("hardhat");

describe("Router contract", () => {
  async function deployRouterFixture() {
    /* AAVE/DAI, 1 AAVE = $56 USD, 1 DAI = $1 USD */
    const aaveERC20Token = "0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9";
    const daiERC20Token = "0x6B175474E89094C44Da98b954EedeAC495271d0F";

    const amountADesired = 1; // 1 AAVE
    const amountBDesired = 56; // 56 DAI

    const amountAMin = 0.99;
    const amountBMin = 55.44;

    const [owner] = ethers.getSigners();

    const FactoryContract = await ethers.getContractFactory("Factory", owner);
    const factory = await FactoryContract.deploy(owner.address);
    const factoryAddr = await factory.deployed();

    const RouterContract = await ethers.getContractFactory("Router");
    const router = await RouterContract.deploy(factoryAddr.address);
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
    it("Should only allow a deposit of two ERC20 tokens of equal value", async () => {
      const {
        aaveERC20Token,
        daiERC20Token,
        amountADesired,
        amountBDesired,
        amountAMin,
        amountBMin,
        router,
      } = await loadFixture(deployRouterFixture);

      const { amountA, AmountB } = await router.depositLiquidity(
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
