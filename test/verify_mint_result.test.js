const { assert } = require('chai');
const {
	BN,           // Big Number support
	constants,    // Common constants, like the zero address and largest integers
	expectEvent,  // Assertions for emitted events
	expectRevert, // Assertions for transactions that should fail
} = require('@openzeppelin/test-helpers');

const Alpha = artifacts.require("Alpha");
const DigiAssets = artifacts.require("DigiAssets");

contract("DigiAssets/mint:result", async accounts => {
	const [deployer, buyer] = accounts;

	before(async function () {
		this.digiAssets = await DigiAssets.deployed();
		this.alpha = await Alpha.deployed();

		// Set Alpha Token
		await this.alpha.transfer(buyer, web3.utils.toWei((10000).toString(), 'ether'));
		await this.alpha.approve(this.digiAssets.address, web3.utils.toWei('100'), {from: buyer})

		// Set Inventory
		const items = [
			{id: 31279, category:1, price: 100, limit: 1},
			{id: 31282, category:1, price: 50, limit: 1},
			{id: 31386, category:1, price: 80, limit: 5},
			{id: 31390, category:1, price: 10, limit: 10},
		];

		const ids = [];
		const categories = [];
		const prices = [];
		const limits = [];

		for (let i = 0; i < items.length; i++) {
			const item = items[i];

			ids.push(item.id);
			categories.push(item.category);
			prices.push(web3.utils.toWei((item.price).toString(), 'ether'));
			limits.push(item.limit);
		}

		await this.digiAssets.setInventory(ids, categories, prices, limits);
	});

	it(`mint`, async function () {
		const id = 31282;
		const amount = 1;

		const mint = await this.digiAssets.mint(buyer, id, amount, '0x0', {from: buyer});

		expectEvent(mint, 'TransferSingle', {
			operator: buyer,
			from: constants.ZERO_ADDRESS,
			to: buyer,
			id: new BN(id),
			value: new BN(amount),
		});
	});

});
