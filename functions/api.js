// Required modules
const express = require("express");
const cheerio = require("cheerio");
const axios = require("axios");
const serverless = require("serverless-http");

// Create Express app
const app = express();
const PORT = process.env.PORT || 4000;

// Create router
const router = express.Router();

// Default route
router.get("/", (req, res) => {
  res.json({
    sources: {
      1: "My Anime List (MAL)",
      2: "Anilist",
    },
  });
});

// Function to fetch and parse HTML data from MAL

async function fetchAndParseDataMAL(url) {
  try {
    const response = await axios.get(url);
    const html = response.data;
    const $ = cheerio.load(html);
    const newNews = [];

    $(".ranking-list").each(function () {
      const item = $(this);
      const rankElem = item.find(".rank.ac span");
      const rank = rankElem.text().trim();

      const urlElem = item.find(".title.al.va-t.word-break a");
      const url = urlElem.attr("href");
      const imgUrl = urlElem.find("img").attr("src");

      const titleElem = item.find(
        ".title.al.va-t.word-break .detail .di-ib.clearfix h3 a"
      );
      const title = titleElem.text().trim();

      let animeData = {
        rank,
        url,
        imgUrl,
        title,
      };

      // Check if the URL is for upcoming anime and include star rating if not
      if (!url.includes("type=upcoming")) {
        const rankingElem = item.find(".score .js-top-ranking-score-col span");
        const starRating = rankingElem.text().trim();
        animeData.star_rating = starRating;
      }

      newNews.push(animeData);
    });

    return newNews;
  } catch (error) {
    throw error;
  }
}

// Function to fetch and parse HTML data from AniList
async function fetchAndParseAniListData(url) {
  try {
    const response = await axios.get(url);
    const html = response.data;
    const $ = cheerio.load(html);
    const newNews = [];

    // Parsing HTML data
    $(".media-card").each(function () {
      const item = $(this);
      const urlElem = item.find("a").eq(1);
      const url = "https://anilist.co" + urlElem.attr("href");
      const imgElem = item.find("a").eq(0).find("img");
      const imgUrl = imgElem.attr("src");
      const titleElem = urlElem.text().trim();
      const title = titleElem;
      const animeData = {
        url,
        imgUrl,
        title,
      };
      newNews.push(animeData);
    });

    return newNews;
  } catch (error) {
    throw error;
  }
}

async function fetchAndParseMALHentai(url) {
  try {
    const response = await axios.get(url);
    const html = response.data;
    const $ = cheerio.load(html);
    const newNews = [];

    // Parsing HTML data
    $(".js-anime-category-producer").each(function () {
      const item = $(this);
      const tCont = item.find("div").eq(0);
      const titlee = tCont.find(".title .title-text h2 a").text().trim();

      // Accessing data-src attribute for lazy loaded images
      const imgg = item.find("div").eq(1);
      const im = imgg.find("a").eq(0);
      const image = im.find("img").attr("data-src"); // Use data-src attribute
      console.log(image);

      const url = item.find(".image a").eq(0).attr("href");

      const synCont = item.find(".synopsis");
      let para = synCont.find(".preline").text().trim();

      // Clean synopsis data
      para = para.split("\n")[0]; // Take the first part before the first newline character

      const animeData = {
        url,
        image,
        titlee,
        synopsis: para,
      };
      newNews.push(animeData);
    });

    return newNews;
  } catch (error) {
    throw error;
  }
}

router.get("/hanimeMAL", async (req, res) => {
  try {
    const newNews = await fetchAndParseMALHentai(
      "https://myanimelist.net/anime/genre/12/Hentai"
    );
    res.json(newNews);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint to fetch top all anime from MAL
router.get("/topAllanimeMAL", async (req, res) => {
  try {
    const newNews = await fetchAndParseDataMAL(
      "https://myanimelist.net/topanime.php"
    );
    res.json(newNews);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint to fetch top airing anime from MAL
router.get("/topAiringanimeMAL", async (req, res) => {
  try {
    const newNews = await fetchAndParseDataMAL(
      "https://myanimelist.net/topanime.php?type=airing"
    );
    res.json(newNews);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint to fetch top upcoming anime from MAL
router.get("/topUpcominganimeMAL", async (req, res) => {
  try {
    const newNews = await fetchAndParseDataMAL(
      "https://myanimelist.net/topanime.php?type=upcoming"
    );
    res.json(newNews);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint to fetch top anime movies from MAL
router.get("/topAnimeMoviesMAL", async (req, res) => {
  try {
    const newNews = await fetchAndParseDataMAL(
      "https://myanimelist.net/topanime.php?type=movie"
    );
    res.json(newNews);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint to fetch most popular anime from MAL
router.get("/mostPopularAnimesMAL", async (req, res) => {
  try {
    const newNews = await fetchAndParseDataMAL(
      "https://myanimelist.net/topanime.php?type=bypopularity"
    );
    res.json(newNews);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint to fetch top 20 anime from AniList
router.get("/top20AnimeAniList", async (req, res) => {
  try {
    const data = await fetchAndParseAniListData(
      "https://anilist.co/search/anime/top-100"
    );
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint to fetch all-time popular anime from AniList
router.get("/allTimepopularAniList", async (req, res) => {
  try {
    const data = await fetchAndParseAniListData(
      "https://anilist.co/search/anime/popular"
    );
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint to fetch popular anime this season from AniList
router.get("/popularThisSeasonAniList", async (req, res) => {
  try {
    const data = await fetchAndParseAniListData(
      "https://anilist.co/search/anime/this-season"
    );
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint to fetch trending anime from AniList
router.get("/trendingAnimeAniList", async (req, res) => {
  try {
    const data = await fetchAndParseAniListData(
      "https://anilist.co/search/anime/trending"
    );
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint to fetch upcoming anime from AniList
router.get("/upcomingAnimeAniList", async (req, res) => {
  try {
    const data = await fetchAndParseAniListData(
      "https://anilist.co/search/anime/next-season"
    );
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add router to the app
app.use("/", router);

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

// Export handler for serverless deployment
module.exports.handler = serverless(app);
