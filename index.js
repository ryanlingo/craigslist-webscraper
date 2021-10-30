const puppeteer = require("puppeteer");
const cheerio = require("cheerio");

async function scrapeListings(page) {
  await page.goto(
    "https://sfbay.craigslist.org/d/software-qa-dba-etc/search/sof"
  );

  const html = await page.content();
  const $ = cheerio.load(html);

  const listings = $(".result-info")
    .map((index, element) => {
      const titleElement = $(element).find(".result-title");
      const timeElement = $(element).find(".result-date");
      const hoodElement = $(element).find(".result-hood");
      const title = $(titleElement).text();
      const url = $(titleElement).attr("href");
      const datePosted = new Date($(timeElement).attr("datetime"));
      const hood = $(hoodElement)
        .text()
        .replace("(", "")
        .replace(")", "")
        .trim();
      return { title, url, datePosted, hood };
    })
    .get();
  return listings;
}

async function scrapeJobDescriptions(listings, page) {
  for (let i = 0; i < listings.length; i++) {
    await page.goto(listings[i].url);
    const html = await page.content();
    const $ = cheerio.load(html);
    const jobDescription = $("#postingbody").text();
    const compensation = $("p.attrgroup > span:nth-child(1) > b").text();
    listings[i].jobDescription = jobDescription;
    listings[i].compensation = compensation;
    await sleep(10);
  }
}

async function sleep(miliseconds) {
  return new Promise((resolve) => setTimeout(resolve, miliseconds));
}

async function main() {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  const listings = await scrapeListings(page);
  const listingsWithJobDescriptions = await scrapeJobDescriptions(
    listings,
    page
  );
  console.log(listings);
}

main();
