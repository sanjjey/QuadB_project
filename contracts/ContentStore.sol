// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract ContentStore {
    struct Post {
        string ipfsHash;
        address creator;
        uint256 time;
    }

    Post[] public posts;

    function addPost(string calldata hash) external {
        posts.push(Post(hash, msg.sender, block.timestamp));
    }

    function getAllPosts() external view returns (Post[] memory) {
        return posts;
    }

    function getCount() external view returns (uint256) {
        return posts.length;
    }
}
