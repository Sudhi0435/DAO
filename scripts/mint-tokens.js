const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Minting tokens with account:", deployer.address);

    // Get the deployed token contract
    const GovToken = await ethers.getContractFactory("GovToken");
    const govToken = GovToken.attach("0xa513E6E4b8f2a923D98304ec87F64353C4D5C853"); // New address from deployment

    // Mint some tokens to the deployer
    const mintAmount = ethers.parseEther("1000"); // 1000 tokens
    await govToken.mint(deployer.address, mintAmount);
    console.log(`Minted ${ethers.formatEther(mintAmount)} tokens to ${deployer.address}`);

    // Get the total supply
    const totalSupply = await govToken.totalSupply();
    console.log(`Total supply is now: ${ethers.formatEther(totalSupply)} tokens`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
