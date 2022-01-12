const _ = require('lodash');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const https = require('https');
const util = require("util");
const stream = require("stream");
const pipeline = util.promisify(stream.pipeline);
const XLSX = require('xlsx');

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
		cdnBaseURL = 'https://cdn.digination.io';
	}else if (network === 'rinkeby' || network === 'development'){
		cdnBaseURL = 'https://cdn.digination.xyz';
	}

	// Settings
	const metadata = {
		cdn_base_url: cdnBaseURL,
		digiAssetsSheet: path.resolve(__dirname, './DigiAssets.xlsx'),
		cache_dir: path.resolve(__dirname, `metadata_cache`),
		resource_api_url: 'http://172.17.72.20:8080/equip',

		category: {
			1: 'Wearables',
			2: 'Props',
			2: 'Collectibles',
		},

		rarity: {
			1: 'N',
			2: 'R',
			3: 'SR',
			4: 'SSR',
			5: 'UR',
		}
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


	const _downloadFile = async function(url, filename){
		// url = url.replace(/(http:\/\/[0-9]{1,3}.[0-9]{1,3}.[0-9]{1,3}.[0-9]{1,3}:[0-9]{1,5})/g, this.settings.resource_api_url);

		try {
			const resp = await axios.get(url, {responseType: 'stream'});
			const filepath = `${metadata.cache_dir}/${filename}`;
			
			await pipeline(resp.data, fs.createWriteStream(filepath));
		} catch (error) {
			console.error(`donwload ${url} pipeline failed`, error);
		}
	}

	const _getResourceFiles = async function(tokenId, tokenIdHex){
		return axios.post(`${metadata.resource_api_url}`, {
			tokenId: tokenId,
		}).then(async (result) => {
			await _downloadFile(result.data.image_url, `${tokenIdHex}.png`);
			await _downloadFile(result.data.animation_url, `${tokenIdHex}.glb`);

			return result.data;
		})
		.catch(err => {
			console.error(`Failed to generate resource, ${err}`);
			return Promise.reject(`Failed to generate resource, ${err}`);
		});
	}


	// Main
	const key = _.keys(digiAssetsSheets)[0];
	const assets = digiAssetsSheets[key];

	for (let i = 0; i < assets.length; i++) {
		const asset = assets[i];

		const tokenId = Number(asset.ID);
		const tokenIdHex = web3.utils.padLeft(tokenId.toString(16), 64, '0');

		await _getResourceFiles(tokenId, tokenIdHex);

		const traits = [
			{
				"trait_type": "Category", 
				"value": metadata.category[Number(asset.Category)]
			},
			{
				"trait_type": "Rarity", 
				"value": metadata.rarity[Number(asset.Rarity)]
			}
		];
		

		const metadataContent = {
			name: `${asset.ShowName}`,
			description: `${asset.Description}`,
			image: `${metadata.cdn_base_url}/metadata/ethereum/digiassets/${tokenIdHex}.png`,
			animation_url: `${metadata.cdn_base_url}/metadata/ethereum/digiassets/${tokenIdHex}.glb`,
			attributes: traits,
		};

		const filepath = `${metadata.cache_dir}/${tokenIdHex}.json`;

		try {
			fs.writeFileSync(filepath, JSON.stringify(metadataContent, undefined, 2), { flag: 'w+' });
			console.info(`tokenId ${tokenId} metadata file created successfully.`);
		} catch (err) {
			console.error(`Failed to create metadata file, ${err}`);
		}
	}

	callback();
}