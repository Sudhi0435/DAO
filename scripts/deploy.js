// deploy.js
const { ethers } = require("hardhat");
const fs = require("fs");

async function main() {
    // Get the deployer's account
    const [deployer] = await ethers.getSigners();
    
    // Your address that will be the admin
    const adminAddress = deployer.address;

    console.log(`Deploying contracts with the account: ${deployer.address}`);
    console.log(`Setting admin rights to: ${adminAddress}`);

    // Deploy the GovToken contract with your address as the initial owner
    const govToken = await ethers.deployContract("GovToken", [adminAddress]);
    await govToken.waitForDeployment();

    console.log(`GovToken deployed to: ${govToken.target}`);

    // Deploy the TimeLock contract with your address as admin
    const timeLock = await ethers.deployContract("TimeLock", [0, [adminAddress], [adminAddress], adminAddress]);
    await timeLock.waitForDeployment();

    console.log(`TimeLock deployed to: ${timeLock.target}`);

    // Deploy the Cert contract
    const cert = await ethers.deployContract("Cert", [timeLock.target]);
    await cert.waitForDeployment();

    console.log(`Cert deployed to: ${cert.target}`);

    // Deploy the MyGovernor contract
    const myGovernor = await ethers.deployContract("MyGovernor", [govToken.target, timeLock.target]);
    await myGovernor.waitForDeployment();

    console.log(`MyGovernor deployed to: ${myGovernor.target}`);

    // Delegate votes to your address
    const transactionResponse = await govToken.delegate(adminAddress);
    await transactionResponse.wait(1);

    // Get the role identifiers
    const PROPOSER_ROLE = await timeLock.PROPOSER_ROLE();
    const EXECUTOR_ROLE = await timeLock.EXECUTOR_ROLE();

    // Grant roles to the Governor contract
    await timeLock.grantRole(PROPOSER_ROLE, myGovernor.target);
    await timeLock.grantRole(EXECUTOR_ROLE, myGovernor.target);

    // Save the contract addresses to a JSON file
    saveAddresses({
        GovToken: govToken.target,
        TimeLock: timeLock.target,
        Cert: cert.target,
        MyGovernor: myGovernor.target
    });
}

function saveAddresses(addresses) {
    const data = JSON.stringify(addresses, null, 2);
    fs.writeFileSync('seoplia-address.json', data);
}

// Execute the main function
main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });