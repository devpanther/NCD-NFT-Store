import { context, MapEntry, u128 } from "near-sdk-as";
import { AdminPriviledge, CreateNFT, NFT, NFTSales } from "./model";

// interface Batch {
//   id: u32, nftId: u16, metadata: string
// }

// add NFT to the list
export function createsNFT(name: string, description: string, totalSupply: u16, mintPrice: u16, profilePic: string, banner: string): CreateNFT {
  return CreateNFT.setupNFT(name, description, totalSupply, mintPrice, profilePic, banner);
}

// add NFT to the list
export function add(id: u32, nftId: u16, metadata: string): string {
  return NFT.addNFT(id, nftId, metadata, "");
}

export function addInBatch( nftDatas: Array<NFT> ): string {
  return NFT.addBatchNFT(nftDatas);
}

// get collection details
export function getDetails(id: u32): CreateNFT {
  return CreateNFT.get(id);
}

// get last added collection
export function getLastAdded(accountId: string): u32 {
  return CreateNFT.getLastAdded(accountId);
}

// get NFT data
export function getNFTData(id: u32, nftId: u16): NFT {
  return NFT.get(id, nftId);
}

// mint NFT
export function mintNFT(id: u32): string {
  return NFT.mint(id);
}

// check all NFTs
export function entries(): MapEntry<u32, CreateNFT>[] {
  return CreateNFT.entries();
}

// list NFT for sale
export function listNFT(id: u32, nftId: u16, price: u32): string {
  return NFTSales.listNFT(id, nftId, price)
}

// Buy NFT
export function buyNFT(id: u32, nftId: u16): string {
  return NFTSales.buyNFT(id, nftId);
}

// check listings
export function getListings(): MapEntry<string, u128>[] {
  return NFTSales.getListings();
}

// check single listings
export function getSingleListing(id: u32, nftId: u16): u128 {
  return NFTSales.getSingleListing(id, nftId);
}

// check minted
export function getMinted(): MapEntry<u32, u128>[] {
  return NFT.getMinted();
}

// check minted with id
export function getMintedWithId(id: u32): u128 {
  return NFT.getSingleMinted(id);
}

// get nft my owner id
export function getOwnerNFT(accountId: string): string[] {
  return NFT.getOwnerNFT(accountId);
}

// 
// admin privileges, shouldn't be here ☠️☠️☠️☠️

export function editAnNFT(id: u32, nftId: u16, metadata: string): boolean {
  return AdminPriviledge.editAnNFT(id, nftId, metadata);
}

export function deleteACollection(id: u32): boolean {
  return AdminPriviledge.deleteACollection(id);
}