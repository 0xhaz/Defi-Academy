// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity =0.8.17;

library TransferHelper {
    function safeTransferFrom(address token, address from, address to, uint256 value) internal {
        bytes4 SELECTOR = bytes4(keccak256(bytes("transferFrom(address,address,uint256)")));
        (bool success, bytes memory data) = token.call(abi.encodeWithSelector(SELECTOR, from, to, value));
        require(success && (data.length == 0 || abi.decode(data, (bool))), "TransferHelper: TRANSFER_FROM_FAILED");
    }
}
