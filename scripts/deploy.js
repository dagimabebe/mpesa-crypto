
async function main() {
  const [deployer] = await ethers.getSigners();
  
  console.log("Deploying contracts with the account:", deployer.address);
  
  const MPesaCryptoBridge = await ethers.getContractFactory("MPesaCryptoBridge");
  const tokenAddress = "0xYourTokenAddress"; // e.g., DAI, USDC
  const bridge = await MPesaCryptoBridge.deploy(tokenAddress);
  
  await bridge.deployed();
  
  console.log("Contract deployed to:", bridge.address);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
