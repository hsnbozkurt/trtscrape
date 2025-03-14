const fs = require("fs");
const $ = require("cheerio");
async function main() {
  const trt = await fetch("https://www.trt.net.tr/yayin-akisi", {
    headers: {
      accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
      "accept-language": "tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7",
      "cache-control": "max-age=0",
      "if-none-match": '"fe2b6-EmtG2ZPZC+NOPM2sj95M+O/kk0o"',
      priority: "u=0, i",
      "sec-ch-ua":
        '"Chromium";v="134", "Not:A-Brand";v="24", "Google Chrome";v="134"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"Windows"',
      "sec-fetch-dest": "document",
      "sec-fetch-mode": "navigate",
      "sec-fetch-site": "same-origin",
      "sec-fetch-user": "?1",
      "sec-gpc": "1",
      "upgrade-insecure-requests": "1",
      cookie: "auth.strategy=google",
    },
    referrerPolicy: "strict-origin-when-cross-origin",
    body: null,
    method: "GET",
  });
  let html = await trt.text();
  const $html = $.load(html);
  const scripts = $html("script");
  const __NUXT__ = eval(
    scripts
      .get(scripts.length - 6)
      .children[0].data.replace("window.__NUXT__=", "")
  );
  const channels = __NUXT__.data[0].streamChannels;
  const channelsmap = new Map();
  for ({ date, epgData } of __NUXT__.data[0].streamEpg) {
    //   epgData = epgData[0].tvChannels;
    for (channel of epgData[0].tvChannels) {
      const upcoming = channel.upcoming.map((c) => {
        return {
          title: c.title,
          start: c.starttime,
          end: c.endtime,
        };
      });
      channelsmap.set(
        channel.id,
        channelsmap.has(channel.id)
          ? [...channelsmap.get(channel.id), ...upcoming]
          : upcoming
      );
    }
  }
  for (channel of channels) {
    channel.upcoming = channelsmap.get(channel.id);
    // remove turkish characters from channel title
    channel.title = channel.title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9_]/g, "")
      .replaceAll(" ", "_");
    fs.writeFileSync(
      `./channels/${channel.title}.json`,
      JSON.stringify(channel)
    );
  }

  fs.writeFileSync("trt.html", html);
}
main();
