const _ = require('lodash');
const path = require('path');
const XLSX = require('xlsx');

const DigiAssets = artifacts.require("DigiAssets");

module.exports = async function(callback) {
	// Get network
	let network = 'development';
	process.argv.forEach((arg, index) => {
		if(arg === '--network'){
			network = process.argv[(index+1)];
		}
	});

	// Check network.
	if(network === 'live'){
	}else if (network === 'rinkeby' || network === 'development'){
	}

	// Settings
	const metadata = {
		digiAssetsSheet: path.resolve(__dirname, './DigiAssets.xlsx'),
	}

	// Sheets
	const digiAssetsSheets = {};

	const workBook = XLSX.readFile(metadata.digiAssetsSheet);
	const sheetNames = workBook.SheetNames;

	sheetNames.forEach(function(k) {
		const workSheet = workBook.Sheets[k];
		const headers = {};
		const data = [];

		for(z in workSheet) {
			if(z[0] === '!') continue;
			
			let tt = 0;
			for (let i = 0; i < z.length; i++) {
				if (!isNaN(z[i])) {
					tt = i;
					break;
				}
			};

			const col = z.substring(0, tt);
			const row = parseInt(z.substring(tt));
			const value = workSheet[z].v;

			//store header names
			if(row == 1 && value) {
				headers[col] = value;
				continue;
			}

			if(!data[row]) data[row]={};

			data[row][headers[col]] = value;
		}

		// drop those first two rows which are empty
		data.shift();
		data.shift();

		// drop header row
		data.shift();

		digiAssetsSheets[k] = data;
	});

	// console.debug(digiAssetsSheets);

	const ids = [];
	const categories = [];
	const rarities = [];
	const prices = [];
	const limits = [];

	const key = _.keys(digiAssetsSheets)[0];
	const assets = digiAssetsSheets[key];

	for (let i = 0; i < assets.length; i++) {
		const asset = assets[i];

		console.debug(asset);

		ids.push(Number(asset.ID));
		categories.push(Number(asset.Category));
		rarities.push(Number(asset.Rarity));
		prices.push(web3.utils.toWei((asset.MintPrice).toString(), 'ether'));
		limits.push(Number(asset.MintAmount));
	}

	// console.debug(ids);
	// console.debug(categories);
	// console.debug(rarities);
	// console.debug(prices);
	// console.debug(limits);
	
	// Main
	return DigiAssets.deployed().then(instance => {
			console.log(`Contract instance address:`, instance.address);

			// gasUsed: 1326880

			// Set Inventory
			return instance.setInventory(ids, categories, rarities, prices, limits);
		})
		.then(result => {
			console.log(`Call contract result:`, result);

			callback();
		})
		.catch(err => {
			console.debug(err);
			callback(err);
		});
}