/* eslint-disable no-undef */ // Avoid the linter considering truffle elements as undef.

var BlockHashRNGFallback = artifacts.require('BlockHashRNGFallback')

contract('BlockHashRNGFallback', async accounts => {
  it('should save the random number through time', async function() {
    const blockHashRNGFallback = await BlockHashRNGFallback.new({
      from: accounts[0]
    })
    const blockNum = await web3.eth.getBlockNumber()
    const randomNumCall = await blockHashRNGFallback.getRN.call(blockNum)

    await blockHashRNGFallback.saveRN(blockNum)
    // long time passes
    for (i = 0; i < 257; i++)
      await web3.currentProvider.send({ method: 'evm_mine' }, function(
        _err,
        _result
      ) {})

    const sameRandomNum = await blockHashRNGFallback.getRN.call(blockNum)
    assert(sameRandomNum.eq(randomNumCall), 'unsaved random number should be 0')
  })

  it('should fallback to a number different from zero', async function() {
    const blockHashRNGFallback = await BlockHashRNGFallback.new({
      from: accounts[0]
    })
    const blockNum = await web3.eth.getBlockNumber()

    // long time passes
    for (i = 0; i < 358; i++)
      await web3.currentProvider.send({ method: 'evm_mine' }, function(
        _err,
        _result
      ) {})

    const randomNum = await blockHashRNGFallback.getRN.call(blockNum)
    assert(!randomNum.eq(new web3.utils.BN('0')))
  })

  it('should give out the reward for saving a number', async function() {
    const blockHashRNGFallback = await BlockHashRNGFallback.new({
      from: accounts[0]
    })
    const reimbursment = 1e18
    const balanceBeforeReimbursment = new web3.utils.BN(
      await web3.eth.getBalance(accounts[2])
    )
    const blockNum = await web3.eth.getBlockNumber()

    await blockHashRNGFallback.contribute(blockNum, {
      from: accounts[1],
      value: reimbursment
    })
    await blockHashRNGFallback.saveRN(blockNum, { from: accounts[2] })

    const balanceAfterReimbursment = new web3.utils.BN(
      await web3.eth.getBalance(accounts[2])
    )
    assert(balanceAfterReimbursment.gt(balanceBeforeReimbursment))
  })

  it('should not give reward to a caller who provided invalid block number', async function() {
    const blockHashRNGFallback = await BlockHashRNGFallback.new({
      from: accounts[0]
    })
    const reimbursment = 1e18
    const balanceBeforeReimbursment = new web3.utils.BN(
      await web3.eth.getBalance(accounts[2])
    )
    const blockNum = (await web3.eth.getBlockNumber()) + 100

    await blockHashRNGFallback.contribute(blockNum, {
      from: accounts[1],
      value: reimbursment
    })
    await blockHashRNGFallback.saveRN(blockNum, { from: accounts[2] })

    const balanceAfterReimbursment = new web3.utils.BN(
      await web3.eth.getBalance(accounts[2])
    )
    assert(balanceAfterReimbursment.lt(balanceBeforeReimbursment))
  })
})
