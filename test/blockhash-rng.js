/* eslint-disable no-undef */ // Avoid the linter considering truffle elements as undef.

var BlockHashRNG = artifacts.require('BlockHashRNG')

contract('BlockhashRNG', async accounts => {
  it('should increase the reward for a random number', async function() {
    const blockHashRNG = await BlockHashRNG.new({ from: accounts[0] })
    await blockHashRNG.contribute(10, { from: accounts[0], value: 1000 })
    let balance = await blockHashRNG.reward(10)
    assert.equal(balance.toNumber(), 1000)

    await blockHashRNG.contribute(10, { from: accounts[1], value: 1000 })
    balance = await blockHashRNG.reward(10)
    assert.equal(balance.toNumber(), 2000)
  })

  it('should generate a random number different from zero', async function() {
    const blockHashRNG = await BlockHashRNG.new({ from: accounts[0] })
    const rn = await blockHashRNG.getRN(await web3.eth.getBlockNumber())

    assert.notEqual(rn, 0)
  })

  it('should mine dummy blocks', async () => {
    const currentBlockNum = await web3.eth.getBlockNumber()
    // mine nine empty blocks
    for (i = 0; i < 9; i++)
      await web3.currentProvider.send({ method: 'evm_mine' }, function(
        _err,
        _result
      ) {})

    // await web3.eth.getBlockNumber() is not going to return the correct value if there are no transactions in the block
    // fake a single transaction
    await BlockHashRNG.new({ from: accounts[0] })

    assert.equal(currentBlockNum + 10, await web3.eth.getBlockNumber())
  })

  it('should save the random number trough time', async function() {
    const blockHashRNG = await BlockHashRNG.new({ from: accounts[0] })
    const blockNum = await web3.eth.getBlockNumber()
    const randomNumCall = await blockHashRNG.getRN.call(blockNum)

    await blockHashRNG.saveRN(blockNum)
    // long time passes
    for (i = 0; i < 257; i++)
      await web3.currentProvider.send({ method: 'evm_mine' }, function(
        _err,
        _result
      ) {})

    const sameRandomNum = await blockHashRNG.getRN.call(blockNum)
    assert(sameRandomNum.eq(randomNumCall), 'unsaved random number should be 0')
  })

  it('should give out the reward for saving a number', async function() {
    const blockHashRNG = await BlockHashRNG.new({ from: accounts[0] })
    const reimbursment = 1e18
    const balanceBeforeReimbursment = new web3.utils.BN(
      await web3.eth.getBalance(accounts[2])
    )
    const blockNum = await web3.eth.getBlockNumber()

    await blockHashRNG.contribute(blockNum, {
      from: accounts[1],
      value: reimbursment
    })
    await blockHashRNG.saveRN(blockNum, { from: accounts[2] })

    const balanceAfterReimbursment = new web3.utils.BN(
      await web3.eth.getBalance(accounts[2])
    )
    assert(balanceAfterReimbursment.gt(balanceBeforeReimbursment))
  })
})
