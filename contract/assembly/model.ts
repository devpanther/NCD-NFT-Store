import { math, MapEntry, context, PersistentUnorderedMap, u128, PersistentVector, ContractPromiseBatch } from "near-sdk-as";
import { asNEAR, toYocto } from "../utils";
import { hash } from "../utils";

type AccountId = string;

export const nftData = new PersistentUnorderedMap<string, NFT>("nftData");
export const createNFT = new PersistentUnorderedMap<u32, CreateNFT>("createNFT");
export const nftOwner = new PersistentUnorderedMap<AccountId, u32[]>("nftOwner");
export const minted = new PersistentUnorderedMap<u32, u128>("minted");
export const listings = new PersistentUnorderedMap<string, u128>("listings");
export const nftBuyers = new PersistentUnorderedMap<AccountId, string[]>("nftBuyers");

function addBuyer(id: u32, nftId: string): void {
  // add to owner list
    // adding owner of the NFT
    let ownerNFT = nftBuyers.get(context.sender);

    // check if owner already has NFT
    if (ownerNFT == null) {
      ownerNFT = [];
    }

    // add NFT to the list
    ownerNFT.push(`${id}_${nftId}`);
    nftBuyers.set(context.sender, ownerNFT);
} 

function removeBuyer(accountId: string, id: u32, nftId: u16): void {
  // add to owner list
    // adding owner of the NFT
    let ownerNFT = nftBuyers.get(accountId);

    // check if owner already has NFT
    if (ownerNFT == null) {
      ownerNFT = [];
    }

    // remove NFT from the list
    var index = ownerNFT.indexOf(`${id}_${nftId}`);
    if (index !== -1) {
      ownerNFT.splice(index, 1);
    }

    nftBuyers.set(accountId, ownerNFT);
} 

@nearBindgen
export class AdminPriviledge {
    static editAnNFT(id: u32, nftId: u16, metadata: string): boolean {
      assert(context.sender == 'nearsea-store.testnet', "Only admin can edit an NFT");
      let nft = nftData.get(`${id}_${nftId}`)!;
      nft.metadata = metadata;
      nftData.set(`${id}_${nftId}`, nft);
      return true;
    }

    static deleteACollection(id: u32): boolean {
      assert(context.sender == 'nearsea-store.testnet', "Only admin can delete a collection");
      createNFT.delete(id);
      return true;
    }
}
@nearBindgen
export class CreateNFT {
  id: u32;

  constructor(
    public name: string, 
    public description: string,
    public totalSupply: u16,
    public maker: string,
    public mintPrice: u16,
    public profilePic: string,
    public banner: string
  ) {
    this.id = hash(name);
    this.maker = maker;
    this.mintPrice = mintPrice;
    this.profilePic = profilePic;
    this.banner = banner;
  }

  static setupNFT(name: string, description: string, totalSupply: u16, mintPrice: u16, profilePic: string, banner: string): CreateNFT {
    assert(createNFT.get(hash(name)) == null, "NFT already exists");

    assert(totalSupply > 0, "Total supply must be greater than 0");

    const setupNFT = new CreateNFT(name, description, totalSupply, context.sender, mintPrice, profilePic, banner);
    // creating a new NFT
    createNFT.set(setupNFT.id, setupNFT);
    // adding owner of the NFT
    let ownerNFT = nftOwner.get(context.sender);

    // check if owner already has NFT
    if (ownerNFT == null) {
      ownerNFT = [];
    }

    // add NFT to the list
    ownerNFT.push(setupNFT.id);
    nftOwner.set(context.sender, ownerNFT);

    // add minted amount
    minted.set(setupNFT.id, u128.from(0));

    return setupNFT;
  }

  static entries(): MapEntry<u32, CreateNFT>[] {
    const entries = createNFT.entries();
    return entries;
  }

  static get(id: u32): CreateNFT {
    const getNFT = createNFT.get(id)!;
    return getNFT;
  }

  // get last added collection
  static getLastAdded(accountId: string): u32 {
    const entries = nftOwner.get(accountId)!;
    const lastAdded = entries[entries.length - 1];
    return lastAdded;
  }

  static getOwnerNFT(): u32[] {
    const getNFTOwner = nftOwner.get(context.sender)!;
    return getNFTOwner;
  }
}

@nearBindgen
export class NFT {
  constructor(
    public id: u32,
    public nftId: u16, 
    public metadata: string, 
    public maker: string,
    public minted: bool = false, 
    public owner: string = "",
  ) {
    this.id = id;
    this.nftId = nftId;
    this.metadata = metadata;
    this.minted = minted;
    this.owner = owner;
    this.maker = maker;
  }

  // add single NFT
  static addNFT(id: u32, nftId: u16, metadata: string, owner: string): string {
    assert(createNFT.get(id) != null, "NFT does not exist");
    assert(createNFT.get(id)!.maker == context.sender, "Only the owner can add NFT");
    assert(nftData.get(`${id}_${nftId}`) == null, "NFT already exists");

     // get total supply
    const totalSupply = createNFT.get(id)!.totalSupply;

    assert(totalSupply >= nftId, "NFT id is greater than total supply");

    const nft = new NFT(id, nftId, metadata, context.sender, false, owner);
    
    nftData.set(`${id}_${nftId}`, nft);
    return `✅ NFT ${nftId} added successfully`;
  }

