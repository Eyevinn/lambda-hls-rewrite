# lambda-hls-rewrite

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT) [![Slack](http://slack.streamingtech.se/badge.svg)](http://slack.streamingtech.se)

Lambda function that proxies and rewrite HLS manifest content.

## Supported Manipulations

| Param | Description | Example |
| ----- | ----------- | ------- |
| `forceVersion`| Force a specific HLS version | `/master.m3u8?url=<source>&forceVersion=3` |
| `r` | List of query params to remove from segment url:s | `/master.m3u8?url=<source>&forceVersion=3&r=p,s`| 

## Development

```
npm install
npm run dev
```

Development server is by default running on port 8000 and uses fastify to emulate an ALB to trigger Lambda function.

# About Eyevinn Technology

Eyevinn Technology is an independent consultant firm specialized in video and streaming. Independent in a way that we are not commercially tied to any platform or technology vendor.

At Eyevinn, every software developer consultant has a dedicated budget reserved for open source development and contribution to the open source community. This give us room for innovation, team building and personal competence development. And also gives us as a company a way to contribute back to the open source community.

Want to know more about Eyevinn and how it is to work here. Contact us at work@eyevinn.se!