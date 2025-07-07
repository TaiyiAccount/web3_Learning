const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("LearnToken", function () {
    let token;
    let owner;
    let addr1;
    let addr2;
    let addrs;

    beforeEach(async function () {
        [owner, addr1, addr2, ...addrs] = await ethers.getSigners();
        const LearnToken = await ethers.getContractAt("LearnToken" );
        token = await LearnToken.deploy(ethers.utils.parseEther("1000"));
        await token.deployed();
    });

    describe("Deployment", function () {
        it("Should set the right owner", async function () {
            expect(await learnToken.owner()).to.equal(owner.address);
        });
    });
});