  // add NFT data as batch
  static addBatchNFT( nftDatas: Array<NFT> ): string {
    for(let i = 0; i < nftDatas.length; i++) {
      assert(createNFT.get(nftDatas[i].id) != null, "NFT does not exist");
      assert(createNFT.get(nftDatas[i].id)!.maker == context.sender, "Only the owner can add NFT");
      assert(nftData.get(`${nftDatas[i].id}_${nftDatas[i].nftId}`) == null, "NFT already exists");

      // get total supply
      const totalSupply = createNFT.get(nftDatas[i].id)!.totalSupply;

      assert(totalSupply >= nftDatas[i].nftId, "NFT id is greater than total supply");

      const nft = new NFT(nftDatas[i].id, nftDatas[i].nftId, nftDatas[i].metadata, context.sender, false, nftDatas[i].owner);

      nftData.set(`${nftDatas[i].id}_${nftDatas[i].nftId}`, nft);
    }
    return `✅ All ${nftDatas.length} NFTs added successfully`;
  }

  static get(id: u32, nftId: u16): NFT {
    const getNFT = nftData.get(`${id}_${nftId}`)!;
    return getNFT;
  }

  static getMinted(): MapEntry<u32, u128>[] {
    const entries = minted.entries();
    return entries;
  }

  static getSingleMinted(id: u32): u128 {
    const mintedData = minted.get(id)!;
    return mintedData;
  }

  static getOwnerNFT(accountId: string): string[] {
    let myNFTs = nftBuyers.get(accountId)!
    
    return myNFTs;
  }

  static mint(id: u32) : string {
    // attach deposit for mint
    const deposit = context.attachedDeposit;
    const getNFTData = createNFT.get(id)!;

    assert(deposit > u128.Zero, "Deposit must be greater than 0");
    assert(deposit == toYocto(getNFTData.mintPrice), `❌ Cannot mint, deposit must be ${getNFTData.mintPrice} NEAR`);

    const currentId = u128.add(minted.get(id)!, u128.from(1));

    // check if mint completed
    assert(minted.get(id)! <= u128.from(getNFTData.totalSupply), "Mint has ended");
    assert(nftData.get(`${id}_${currentId}`) !== null, "NFT does not exists");

    // send deposit to the owner
    ContractPromiseBatch.create(getNFTData.maker).transfer(deposit);

    // update minted to true
    const nft = nftData.get(`${id}_${currentId}`)!;
    nft.minted = true;
    nft.owner = context.sender;
    nftData.set(`${id}_${currentId}`, nft);

    addBuyer(id, currentId.toString());
    
    minted.set(id, currentId);
    return `✅ Minted No:${currentId} successfully with ${getNFTData.mintPrice} NEAR`;
  }
}

@nearBindgen
export class NFTSales {
  // list NFT for sale
  static listNFT(id: u32, nftId: u16, price: u32): string {
    // price must be greater than 0
    assert(price > 0, "Price must be greater than 0");

    assert(nftData.get(`${id}_${nftId}`) != null, "NFT does not exist");
    // only owner can list NFT
    assert(nftData.get(`${id}_${nftId}`)!.owner == context.sender, "Only the owner can list NFT"); 
    assert(nftData.get(`${id}_${nftId}`)!.minted == true, "NFT is not minted");

    // list NFT
    listings.set(`${id}_${nftId}`, toYocto(price));

    return `✅ NFT ${nftId} listed successfully`;
  }

  // get all listings
  static getListings(): MapEntry<string, u128>[] {
    const entries = listings.entries();
    return entries;
  }

  // get a single listing
  static getSingleListing(id: u32, nftId: u16): u128 {
    const listing = listings.get(`${id}_${nftId}`)!;
    return listing;
  }

  // fucntion to buy NFT
  static buyNFT(id: u32, nftId: u16): string {
    // check if listed
    assert(listings.get(`${id}_${nftId}`) !== null, "NFT does not exist");
    let listingPrice = listings.get(`${id}_${nftId}`)!;

    // check if NFT exists
    assert(nftData.get(`${id}_${nftId}`)!.owner != context.sender, "You are the owner of this NFT");
    assert(nftData.get(`${id}_${nftId}`)!.minted == true, "NFT is not minted");
    assert(nftData.get(`${id}_${nftId}`)!.owner != "", "this NFT is not owned");
    assert(nftData.get(`${id}_${nftId}`) != null, "NFT does not exist");
    
    // attach deposit for mint
    const deposit = context.attachedDeposit;
    assert(deposit > u128.Zero, "Deposit must be greater than 0");
    assert(deposit == listingPrice, `NFT is listed for ${asNEAR(listingPrice)} NEAR`);

    ContractPromiseBatch.create(nftData.get(`${id}_${nftId}`)!.owner).transfer(deposit);

    const nft = nftData.get(`${id}_${nftId}`)!;

    // update buyer
    addBuyer(id, nftId.toString());
    removeBuyer(nft.owner, id, nftId);

    // update owner
    nft.owner = context.sender;
    nftData.set(`${id}_${nftId}`, nft);

    // update listings
    listings.delete(`${id}_${nftId}`);

    return `✅ NFT ${nftId} bought successfully`;
  }
}