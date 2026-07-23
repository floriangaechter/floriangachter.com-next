import { eleventyImageTransformPlugin } from "@11ty/eleventy-img";
import syntaxHighlight from "@11ty/eleventy-plugin-syntaxhighlight";
import { feedPlugin } from "@11ty/eleventy-plugin-rss";

export default function (eleventyConfig) {
  // Raster post images are handled by eleventy-img below, not passthrough.
  eleventyConfig.addPassthroughCopy("src/css");
  eleventyConfig.addPassthroughCopy("src/favicon.svg");

  eleventyConfig.addWatchTarget("src/css/");

  // Named readableDate (not date) to avoid shadowing Liquid's built-in date
  // filter. Format in UTC: front matter dates are UTC-midnight and would
  // otherwise drift a day back in western timezones.
  const readable = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
  eleventyConfig.addFilter("readableDate", (value) => readable.format(value));
  eleventyConfig.addFilter("htmlDateString", (value) =>
    new Date(value).toISOString().slice(0, 10),
  );

  eleventyConfig.addFilter("excerpt", (content) => {
    const text = (content || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
    return text.length > 160 ? text.slice(0, 157).trimEnd() + "…" : text;
  });

  eleventyConfig.addPlugin(eleventyImageTransformPlugin, {
    formats: ["avif", "webp", "auto"],
    outputDir: "_site/img/",
    urlPath: "/img/",
    svgShortCircuit: true,
    defaultAttributes: { loading: "lazy", decoding: "async" },
  });

  eleventyConfig.addPlugin(syntaxHighlight);

  eleventyConfig.addPlugin(feedPlugin, {
    type: "rss",
    outputPath: "/rss.xml",
    collection: { name: "posts", limit: 0 },
    metadata: {
      language: "en-us",
      title: "floriangaechter.com",
      subtitle: "Things I've learned or came across.",
      base: "https://floriangaechter.com/",
      author: { name: "Florian Gächter" },
    },
  });

  return {
    dir: {
      input: "src",
      includes: "_includes",
      data: "_data",
      output: "_site",
    },
    markdownTemplateEngine: "liquid",
    htmlTemplateEngine: "liquid",
    templateFormats: ["md", "html", "liquid", "njk"],
  };
}
