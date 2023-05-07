const posts = [
  {
    id: "ae45bdc9-ab68-4cba-a8e2-520f903ba30d",
    content:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quisque non posuere odio, id pellentesque dui. Maecenas vitae aliquam diam. Vestibulum auctor est id augue faucibus sodales. In dignissim luctus lorem vel pulvinar. Pellentesque luctus semper mi quis bibendum. Nullam vel enim lectus. Vivamus tempor eget nulla non semper. Aliquam cursus est sed nibh sodales, ac malesuada purus pulvinar. Nulla non augue lectus. Etiam id diam id nibh sollicitudin ornare sed id ante. Vestibulum cursus elit ac consequat vehicula. In pretium sed odio id aliquet. Vivamus non tellus vestibulum, placerat mi vitae, vestibulum urna.",
    published: {
      _seconds: 1676160908,
      _nanoseconds: 0,
    },
    draft: false,
    listed: true,
    tags: ["bogus", "photography"],
    slug: "photography-tips",
    title: "Some Photography Tips",
    contentHtml:
      "<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quisque non posuere odio, id pellentesque dui. Maecenas vitae aliquam diam. Vestibulum auctor est id augue faucibus sodales. In dignissim luctus lorem vel pulvinar. Pellentesque luctus semper mi quis bibendum. Nullam vel enim lectus. Vivamus tempor eget nulla non semper. Aliquam cursus est sed nibh sodales, ac malesuada purus pulvinar. Nulla non augue lectus. Etiam id diam id nibh sollicitudin ornare sed id ante. Vestibulum cursus elit ac consequat vehicula. In pretium sed odio id aliquet. Vivamus non tellus vestibulum, placerat mi vitae, vestibulum urna.</p>",
    contentHtmlPreview:
      "<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quisque non posuere odio, id pellentesque dui. Maecenas vitae aliquam diam. Vestibulum auctor est id augue faucibus sodales. In dignissim luctus lorem vel pulvinar. Pellentesque luctus semper mi quis bibendum. Nullam vel enim lectus. Vivamus tempor eget nulla non semper. Aliquam cursus est sed nibh sodales, ac malesuada purus pulvinar. Nulla non augue lectus. Etiam id diam id nibh sollicitudin ornare sed id ante. Vestibulum cursus elit ac consequat vehicula. In pretium sed odio id aliquet. Vivamus non tellus vestibulum, placerat mi vitae, vestibulum urna.</p>",
  },
  {
    id: "4b5a9647-140c-4af1-9d52-62d2770b3f66",
    published: {
      _seconds: 1676160908,
      _nanoseconds: 0,
    },
    content:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quisque non posuere odio, id pellentesque dui. Maecenas vitae aliquam diam. Vestibulum auctor est id augue faucibus sodales. In dignissim luctus lorem vel pulvinar. Pellentesque luctus semper mi quis bibendum. Nullam vel enim lectus. Vivamus tempor eget nulla non semper. Aliquam cursus est sed nibh sodales, ac malesuada purus pulvinar. Nulla non augue lectus. Etiam id diam id nibh sollicitudin ornare sed id ante. Vestibulum cursus elit ac consequat vehicula. In pretium sed odio id aliquet. Vivamus non tellus vestibulum, placerat mi vitae, vestibulum urna.",
    slug: "wisconsin",
    tags: ["bogus", "photography"],
    title: "Wisconsin in the Cold",
    draft: false,
    listed: true,
    contentHtml:
      "<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quisque non posuere odio, id pellentesque dui. Maecenas vitae aliquam diam. Vestibulum auctor est id augue faucibus sodales. In dignissim luctus lorem vel pulvinar. Pellentesque luctus semper mi quis bibendum. Nullam vel enim lectus. Vivamus tempor eget nulla non semper. Aliquam cursus est sed nibh sodales, ac malesuada purus pulvinar. Nulla non augue lectus. Etiam id diam id nibh sollicitudin ornare sed id ante. Vestibulum cursus elit ac consequat vehicula. In pretium sed odio id aliquet. Vivamus non tellus vestibulum, placerat mi vitae, vestibulum urna.</p>",
    contentHtmlPreview:
      "<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quisque non posuere odio, id pellentesque dui. Maecenas vitae aliquam diam. Vestibulum auctor est id augue faucibus sodales. In dignissim luctus lorem vel pulvinar. Pellentesque luctus semper mi quis bibendum. Nullam vel enim lectus. Vivamus tempor eget nulla non semper. Aliquam cursus est sed nibh sodales, ac malesuada purus pulvinar. Nulla non augue lectus. Etiam id diam id nibh sollicitudin ornare sed id ante. Vestibulum cursus elit ac consequat vehicula. In pretium sed odio id aliquet. Vivamus non tellus vestibulum, placerat mi vitae, vestibulum urna.</p>",
  },
  {
    id: "41217960-e45d-47ad-9837-c4c204c3dfdc",
    published: {
      _seconds: 1676160908,
      _nanoseconds: 0,
    },
    title: "Breaking News: This is Nothing",
    slug: "something-something-bogus",
    draft: false,
    listed: true,
    tags: ["bogus", "photography"],
    content:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quisque non posuere odio, id pellentesque dui. Maecenas vitae aliquam diam. Vestibulum auctor est id augue faucibus sodales. In dignissim luctus lorem vel pulvinar. Pellentesque luctus semper mi quis bibendum. Nullam vel enim lectus. Vivamus tempor eget nulla non semper. Aliquam cursus est sed nibh sodales, ac malesuada purus pulvinar. Nulla non augue lectus. Etiam id diam id nibh sollicitudin ornare sed id ante. Vestibulum cursus elit ac consequat vehicula. In pretium sed odio id aliquet. Vivamus non tellus vestibulum, placerat mi vitae, vestibulum urna.",
    contentHtml:
      "<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quisque non posuere odio, id pellentesque dui. Maecenas vitae aliquam diam. Vestibulum auctor est id augue faucibus sodales. In dignissim luctus lorem vel pulvinar. Pellentesque luctus semper mi quis bibendum. Nullam vel enim lectus. Vivamus tempor eget nulla non semper. Aliquam cursus est sed nibh sodales, ac malesuada purus pulvinar. Nulla non augue lectus. Etiam id diam id nibh sollicitudin ornare sed id ante. Vestibulum cursus elit ac consequat vehicula. In pretium sed odio id aliquet. Vivamus non tellus vestibulum, placerat mi vitae, vestibulum urna.</p>",
    contentHtmlPreview:
      "<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quisque non posuere odio, id pellentesque dui. Maecenas vitae aliquam diam. Vestibulum auctor est id augue faucibus sodales. In dignissim luctus lorem vel pulvinar. Pellentesque luctus semper mi quis bibendum. Nullam vel enim lectus. Vivamus tempor eget nulla non semper. Aliquam cursus est sed nibh sodales, ac malesuada purus pulvinar. Nulla non augue lectus. Etiam id diam id nibh sollicitudin ornare sed id ante. Vestibulum cursus elit ac consequat vehicula. In pretium sed odio id aliquet. Vivamus non tellus vestibulum, placerat mi vitae, vestibulum urna.</p>",
  },
];

export default posts;
