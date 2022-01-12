const { deployProxy } = require('@openzeppelin/truffle-upgrades');

const DigiAssets = artifacts.require("DigiAssets");
const Alpha = artifacts.require("Alpha");

module.exports = async function(deployer, network) {
	let baseTokenURI = '';
	let alphaTokenContract = '';

	if (network === 'live'){
		baseTokenURI = 'https://cdn.digination.io/metadata/ethereum/digiassets/{id}.json';
		alphaTokenContract = '0xd5f518b4e15f46b4ee9f525b368c85edbfc4a883';
	}else if (network === 'rinkeby'){
		baseTokenURI = 'https://cdn.digination.xyz/metadata/ethereum/digiassets/{id}.json';
		alphaTokenContract = '0xe7ef3ac8189510068173e4c860efe6ab6a76ac68';
	}else if (network === 'development'){
		baseTokenURI = 'https://cdn.digination.xyz/metadata/ethereum/digiassets/{id}.json';
		alphaTokenContract = Alpha.address;
	}

	await deployProxy(
		DigiAssets,
		[
			baseTokenURI,
			alphaTokenContract,
		],
		{
			deployer,
			initializer: 'initialize'
		}
	);
};
