const Alpha = artifacts.require("Alpha");

module.exports = function (deployer) {
  deployer.deploy(Alpha, "ALPHA", "ALPHA", 10240000);
};
