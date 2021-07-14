import { expect } from './setup'

import { ethers } from 'hardhat'
import { Contract, Signer } from 'ethers'

describe('Waffle', () => {
    let owner: Signer
    let slotBuyer: Signer

    let nftAddress: string


    let waffleContract: Contract
    let testERC721: Contract

    const ChainlinkFee = 10000; // change me
    const ChainlinkKeyHash = "0x6c3699283bda56ad74f6b855546325b68d482e983852a7a82979cc4807b641f4";
    const ChainlinkLinkAddress = "0xa36085F69e2889c224210F603D836748e7dC0088";
    const ChainlinkVRFCoordinator = "0xdD3782915140c8f3b190B5D67eAc6dc5760C46E9";
    const NftId = 0;
    const SlotPrice = 100000000000;
    const NumSlotsAvail = 100;
    const RaffleExpiry = 2624686714; // stupidly long time
    


    before(async () => {
      [owner, slotBuyer] = await ethers.getSigners()
      const waffleContractFactory = await ethers.getContractFactory("Waffle");

      const testERC721ContractFactory = await ethers.getContractFactory("TestERC721");

      testERC721 = await testERC721ContractFactory.deploy()
      await testERC721.deployed()
      nftAddress = testERC721.address

      console.log(RaffleExpiry)

      waffleContract = await waffleContractFactory.deploy(await owner.getAddress(), nftAddress, ChainlinkVRFCoordinator, ChainlinkLinkAddress, ChainlinkKeyHash, ChainlinkFee, NftId, SlotPrice, NumSlotsAvail, RaffleExpiry);
      await waffleContract.deployed()

      await testERC721.mint(await owner.getAddress())
      await testERC721.transferFrom(await owner.getAddress(), waffleContract.address, NftId)
    })

    describe('check initialization', () => {
        it('should have the right number of slots', async () => {
          expect(await waffleContract.numSlotsAvailable.call()).to.equal(NumSlotsAvail);
        })
        it('should have the right raffle expiry', async () => {
            expect(await waffleContract.raffleExpiry.call()).to.equal(RaffleExpiry);
        })
    })

    describe('finalize waffle', () => {
        it('should have the right number of slots', async () => {
            await waffleContract.connect(slotBuyer).purchaseSlot(NumSlotsAvail, { value: NumSlotsAvail * SlotPrice})
            await waffleContract.collectRandomWinner()
            await waffleContract.fakeRandomness()
            await waffleContract.disburseWinner()
            expect(await testERC721.ownerOf(NftId)).to.equal(await slotBuyer.getAddress())
        })
    })
})
    