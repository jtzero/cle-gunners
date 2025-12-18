const useGoogleAnalytics = (() => {
  if (process.env.environment?.name === "github-pages") {
    console.log("Google Analytics is enabled");
    return true;
  } else {
    console.log("Google Analytics is disabled");
    return false;
  }
})();
export default {
  useGoogleAnalytics: useGoogleAnalytics,
  site: {
    title: "Cleveland Arsenal",
    favicon: "/images/favicon.png",
    logo: "",
    logo_width: "",
    logo_height: "",
    logo_text: "Cleveland Arsenal",
  },
  settings: {
    summary_length: 140,
  },

  metadata: {
    meta_author: "jtzero",
    meta_image: "/images/arsenal-guardian.jpg",
    meta_description: "Cleveland Arsenal",
    meta_keywords: [
      "Cleveland Arsenal Supporters",
      "Arsenal FC",
      "Premier League",
      "soccer",
      "football",
      "Gunners",
      "Cleveland, Ohio",
      "The Land",
      "Gooners",
      "Cleveland Arsenal",
    ],
  },
};
