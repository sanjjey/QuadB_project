import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import { create } from "ipfs-http-client";

const ipfs = create("https://ipfs.infura.io:5001/api/v0");
const CONTRACT_ADDRESS = "<DEPLOYED_CONTRACT_ADDRESS>";
const ABI = [
  "function addPost(string calldata hash) external",
  "function getAllPosts() external view returns (tuple(string ipfsHash, address creator, uint256 time)[])"
];

export default function DCMS() {
  const [acct, setAcct] = useState(null);
  const [ttl, setTtl] = useState("");
  const [desc, setDesc] = useState("");
  const [fileUrl, setFileUrl] = useState(null);
  const [metaHash, setMetaHash] = useState(null);
  const [posts, setPosts] = useState([]);
  const [uploading, setUploading] = useState(false);

  const connectWallet = async () => {
    if (window.ethereum) {
      const accts = await window.ethereum.request({ method: "eth_requestAccounts" });
      setAcct(accts[0]);
    } else {
      alert("Please install MetaMask");
    }
  };

  const uploadToIPFS = async (file) => {
    try {
      setUploading(true);
      const added = await ipfs.add(file);
      const url = `https://ipfs.io/ipfs/${added.path}`;
      setFileUrl(url);
      setUploading(false);
    } catch (error) {
      console.error("IPFS Upload Error: ", error);
      setUploading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) uploadToIPFS(file);
  };

  const handleSubmit = async () => {
    if (!ttl || !desc || !fileUrl || !acct) {
      alert("Fill all fields and connect wallet.");
      return;
    }
    const meta = {
      ttl,
      desc,
      fileUrl,
      crt: acct,
      ts: new Date().toISOString()
    };
    const json = JSON.stringify(meta);
    const added = await ipfs.add(json);
    setMetaHash(added.path);

    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
    const tx = await contract.addPost(added.path);
    await tx.wait();
    alert(`Metadata stored on-chain and IPFS: ${added.path}`);
    fetchPosts();
  };

  const fetchPosts = async () => {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);
    const all = await contract.getAllPosts();
    const parsed = await Promise.all(all.map(async (p) => {
      try {
        const res = await fetch(`https://ipfs.io/ipfs/${p.ipfsHash}`);
        const data = await res.json();
        return { ...data, ipfs: p.ipfsHash, crt: p.creator, ts: p.time };
      } catch {
        return { ttl: "Invalid JSON", ipfs: p.ipfsHash, crt: p.creator, ts: p.time };
      }
    }));
    setPosts(parsed);
  };

  useEffect(() => {
    if (window.ethereum) connectWallet();
  }, []);

  return (
    <div className="max-w-xl mx-auto p-6 shadow-xl rounded-2xl bg-white mt-10">
      <h1 className="text-2xl font-bold mb-4">Decentralized CMS for Creators</h1>
      {!acct ? (
        <button onClick={connectWallet} className="px-4 py-2 bg-blue-500 text-white rounded-xl">Connect Wallet</button>
      ) : (
        <p className="text-sm mb-4">Connected: {acct}</p>
      )}

      <input
        type="text"
        placeholder="Title"
        className="w-full border rounded p-2 mb-2"
        value={ttl}
        onChange={(e) => setTtl(e.target.value)}
      />

      <textarea
        placeholder="Description"
        className="w-full border rounded p-2 mb-2"
        value={desc}
        onChange={(e) => setDesc(e.target.value)}
      />

      <input
        type="file"
        className="w-full border rounded p-2 mb-2"
        onChange={handleFileChange}
      />

      {uploading && <p>Uploading file to IPFS...</p>}
      {fileUrl && <p className="text-sm text-green-600">File uploaded: <a href={fileUrl} target="_blank" className="underline">View</a></p>}

      <button
        onClick={handleSubmit}
        className="px-4 py-2 mt-4 bg-green-500 text-white rounded-xl"
      >
        Submit Content
      </button>

      <div className="mt-10">
        <h2 className="text-xl font-semibold mb-2">Submitted Content</h2>
        {posts.map((p, i) => (
          <div key={i} className="border p-3 rounded-xl mb-3">
            <h3 className="font-bold">{p.ttl}</h3>
            <p>{p.desc}</p>
            <p className="text-sm">By: {p.crt}</p>
            <a href={p.fileUrl} className="text-blue-600 underline" target="_blank">View File</a>
            <p className="text-xs">IPFS Hash: {p.ipfs}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
