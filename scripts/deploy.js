const hre = require("hardhat");

async function main() {
  const DCMS = await hre.ethers.getContractFactory("DCMS");
  const dcms = await DCMS.deploy();

  await dcms.deployed();

  console.log("DCMS deployed to:", dcms.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
