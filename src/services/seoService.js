const config = require('../config/env');

function getDefaultMeta() {
  return {
    title: 'Spark Sharing',
    description: 'Amplify your message with coordinated social sharing. Create campaigns, share one link, everyone posts.',
    ogType: 'website',
    ogUrl: config.baseUrl,
    twitterCard: 'summary_large_image'
  };
}

function generateJsonLd(type, data = {}) {
  switch (type) {
    case 'Organization':
      return {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'Spark Sharing',
        url: config.baseUrl,
        description: 'Social amplification tool for coordinated sharing campaigns'
      };

    case 'WebSite':
      return {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'Spark Sharing',
        url: config.baseUrl
      };

    case 'Article':
      return {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: data.title,
        description: data.description,
        url: data.url,
        datePublished: data.datePublished,
        author: {
          '@type': 'Organization',
          name: 'Spark Sharing'
        }
      };

    default:
      return null;
  }
}

module.exports = {
  getDefaultMeta,
  generateJsonLd
};
