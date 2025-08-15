// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Capped.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title CustomToken
 * @notice ERC20 with cap, custom decimals, owner minting, plus optional logoUrl + description.
 * @dev Pass human units via UI; the frontend converts with parseUnits(amount, decimals).
 */
contract CustomToken is ERC20Capped, Ownable {
    uint8 private immutable _customDecimals;
    string private _logoUrl;
    string private _description;

    constructor(
        string memory name_,
        string memory symbol_,
        uint8 decimals_,
        uint256 initialSupply_,
        uint256 maxSupply_,
        string memory logoUrl_,
        string memory description_
    )
        ERC20(name_, symbol_)
        ERC20Capped(maxSupply_)
        Ownable(msg.sender)
    {
        _customDecimals = decimals_;
        _logoUrl = logoUrl_;
        _description = description_;
        _mint(msg.sender, initialSupply_);
    }

    function decimals() public view override returns (uint8) { return _customDecimals; }

    function mint(address to, uint256 amount) external onlyOwner { _mint(to, amount); }

    function logoUrl() external view returns (string memory) { return _logoUrl; }

    function description() external view returns (string memory) { return _description; }
}
