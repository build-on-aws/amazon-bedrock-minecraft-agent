export async function action_collect_block(mcBot: any, mcData: any, parameters: any): Promise<[any, any]> {

    // Get the name or partial name of the block we want
    const { block_type, count } = parameters;

    // Loop through all blocks and find the ids that matches the name or partial name
    const searchIds = []
    for (let i = 0; i < Object.keys(mcData.blocks).length; i++) {
        if (mcData.blocks[i].name.includes(block_type)) {
            searchIds.push(mcData.blocks[i].id)
            console.log("Search block id:", mcData.blocks[i].id)
            console.log("Search block name:", mcData.blocks[i].name)
        }
    }

    // print the searchIds
    console.log("Search ids:", searchIds)

    // Use findBlocks to find the location of these nearby blocks.
    var foundBlockLocations = mcBot.findBlocks({
        matching: searchIds,
        maxDistance: 10,
        count: count,
    });

    // get refs to the actual blocks 
    var foundBlocks: any[] = []
    for (let i = 0; i < foundBlockLocations.length; i++) {
      foundBlocks.push(mcBot.blockAt(foundBlockLocations[i]))
    }

    console.log("Found blocks:", foundBlocks.length);

    var result = "Could not find blocks with name:" + block_type

    var collectedCount = 0;

    // Collect the blocks. 
    if (foundBlocks) {
        try {
          // for each block in foundBlocks:
          for (let i = 0; i < foundBlocks.length; i++) {
            const block = foundBlocks[i];
            // await mcBot.collectBlock.collect(block);
            await collect_block(mcBot, block);
            collectedCount++;
          }
          result = `Collected ${collectedCount} blocks of ${block_type}.`;
        } catch (err) {
          console.error('Error collecting grass:', err);
          result = "Error collecting blocks."
        }
    }

    // Report back that we are done.
    const responseBody = { "Message": result };
    const responseState = 'REPROMPT';
    return [responseBody, responseState];
  }
  

  async function collect_block(mcBot: any, block: any){
    await mcBot.collectBlock.collect(block);
    console.log("Collected block:", block);
  }