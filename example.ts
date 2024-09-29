/* Open in Val Town: https://www.val.town/v/dglazkov/bbrun */
const DEFAULT_FRONTEND_MODULE = "https://esm.town/v/dglazkov/bbrunfe";

/**
 * You can supply these options as a second argument to the `proxy` function.
 * These options are used to configure the frontend.
 */
export type FrontendOptions = {
  /**
   * The frontend module to render.
   * If undefined, the default frontend will be used.
   * If false, no frontend will be used.
   */
  frontend?: false | string;
  /**
   * The style of the frontend.
   */
  style?: {
    /**
     * The background color of the frontend.
     * If undefined, the default is ""#f0f0f0"
     */
    bg?: string;
    /**
     * The font family that will be used for text.
     * If undefined, the default is "Helvetica Neue, Helvetica, Arial, sans-serif"
     */
    fontFamily?: string;
    /**
     * The primary color used by the frontend.
     * If undefined, the default is "#3498db"
     */
    colorPrimary?: string;
    /**
     * The background color of the primary color.
     * If undefined, the default is "#fff"
     */
    colorPrimaryBg?: string;
    /**
     * The error color used by the frontend.
     * If undefined, the default is "#fff0f0"
     */
    colorError?: string;
  };
};

const renderFrontend = (board: string, options?: FrontendOptions) => {
  if (options && options.frontend === false) {
    return new Response("Method not allowed", { status: 405 });
  }
  const chatAppModule = (options && options.frontend)
    || DEFAULT_FRONTEND_MODULE;
  const bg = options?.style?.bg || "#f0f0f0";
  const fontFamily = options?.style?.fontFamily
    || "Helvetica Neue, Helvetica, Arial, sans-serif";
  const colorPrimary = options?.style?.colorPrimary || "#3498db";
  const colorPrimaryBg = options?.style?.colorPrimaryBg || "#fff";
  const colorError = options?.style?.colorError || "#fff0f0";
  const page = `<!doctype html><head>
  <meta charset="utf-8">
  <link rel="board" href="${board}">
  <meta name="viewport" content="width=device-width">

  <style> 

  :root {
    --ca-color-bg: ${bg};
    --ca-font-family: ${fontFamily};
    --ca-color-primary: ${colorPrimary};
    --ca-color-primary-bg: ${colorPrimaryBg};
    --ca-color-error: ${colorError};
  }
  
  body, html { 
    height: 100%;
    margin: 0;
    font-family: var(--ca-font-family);
    background-color: var(--ca-color-bg);
    display: flex;
    justify-content: center;
    align-items: center;
    box-sizing: border-box;
  }

  body {
    padding: 2rem;
    width: 100%;
  }

  </style>
  <script type="module" src="${chatAppModule}"></script>
  </head>
  <body>
  <chat-app></chat-app>
  </body>`;
  return new Response(page, {
    headers: {
      "Content-Type": "text/html",
    },
  });
};

const error = (error: string) => {
  return new Response(`data: ${JSON.stringify(["error", error])}\n\n`, {
    headers: {
      "Content-Type": "application/json",
    },
  });
};

const runBoard = async (req: Request, endpointURL: string) => {
  const $key = Deno.env.get("BB_LIVE_KEY");
  if (!$key) {
    return error("BB_LIVE_KEY is not set");
  }
  const body = await req.json() as { $key: string };
  body.$key = $key;
  const response = await fetch(endpointURL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
};

const boardToEndpoint = (board: string) => {
  return board.replace(/\.json$/, ".api/run");
};

export const proxy = (url: string, options?: FrontendOptions) => {
  return async function(req: Request): Promise<Response> {
    if (req.method === "GET") {
      return renderFrontend(url, options);
    }

    if (req.method === "POST") {
      return runBoard(req, boardToEndpoint(url));
    }
  };
};
