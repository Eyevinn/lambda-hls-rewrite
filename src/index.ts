import { ALBHandler, ALBEvent, ALBResult } from "aws-lambda";
import { HLSMultiVariant, HLSMediaPlaylist } from "@eyevinn/hls-query";

const generateErrorResponse = ({ code: code, message: message }): ALBResult => {
  let response: ALBResult = {
    statusCode: code,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type, Origin",
    }
  };
  if (message) {
    response.body = JSON.stringify({ reason: message });
  }
  return response;
};


export const handler: ALBHandler = async (event: ALBEvent): Promise<ALBResult> => {
  // This is needed because Internet is a bit broken...
  const searchParams = new URLSearchParams(Object.keys(event.queryStringParameters).map(k => `${k}=${event.queryStringParameters[k]}`).join("&"));
  for (let k of searchParams.keys()) {
    event.queryStringParameters[k] = searchParams.get(k);
  }

  let response;
  try {
    if (event.path.match(/\/master.m3u8$/) && event.httpMethod === "GET" && event.queryStringParameters.url) {
      response = await handleMultiVariantRequest(event);
    } else if (event.path.match(/.m3u8$/) && event.httpMethod === "GET") {
      response = await handleMediaPlaylistRequest(event);
    } else if (event.httpMethod === "OPTIONS") {
      response = await handleOptionsRequest(event);
    } else {
      response = generateErrorResponse({ code: 404, message: "Resource not found" });
    }
  } catch (error) {
    console.error(error);
    response = generateErrorResponse({ code: 500, message: error.message ? error.message : error });
  }
  return response;
}

const handleMultiVariantRequest = async (event: ALBEvent): Promise<ALBResult> => { 
  const m = event.queryStringParameters.url.match(/(.*)\/(.*?)$/); 
  let originPath = m[1];

  const multiVariantSource = new HLSMultiVariant({ 
    url: new URL(event.queryStringParameters.url) 
  }, (uri) => {
    const searchParams = new URLSearchParams(event.queryStringParameters);
    searchParams.set("originPath", originPath + "/" );
    return searchParams;
  });

  try {
    await multiVariantSource.fetch();
    let content = multiVariantSource.toString();
    if (event.queryStringParameters.forceVersion) {
      content = content.replace(/#EXT-X-VERSION:6/, "#EXT-X-VERSION:" + event.queryStringParameters.forceVersion);
      if (parseInt(event.queryStringParameters.forceVersion) < 6) {
        content = content.replace(/#EXT-X-INDEPENDENT-SEGMENTS/, "");
      }
    }
 
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/x-mpegURL",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type, Origin",
      },
      body: content
    };
  } catch(error) {
    throw new Error(error + ": " + event.queryStringParameters.url);
  }
}

const handleMediaPlaylistRequest = async (event: ALBEvent): Promise<ALBResult> => {
  const mediaPlaylistUrl = event.queryStringParameters.originPath + event.path;

  const mediaPlaylistSource = new HLSMediaPlaylist({
    url: new URL(mediaPlaylistUrl) 
  }, (uri) => {
    return new URLSearchParams();  
  }, new URL(event.queryStringParameters.originPath));

  try {
    await mediaPlaylistSource.fetch();
    let content = mediaPlaylistSource.toString();
    if (event.queryStringParameters.forceVersion) {
      content = content.replace(/#EXT-X-VERSION:6/, "#EXT-X-VERSION:" + event.queryStringParameters.forceVersion);
      if (parseInt(event.queryStringParameters.forceVersion) < 6) {
        content = content.replace(/#EXT-X-INDEPENDENT-SEGMENTS/, "");
      }
    }

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/x-mpegURL",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type, Origin",
      },
      body: content
    };
  } catch (error) {
    throw new Error(error + ": " + mediaPlaylistUrl);
  }
}

const handleOptionsRequest = async (event: ALBEvent): Promise<ALBResult> => {
  return {
    statusCode: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Origin',
      'Access-Control-Max-Age': '86400',
    }
  };
};