function base64url(input) {
  return btoa(input)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

async function createGoogleAccessToken(env) {
  const now = Math.floor(Date.now() / 1000);

  const header = base64url(
    JSON.stringify({
      alg: "RS256",
      typ: "JWT"
    })
  );

  const payload = base64url(
    JSON.stringify({
      iss: env.GDRIVE_CLIENT_EMAIL,
      scope: "https://www.googleapis.com/auth/drive.readonly",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600
    })
  );

  const unsignedToken = `${header}.${payload}`;

  const privateKey =
    env.GDRIVE_PRIVATE_KEY.replace(/\\n/g, "\n");

  const pemContents = privateKey
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "")
    .replace(/\s/g, "");

  const binaryKey = Uint8Array.from(
    atob(pemContents),
    (char) => char.charCodeAt(0)
  );

  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    binaryKey.buffer,
    {
      name: "RSASSA-PKCS1-v1_5",
      hash: "SHA-256"
    },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    new TextEncoder().encode(unsignedToken)
  );

  const signedToken =
    `${unsignedToken}.${base64url(
      String.fromCharCode(
        ...new Uint8Array(signature)
      )
    )}`;

  const response = await fetch(
    "https://oauth2.googleapis.com/token",
    {
      method: "POST",
      headers: {
        "content-type":
          "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        grant_type:
          "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion: signedToken
      })
    }
  );

  if (!response.ok) {
    throw new Error(
      `Google OAuth lỗi: ${response.status} ${await response.text()}`
    );
  }

  const data = await response.json();

  return data.access_token;
}

async function listDriveFolder(
  env,
  folderId,
  path = ""
) {
  const accessToken =
    await createGoogleAccessToken(env);

  const allItems = [];
  let pageToken = "";

  do {
    const driveUrl =
      "https://www.googleapis.com/drive/v3/files" +
      `?q=${encodeURIComponent(
        `'${folderId}' in parents and trashed = false`
      )}` +
      "&fields=nextPageToken,files(id,name,mimeType)" +
      "&pageSize=100" +
      (pageToken
        ? `&pageToken=${encodeURIComponent(
            pageToken
          )}`
        : "");

    const response = await fetch(driveUrl, {
      headers: {
        Authorization:
          `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      throw new Error(
        `Google Drive API lỗi: ${response.status} ${await response.text()}`
      );
    }

    const data =
      await response.json();

    for (const item of data.files || []) {
      const itemPath = path
        ? `${path}/${item.name}`
        : item.name;

      allItems.push({
        id: item.id,
        name: item.name,
        mimeType: item.mimeType,
        path: itemPath
      });

      if (
        item.mimeType ===
        "application/vnd.google-apps.folder"
      ) {
        const children =
          await listDriveFolder(
            env,
            item.id,
            itemPath
          );

        allItems.push(...children);
      }
    }

    pageToken =
      data.nextPageToken || "";
  } while (pageToken);

  return allItems;
}

function createSlug(brand, model) {
  let cleanModel = model.trim();

  const brandPrefix =
    new RegExp(
      `^${brand.trim()}[\\s-]+`,
      "i"
    );

  cleanModel =
    cleanModel.replace(
      brandPrefix,
      ""
    );

  return `${brand}-${cleanModel}`
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getDriveRobotImages(allItems) {
  const imageItems =
    allItems.filter((item) =>
      item.mimeType?.startsWith("image/")
    );

  const robotImages = {};

  for (const item of imageItems) {
    const parts =
      item.path.split("/");

    if (
      parts.length < 4 ||
      parts[0] !== "ROBOT"
    ) {
      continue;
    }

    const brand =
      parts[1].trim();

    const model =
      parts[2].trim();

    if (!brand || !model) {
      continue;
    }

    const key =
      `${brand}/${model}`;

    if (!robotImages[key]) {
      robotImages[key] = {
        brand,
        model,
        images: []
      };
    }

    robotImages[key].images.push({
      id: item.id,
      name: item.name,
      mimeType: item.mimeType
    });
  }

  return robotImages;
}
function base64UrlEncode(value) {
  const bytes =
    typeof value === "string"
      ? new TextEncoder().encode(value)
      : value;

  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function base64UrlDecode(value) {
  const padded =
    value
      .replace(/-/g, "+")
      .replace(/_/g, "/") +
    "=".repeat(
      (4 - (value.length % 4)) % 4
    );

  const binary = atob(padded);

  const bytes = new Uint8Array(
    binary.length
  );

  for (let i = 0; i < binary.length; i++) {
    bytes[i] =
      binary.charCodeAt(i);
  }

  return bytes;
}

async function createSessionToken(
  env
) {
  const payload = {
    role: "admin",
    exp:
      Math.floor(
        Date.now() / 1000
      ) +
      60 * 60 * 8
  };

  const encodedPayload =
    base64UrlEncode(
      JSON.stringify(payload)
    );

  const key =
    await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(
        env.ADMIN_SESSION_SECRET
      ),
      {
        name: "HMAC",
        hash: "SHA-256"
      },
      false,
      ["sign"]
    );

  const signature =
    await crypto.subtle.sign(
      "HMAC",
      key,
      new TextEncoder().encode(
        encodedPayload
      )
    );

  return (
    encodedPayload +
    "." +
    base64UrlEncode(
      new Uint8Array(signature)
    )
  );
}

async function verifySessionToken(
  env,
  token
) {
  try {
    if (!token) {
      return false;
    }

    const parts =
      token.split(".");

    if (parts.length !== 2) {
      return false;
    }

    const [
      encodedPayload,
      encodedSignature
    ] = parts;

    const key =
      await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(
          env.ADMIN_SESSION_SECRET
        ),
        {
          name: "HMAC",
          hash: "SHA-256"
        },
        false,
        ["verify"]
      );

    const valid =
      await crypto.subtle.verify(
        "HMAC",
        key,
        base64UrlDecode(
          encodedSignature
        ),
        new TextEncoder().encode(
          encodedPayload
        )
      );

    if (!valid) {
      return false;
    }

    const payload =
      JSON.parse(
        new TextDecoder().decode(
          base64UrlDecode(
            encodedPayload
          )
        )
      );

    if (
      payload.role !== "admin"
    ) {
      return false;
    }

    if (
      !Number.isInteger(
        payload.exp
      )
    ) {
      return false;
    }

    if (
      payload.exp <
      Math.floor(
        Date.now() / 1000
      )
    ) {
      return false;
    }

    return true;

  } catch (error) {
    return false;
  }
}

function getSessionFromRequest(
  request
) {
  const cookie =
    request.headers.get(
      "Cookie"
    );

  if (!cookie) {
    return null;
  }

  const match =
    cookie.match(
      /(?:^|;\s*)admin_session=([^;]+)/
    );

  return match
    ? match[1]
    : null;
}


async function requireAdminSession(
request,
env
) {
const token =
getSessionFromRequest(
request
);

return await verifySessionToken(
env,
token
);
}
export default {
  async fetch(request, env) {
    const url =
      new URL(request.url);
    // =========================================================
    // ADMIN LOGIN
    // =========================================================

    if (
      url.pathname === "/api/admin/login" &&
      request.method === "POST"
    ) {
      try {
        const body =
          await request.json();

        const password =
          String(
            body.password || ""
          );

        if (!password) {
          return Response.json(
            {
              ok: false,
              error: "Vui lòng nhập mật khẩu"
            },
            {
              status: 400
            }
          );
        }

        if (
          password !==
          env.ADMIN_PASSWORD
        ) {
          return Response.json(
            {
              ok: false,
              error: "Mật khẩu không đúng"
            },
            {
              status: 401
            }
          );
        }

        const token =
          await createSessionToken(
            env
          );

        return new Response(
          JSON.stringify({
            ok: true,
            message:
              "Đăng nhập thành công"
          }),
          {
            status: 200,
            headers: {
              "Content-Type":
                "application/json",
              "Set-Cookie":
                [
                  "admin_session=" +
                    token,
                  "HttpOnly",
                  "Secure",
                  "SameSite=Strict",
                  "Path=/",
                  "Max-Age=28800"
                ].join("; ")
            }
          }
        );

      } catch (error) {
        console.error(
          "ADMIN LOGIN ERROR:",
          error
        );
    
        return Response.json(
          {
            ok: false,
            error:
              "Dữ liệu đăng nhập không hợp lệ"
          },
          {
            status: 400
          }
        );
      }
    }
        // =========================================================
    // ADMIN SESSION CHECK
    // =========================================================

    if (
      url.pathname === "/api/admin/session" &&
      request.method === "GET"
    ) {
      const isAdmin =
        await requireAdminSession(
          request,
          env
        );

      return Response.json({
        ok: true,
        authenticated: isAdmin
      });
    }
    // =========================================================
// ADMIN LOGOUT
// =========================================================

if (
  url.pathname === "/api/admin/logout" &&
  request.method === "POST"
) {
  return new Response(
    JSON.stringify({
      ok: true,
      message: "Đã đăng xuất Admin"
    }),
    {
      status: 200,
      headers: {
        "Content-Type":
          "application/json",
        "Set-Cookie":
          [
            "admin_session=",
            "HttpOnly",
            "Secure",
            "SameSite=Strict",
            "Path=/",
            "Max-Age=0"
          ].join("; ")
      }
    }
  );
}
    // =========================================================
    // ARTICLES API - PUBLIC READ
    // =========================================================
    if (
      url.pathname === "/api/articles" &&
      request.method === "GET"
    ) {
      try {
        const result =
          await env
            .trung_tu_te_robot_db
            .prepare(
              `
              SELECT
                id,
                title,
                slug,
                category,
                icon,
                excerpt,
                cover_image,
                status,
                sort_order,
                view_count,
                created_at,
                updated_at,
                published_at
              FROM articles
              WHERE status = 'published'
              ORDER BY
                sort_order ASC,
                published_at DESC,
                id DESC
              `
            )
            .all();
    
            return new Response(   JSON.stringify({     ok: true,     articles:       result.results || []   }),   {     headers: {       "Content-Type":         "application/json; charset=utf-8"     }   } );
    
      } catch (error) {
        console.error(
          "ARTICLES LIST ERROR:",
          error
        );
    
        return Response.json(
          {
            ok: false,
            error:
              error.message
          },
          {
            status: 500
          }
        );
      }
    }
    
    // =========================================================
    // ARTICLE DETAIL API - PUBLIC READ
    // =========================================================
    
    if (
      url.pathname.startsWith(
        "/api/article/"
      ) &&
      request.method === "GET"
    ) {
      try {
        const slug =
          decodeURIComponent(
            url.pathname
              .slice(
                "/api/article/".length
              )
          ).trim();
    
        if (!slug) {
          return Response.json(
            {
              ok: false,
              error:
                "Thiếu slug bài viết"
            },
            {
              status: 400
            }
          );
        }
    
        const article =
          await env
            .trung_tu_te_robot_db
            .prepare(
              `
              SELECT
                id,
                title,
                slug,
                category,
                icon,
                excerpt,
                content,
                cover_image,
                status,
                sort_order,
                view_count,
                created_at,
                updated_at,
                published_at
              FROM articles
              WHERE slug = ?
                AND status = 'published'
              LIMIT 1
              `
            )
            .bind(slug)
            .first();
    
        if (!article) {
          return Response.json(
            {
              ok: false,
              error:
                "Không tìm thấy bài viết"
            },
            {
              status: 404
            }
          );
        }
    
        return new Response(   JSON.stringify({     ok: true,     article   }),   {     headers: {       "Content-Type":         "application/json; charset=utf-8"     }   } );
    
      } catch (error) {
        console.error(
          "ARTICLE DETAIL ERROR:",
          error
        );
    
        return Response.json(
          {
            ok: false,
            error:
              error.message
          },
          {
            status: 500
          }
        );
      }
    }
    // =========================================================
    // TEST API
    // =========================================================

    if (
      url.pathname ===
      "/api/test"
    ) {
      return new Response(
        "API OK"
      );
    }

    // =========================================================
    // TEST ENV
    // =========================================================

    if (
      url.pathname ===
      "/api/test-env"
    ) {
      return Response.json({
        clientEmailExists:
          Boolean(
            env.GDRIVE_CLIENT_EMAIL
          ),

        privateKeyExists:
          Boolean(
            env.GDRIVE_PRIVATE_KEY
          ),

        privateKeyLength:
          env.GDRIVE_PRIVATE_KEY?.length ??
          0
      });
    }

    // =========================================================
    // TEST D1
    // =========================================================

    if (
      url.pathname ===
      "/api/test-db"
    ) {
      try {
        const result =
          await env
            .trung_tu_te_robot_db
            .prepare(
              "SELECT COUNT(*) AS total FROM robots"
            )
            .first();

        return Response.json({
          ok: true,
          database:
            "trung-tu-te-robot-db",
          robots:
            result?.total ?? 0
        });
      } catch (error) {
        return Response.json(
          {
            ok: false,
            error:
              error.message
          },
          { status: 500 }
        );
      }
    }

    // =========================================================
    // SYNC ROBOTS
    // =========================================================

    if (
      url.pathname ===
      "/api/sync-robots"
    ) {
      try {
        const rootFolderId =
          "1ExFyhXLgdWho7zMc1peSm0s_4rCAa8Bc";

        const allItems =
          await listDriveFolder(
            env,
            rootFolderId
          );

        const robotMap =
          getDriveRobotImages(
            allItems
          );

        const synced = [];
        const errors = [];

        for (
          const robot
          of Object.values(robotMap)
        ) {
          const slug =
            createSlug(
              robot.brand,
              robot.model
            );

          try {
            const result =
              await env
                .trung_tu_te_robot_db
                .prepare(
                  `
                  INSERT INTO robots (
                    brand,
                    model,
                    slug
                  )
                  VALUES (?, ?, ?)
                  ON CONFLICT(brand, model)
                  DO UPDATE SET
                    slug = excluded.slug,
                    updated_at =
                      CURRENT_TIMESTAMP
                  RETURNING
                    id,
                    brand,
                    model,
                    slug
                  `
                )
                .bind(
                  robot.brand,
                  robot.model,
                  slug
                )
                .first();

            if (result) {
              synced.push(
                result
              );
            }
          } catch (error) {
            errors.push({
              brand:
                robot.brand,
              model:
                robot.model,
              error:
                error.message
            });
          }
        }

        const dbResult =
          await env
            .trung_tu_te_robot_db
            .prepare(
              `
              SELECT
                id,
                brand,
                model,
                slug,
                year,
                category,
                status,
                created_at,
                updated_at
              FROM robots
              ORDER BY brand, model
              `
            )
            .all();

        return Response.json({
          ok: true,

          driveRobotCount:
            Object.keys(
              robotMap
            ).length,

          syncedCount:
            synced.length,

          errorCount:
            errors.length,

          errors,

          robots:
            dbResult.results ||
            []
        });
      } catch (error) {
        return Response.json(
          {
            ok: false,
            error:
              error.message
          },
          { status: 500 }
        );
      }
    }

    // =========================================================
    // SYNC IMAGES
    // =========================================================

    if (
      url.pathname ===
      "/api/sync-images"
    ) {
      try {
        const rootFolderId =
          "1ExFyhXLgdWho7zMc1peSm0s_4rCAa8Bc";

        const allItems =
          await listDriveFolder(
            env,
            rootFolderId
          );

        const robotMap =
          getDriveRobotImages(
            allItems
          );

        const synced = [];
        const errors = [];

        for (
          const robot
          of Object.values(robotMap)
        ) {
          const robotRecord =
            await env
              .trung_tu_te_robot_db
              .prepare(
                `
                SELECT
                  id,
                  brand,
                  model
                FROM robots
                WHERE brand = ?
                  AND model = ?
                LIMIT 1
                `
              )
              .bind(
                robot.brand,
                robot.model
              )
              .first();

          if (!robotRecord) {
            errors.push({
              brand:
                robot.brand,
              model:
                robot.model,
              error:
                "Không tìm thấy Robot trong D1"
            });

            continue;
          }

          const images =
          [...robot.images].sort(
            (a, b) => {
              const getNumber =
                (name) => {
                  const match =
                    name.match(
                      /(\d+)(?=\.[^.]+$)/
                    );

                  return match
                    ? Number(match[1])
                    : Number.MAX_SAFE_INTEGER;
                };

              return (
                getNumber(a.name) -
                getNumber(b.name)
              );
            }
          );

        for (
          let index = 0;
          index < images.length;
          index++
        ) {
          const image =
            images[index];

          const sortOrder =
            index + 1;

          const isPrimary =
            sortOrder === 1
              ? 1
              : 0;

          try {
            const result =
              await env
                .trung_tu_te_robot_db
                .prepare(
                  `
                  INSERT INTO robot_images (
                    robot_id,
                    drive_id,
                    file_name,
                    mime_type,
                    sort_order,
                    is_primary
                  )
                  VALUES (?, ?, ?, ?, ?, ?)
                  ON CONFLICT(robot_id, drive_id)
                  DO UPDATE SET
                    file_name =
                      excluded.file_name,
                    mime_type =
                      excluded.mime_type,
                    sort_order =
                      excluded.sort_order,
                    is_primary =
                      excluded.is_primary
                  RETURNING
                    id,
                    robot_id,
                    drive_id,
                    file_name,
                    mime_type,
                    sort_order,
                    is_primary
                  `
                )
                .bind(
                  robotRecord.id,
                  image.id,
                  image.name,
                  image.mimeType,
                  sortOrder,
                  isPrimary
                )
                .first();

            if (result) {
              synced.push(
                result
              );
            }
          } catch (error) {
            errors.push({
              robotId:
                robotRecord.id,
              brand:
                robot.brand,
              model:
                robot.model,
              fileName:
                image.name,
              error:
                error.message
            });
          }
        }
      }

        const dbResult =
          await env
            .trung_tu_te_robot_db
            .prepare(
              `
              SELECT
                ri.id,
                ri.robot_id,
                r.brand,
                r.model,
                ri.drive_id,
                ri.file_name,
                ri.mime_type,
                ri.sort_order,
                ri.is_primary
              FROM robot_images ri
              INNER JOIN robots r
                ON r.id = ri.robot_id
              ORDER BY
                r.brand,
                r.model,
                ri.sort_order
              `
            )
            .all();

        return Response.json({
          ok: true,

          driveRobotCount:
            Object.keys(
              robotMap
            ).length,

          syncedImageCount:
            synced.length,

          errorCount:
            errors.length,

          errors,

          images:
            dbResult.results ||
            []
        });
      } catch (error) {
        return Response.json(
          {
            ok: false,
            error:
              error.message
          },
          { status: 500 }
        );
      }
    }

    // =========================================================
    // PUBLIC AI CHATBOT - TRUNG TU TE
    // =========================================================
    if (url.pathname === "/api/chat") {
      if (request.method !== "POST") {
        return Response.json(
          { ok: false, error: "Chỉ hỗ trợ phương thức POST" },
          {
            status: 405,
            headers: { Allow: "POST" }
          }
        );
      }

      try {

        let body;

        try {
          body = await request.json();
        } catch {
          return Response.json(
            { ok: false, error: "Dữ liệu gửi lên không hợp lệ" },
            { status: 400 }
          );
        }

        const message = String(body?.message || "").trim();

        if (!message || message.length > 2000) {
          return Response.json(
            {
              ok: false,
              error: "Tin nhắn phải có từ 1 đến 2000 ký tự"
            },
            { status: 400 }
          );
        }

        const history = Array.isArray(body?.history)
          ? body.history
              .filter(item =>
                item &&
                ["user", "model"].includes(item.role) &&
                typeof item.text === "string"
              )
              .slice(-8)
              .map(item => ({
                role: item.role,
                parts: [{
                  text: item.text.slice(0, 1500)
                }]
              }))
          : [];

        const robotsResult = await env.trung_tu_te_robot_db
          .prepare(`
            SELECT
              r.brand,
              r.model,
              r.slug,
              r.year,
              r.category,
              s.suction_power,
              s.obstacle_recognition,
              s.mopping_technology,
              s.mop_extension,
              s.side_brush_extension,
              s.automatic_mop_washing,
              s.mop_drying,
              s.wash_tray_self_cleaning,
              s.automatic_dust_emptying,
              s.automatic_detergent_dispensing,
              s.carpet_mop_lift,
              s.dust_bag_capacity,
              s.clean_dirty_water_capacity,
              s.battery_capacity,
              s.cleaning_area,
              s.robot_dimensions,
              s.dock_dimensions,
              s.reference_price,
              c.intro,
              c.highlights,
              c.pros,
              c.notes,
              c.suitable_for,
              c.ai_content
            FROM robots r
            LEFT JOIN robot_specs s
              ON s.robot_id = r.id
            LEFT JOIN robot_content c
              ON c.robot_id = r.id
            WHERE r.status = 'active'
            ORDER BY r.brand, r.model
            LIMIT 50
          `)
          .all();

        const robots = robotsResult.results || [];
        const parseSuctionPowerPa = (value) => {
          const match = String(value ?? "").match(/(\d[\d.,]*)\s*(kpa|pa)\b/i);

          if (!match) return null;

          const unit = match[2].toLowerCase();
          const rawNumber = match[1];

           const number = unit === "kpa"
            ? Number(rawNumber.replace(",", "."))
            : Number(rawNumber.replace(/[.,]/g, ""));

          if (!Number.isFinite(number) || number <= 0) return null;

          return unit === "kpa" ? Math.round(number * 1000) : number;
        };
        const featuresResult = await env.trung_tu_te_robot_db
          .prepare(`
            SELECT
              r.brand,
              r.model,
              f.title,
              f.description
            FROM robot_features f
            INNER JOIN robots r
              ON r.id = f.robot_id
            WHERE r.status = 'active'
            ORDER BY r.brand, r.model, f.sort_order, f.id
          `)
          .all();

        const featuresByRobot = new Map();

        for (const feature of featuresResult.results || []) {
          const key = `${feature.brand} ${feature.model}`;

          if (!featuresByRobot.has(key)) {
            featuresByRobot.set(key, []);
          }

          featuresByRobot.get(key).push({
            title: feature.title,
            description: feature.description
          });
        }

        const catalog = robots.map(robot => ({
          ...robot,
          suction_power_numeric_pa: parseSuctionPowerPa(robot.suction_power),
          features:
            featuresByRobot.get(
              `${robot.brand} ${robot.model}`
            ) || []
        }));

        // =========================================================
        // CHATBOT FAQ - UU TIEN DU LIEU D1
        // =========================================================
        const normalizeFaqText = (value) =>
          String(value ?? "")
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/đ/g, "d")
            .replace(/[^a-z0-9]+/g, " ")
            .trim();

        const normalizedMessage = normalizeFaqText(message);

        let faqMatch = null;
        let faqMatchScore = 0;

        try {
          const faqResult = await env.trung_tu_te_robot_db
            .prepare(`
              SELECT id, code, category, question, keywords,
                     answer_template, answer_type, sort_order
              FROM chatbot_faqs
              WHERE is_active = 1
              ORDER BY sort_order ASC, id ASC
            `)
            .all();

          for (const faq of faqResult.results || []) {
            const normalizedQuestion = normalizeFaqText(faq.question);

            const keywords = String(faq.keywords || "")
              .split(/[,;\n]+/)
              .map(item => normalizeFaqText(item))
              .filter(item => item.length >= 3);

            let score = 0;

            // Uu tien tu khoa duoc quan tri vien khai bao.
            for (const keyword of keywords) {
              if (normalizedMessage.includes(keyword)) {
                score += Math.min(keyword.split(" ").length + 2, 5);
              }
            }

            // Neu cau hoi FAQ xuat hien tron ven trong tin nhan.
            if (
              normalizedQuestion.length >= 8 &&
              normalizedMessage.includes(normalizedQuestion)
            ) {
              score += 5;
            }

            if (score > faqMatchScore) {
              faqMatch = faq;
              faqMatchScore = score;
            }
          }
        } catch (error) {
          // Khong de loi FAQ ngan chatbot su dung Gemini.
          console.error("CHATBOT FAQ READ ERROR:", error);
        }
        console.log("CHATBOT FAQ MATCH:", JSON.stringify({
          message,
          normalizedMessage,
          matchedCode: faqMatch?.code || null,
          score: faqMatchScore
        }));
        if (faqMatch && faqMatchScore >= 3) {
          const answerType = faqMatch.answer_type;
          const template = String(faqMatch.answer_template || "");

          // Tim dung model duoc nhac den trong cau hoi.
          const matchedRobot = catalog.find(robot => {
            const modelName = normalizeFaqText(
              `${robot.brand || ""} ${robot.model || ""}`
            );

            return modelName.length >= 3 &&
              normalizedMessage.includes(modelName);
          });

          // Cac FAQ theo thong so can co model ro rang.
          const modelDependentTypes = [
            "suction",
            "mop_wash_dry",
            "mop_lift",
            "obstacle_avoidance",
            "obstacle_clearance",
            "price"
          ];

          if (modelDependentTypes.includes(answerType) && !matchedRobot) {
            if (answerType === "suction") {
              const robotsWithSuction = catalog.filter(
                robot =>
                  robot.suction_power &&
                  String(robot.suction_power).trim()
              );

              const robotList = robotsWithSuction
                .slice(0, 5)
                .map(
                  (robot, index) =>
                    `${index + 1}. ${robot.brand} ${robot.model} (${robot.suction_power})`
                )
                .join("\n");

              if (robotList) {
                return Response.json({
                  ok: true,
                  reply:
                    "Dạ, hiện tại shop có các mẫu robot sau. " +
                    "Bạn muốn tìm hiểu lực hút của mẫu nào ạ?\n\n" +
                    robotList,
                  source: "catalog_selection"
                });
              }

              return Response.json({
                ok: true,
                reply:
                  "Dạ, hiện dữ liệu chưa có thông số lực hút để đối chiếu. " +
                  "Bạn gửi giúp mình tên model robot cần tìm hiểu nhé.",
                source: "faq"
              });
            }

            // Các FAQ thông số khác vẫn yêu cầu xác định model.
            faqMatch = null;
          } else {
            const safeValue = value =>
              value === null ||
              value === undefined ||
              String(value).trim() === ""
                ? "chưa có dữ liệu xác nhận"
                : String(value).trim();

            const mopLiftValue = matchedRobot?.carpet_mop_lift;
            const washValue = matchedRobot?.automatic_mop_washing;
            const dryValue = matchedRobot?.mop_drying;

            const featureList = matchedRobot
              ? matchedRobot.features
                  .map(feature =>
                    [feature.title, feature.description]
                      .filter(Boolean)
                      .join(": ")
                  )
                  .filter(Boolean)
                  .join("; ")
              : "";

            const replacements = {
              "{{model_name}}": matchedRobot
                ? `${matchedRobot.brand || ""} ${matchedRobot.model || ""}`.trim()
                : "",
              "{{suction}}": safeValue(matchedRobot?.suction_power),
              "{{mop_wash_status}}": safeValue(washValue),
              "{{mop_dry_status}}": safeValue(dryValue),
              "{{mop_lift_status}}": safeValue(mopLiftValue),
              "{{obstacle_features}}": safeValue(featureList),
              "{{obstacle_clearance}}": "chưa có dữ liệu xác nhận",
              "{{reference_price}}": safeValue(matchedRobot?.reference_price),
              "{{model_1}}": "",
              "{{model_2}}": ""
            };

            let reply = template;

            for (const [placeholder, value] of Object.entries(replacements)) {
              reply = reply.split(placeholder).join(value);
            }

            if (answerType === "contact") {
              reply +=
                "\n\n📞 Điện thoại: 0905 191 099" +
                "\n📘 Facebook: https://www.facebook.com/robotlaunhadaklak" +
                "\n💬 Zalo: https://zalo.me/0905191099";
            }

            if (reply.trim()) {
              return Response.json({
                ok: true,
                reply: reply.trim(),
                source: "faq",
                faqCode: faqMatch.code
              });
            }
          }
        }

        // =========================================================
        // CHATBOT - XU LY KHACH CHON MODEL TU DANH SACH TRUOC DO
        // Khong phu thuoc Gemini
        // =========================================================
        const selectionMatch = normalizeFaqText(message).match(
          /\b(?:mau|model|so)\s*(?:thu\s*)?([1-9])\b/
        );

        if (selectionMatch) {
          const selectedNumber = Number(selectionMatch[1]);

          const lastModelReply = [...history]
            .reverse()
            .find(item =>
              item.role === "model" &&
              typeof item.parts?.[0]?.text === "string"
            )?.parts?.[0]?.text || "";

          const lastUserMessage = [...history]
            .reverse()
            .find(item =>
              item.role === "user" &&
              typeof item.parts?.[0]?.text === "string"
            )?.parts?.[0]?.text || "";

          const normalizedPreviousReply =
            normalizeFaqText(lastModelReply);

          // Chi xu ly neu cau tra loi truoc do thuc su liet ke model.
          const listedRobots = catalog
            .map(robot => {
              const fullName = normalizeFaqText(
                `${robot.brand || ""} ${robot.model || ""}`
              );

              const position = normalizedPreviousReply.indexOf(fullName);

              return {
                robot,
                position,
                fullName
              };
            })
            .filter(item => item.position >= 0)
            .sort((a, b) => a.position - b.position);

          const previousReplyHasList =
            listedRobots.length >= selectedNumber &&
            /\b(?:1|2|3)[.)]/.test(lastModelReply);

          if (previousReplyHasList) {
            const selectedRobot =
              listedRobots[selectedNumber - 1].robot;

            const previousQuestion =
              normalizeFaqText(lastUserMessage);

            let reply =
              `Dạ, mẫu số ${selectedNumber} là ` +
              `${selectedRobot.brand} ${selectedRobot.model}.`;

            if (
              /luc hut|suction/.test(previousQuestion)
            ) {
              const suction =
                selectedRobot.suction_power;

              if (
                suction &&
                String(suction).trim()
              ) {
                reply +=
                  ` Mẫu này có thông số lực hút: ${String(suction).trim()}.`;
              } else {
                reply +=
                  " Hiện dữ liệu chưa có thông số lực hút xác nhận cho mẫu này.";
              }
            } else {
              reply +=
                " Bạn muốn tìm hiểu thêm thông số nào của mẫu này ạ?";
            }

            return Response.json({
              ok: true,
              reply,
              source: "catalog_selection",
              model: `${selectedRobot.brand} ${selectedRobot.model}`
            });
          }
        }
        // Khach chon so/model nhung khong co lich su de doi chieu.
        if (
          selectionMatch &&
          !history.some(item => item.role === "model")
        ) {
          return Response.json({
            ok: true,
            reply:
              "Dạ, bạn đang muốn hỏi mẫu robot nào ạ? " +
              "Bạn gửi giúp mình tên model hoặc câu hỏi trước đó " +
              "để mình tư vấn đúng mẫu nhé.",
            source: "clarify_model_selection"
          });
        }
        // FAQ khong phu hop: moi chuyen sang Gemini.

        if (!env.GEMINI_API_KEY) {
          return Response.json(
            { ok: false, error: "AI_UNAVAILABLE" },
            { status: 503 }
          );
        }

        const asksSuctionRanking =
        /lực hút|suction/i.test(message) &&
        /mạnh nhất|cao nhất|lớn nhất|xếp hạng|top\s*\d*|đứng đầu|mạnh hơn/i.test(message);

      const suctionRankingContext = asksSuctionRanking
        ? `DỮ LIỆU XẾP HẠNG LỰC HÚT ĐÃ TÍNH TỪ CƠ SỞ DỮ LIỆU:
      ${JSON.stringify(
        catalog
          .filter(robot => robot.suction_power_numeric_pa !== null)
          .sort((a, b) => b.suction_power_numeric_pa - a.suction_power_numeric_pa)
          .map(robot => ({
            brand: robot.brand,
            model: robot.model,
            suction_power: robot.suction_power,
            suction_power_numeric_pa: robot.suction_power_numeric_pa
          }))
      )}`
        : "";
        const systemInstruction = `

        Bạn là trợ lý tư vấn của Trung Tử Tế, chuyên robot lau nhà. Bạn hỗ trợ khách chọn robot, so sánh sản phẩm và xử lý các vấn đề kỹ thuật cơ bản.

        ## 1. NGUỒN DỮ LIỆU

        Danh mục robot bên dưới được lấy từ cơ sở dữ liệu website. Đây là nguồn dữ liệu chính để tư vấn sản phẩm.

        - Chỉ tư vấn các model có trong danh mục được cung cấp.
        - Chỉ nêu thông số, giá, tính năng và công nghệ khi dữ liệu có thông tin tương ứng.
        - Không tự suy đoán thông số còn thiếu dựa trên model tương tự hoặc kiến thức về model khác.
        - Nếu một trường dữ liệu trống hoặc không có, hãy nói rõ chưa có dữ liệu xác nhận.
        - Phân biệt thông tin do nhà sản xuất công bố với nhận định tư vấn thực tế.
        - Không khẳng định một tính năng tốt hơn model khác nếu dữ liệu không đủ căn cứ so sánh.
        - Khi khách yêu cầu xếp hạng hoặc tìm robot có lực hút mạnh nhất, phải dựa vào trường suction_power_numeric_pa và dữ liệu xếp hạng lực hút được cung cấp; không tự xếp hạng bằng cách đọc cảm tính chuỗi thông số.
        - Nếu nhiều model có cùng lực hút, không tự phân định model nào mạnh hơn.
        - Chỉ xếp hạng các model có dữ liệu lực hút hợp lệ; không tự điền giá trị còn thiếu.
        - Danh sách xếp hạng chỉ bao gồm robot nằm trong danh mục được cung cấp, không được tuyên bố đó là toàn bộ thị trường.
        ## NGUYÊN TẮC TƯ VẤN THEO MODEL CỤ THỂ

        Khi khách hỏi về một model robot cụ thể:

        - Ưu tiên sử dụng ai_content để hiểu nội dung giới thiệu và cách diễn giải sản phẩm đã được chuẩn bị trước.
        - Kết hợp với intro, highlights, pros, notes, suitable_for, features và thông số kỹ thuật liên quan để trả lời đúng câu hỏi.
        - Diễn đạt tự nhiên như nhân viên tư vấn đang trò chuyện trực tiếp; không chép nguyên văn toàn bộ nội dung AI đã tạo.
        - Trả lời đúng trọng tâm, giải thích lợi ích thực tế khi có dữ liệu hỗ trợ và không lặp lại toàn bộ thông số ở mỗi lượt.
        - Tận dụng nhu cầu, ngân sách, diện tích và thông tin nhà ở khách đã cung cấp trong lịch sử trò chuyện; không hỏi lại điều đã rõ.
        - Nếu khách nói “con này”, “model đó” hoặc “bản này”, hãy dựa vào lịch sử để xác định model. Nếu có nhiều khả năng, hỏi lại ngắn gọn.
        - Không xem ai_content là nguồn xác minh độc lập cho thông số kỹ thuật. Dùng các trường thông số có cấu trúc trong danh mục làm căn cứ cho thông số tương ứng.
        - Nếu ai_content mâu thuẫn với dữ liệu có cấu trúc, ưu tiên dữ liệu có cấu trúc cho thông số kỹ thuật; không tự chọn hoặc kết hợp các giá trị mâu thuẫn.
        - Chỉ nêu giá bán khi dữ liệu được cung cấp có giá rõ ràng và có căn cứ sử dụng. Nếu không có giá hoặc không xác định được giá còn hiệu lực, không tự đưa ra giá tham khảo.
        - Không khẳng định chắc chắn về hiệu quả hoặc mức độ phù hợp khi dữ liệu chưa đủ. Tránh các câu tuyệt đối như “không bỏ sót”, “hút sạch hoàn toàn”, “thừa sức” hoặc “hoàn toàn phù hợp” nếu không có căn cứ tương ứng.
        - Không tự suy ra diện tích làm sạch thực tế, thời gian hoạt động, khả năng chống rối hoặc khả năng xử lý mọi loại sàn từ một thông số riêng lẻ.
        - Khi dữ liệu chưa đủ để kết luận, hãy nêu rõ giới hạn thông tin và đưa ra nhận định có điều kiện thay vì đoán.
        ## 2. QUY TẮC TƯ VẤN CHỌN ROBOT

        Khi khách hỏi chọn robot, hãy xem xét các yếu tố phù hợp với câu hỏi:
        - Diện tích nhà và cách bố trí không gian.
        - Ngân sách.
        - Có nuôi chó, mèo hoặc có nhiều tóc, lông rụng hay không.
        - Loại sàn, thảm và mức độ bẩn.
        - Nhu cầu lau sàn, giặt giẻ, sấy giẻ và bảo trì.
        - Khả năng chống rối tóc, lông nếu dữ liệu sản phẩm có đề cập.

        Không chỉ dựa vào lực hút để kết luận robot phù hợp nhất.

        Diện tích làm sạch do hãng công bố không phải cam kết về diện tích thực tế trong mọi điều kiện. Không suy ra thời lượng pin hoặc diện tích sử dụng thực tế nếu dữ liệu không hỗ trợ.

        Nếu khách chưa cung cấp đủ thông tin để đưa ra lựa chọn có căn cứ, hãy hỏi thêm một câu ngắn về yếu tố quan trọng nhất còn thiếu, chẳng hạn ngân sách hoặc loại sàn.

        ## 3. CÁCH ĐỀ XUẤT MODEL
        - Khi đề xuất một robot cụ thể, luôn ghi rõ thương hiệu và tên model đầy đủ.
        - Giải thích ngắn gọn vì sao model đó có thể phù hợp với nhu cầu của khách, dựa trên dữ liệu hiện có.
        - Nêu hạn chế hoặc thông tin còn thiếu có ảnh hưởng đến quyết định.
        - Nếu có nhiều lựa chọn, hãy so sánh theo nhu cầu của khách thay vì mặc định model có lực hút cao nhất là tốt nhất.
        - Không tự tạo bảng xếp hạng hoặc tuyên bố model tốt nhất khi chưa đủ căn cứ.
        - Nếu chưa thể kết luận, hãy nói rõ và hỏi thêm thông tin cần thiết.
        ## 4. HỖ TRỢ KỸ THUẬT
        - Hướng dẫn kiểm tra, vệ sinh và xử lý lỗi cơ bản theo cách an toàn.
        - Phân biệt dấu hiệu quan sát được với nguyên nhân lỗi chỉ đang nghi ngờ.
        - Không khẳng định hỏng linh kiện khi chưa kiểm tra thực tế.
        - Với lỗi cần chuyên môn hoặc có nguy cơ mất an toàn, khuyên khách ngừng sử dụng nếu cần và liên hệ kỹ thuật viên.
        - Không yêu cầu khách cung cấp mật khẩu, mã OTP hoặc thông tin thanh toán.
        ## 5. VĂN PHONG VÀ CÁCH TRÒ CHUYỆN

        - Luôn trả lời bằng tiếng Việt tự nhiên, thân thiện, lịch sự như một nhân viên tư vấn am hiểu robot lau nhà.
        - Giọng điệu gần gũi, chân thành, không cứng nhắc như tài liệu kỹ thuật và không quảng cáo quá mức.
        - Trả lời trực tiếp điều khách hỏi trước, sau đó mới giải thích hoặc đưa ra gợi ý nếu cần.
        - Ưu tiên cách diễn đạt dễ hiểu, giải thích tính năng gắn với lợi ích thực tế khi có dữ liệu hỗ trợ.
        - Không lặp lại thông tin khách đã biết hoặc toàn bộ thông số của model trong mỗi lượt trò chuyện.
        - Với câu hỏi đơn giản, trả lời ngắn gọn. Với yêu cầu so sánh hoặc liệt kê, hoàn thành đầy đủ các mục khách yêu cầu.
        - Chỉ hỏi thêm khi thiếu thông tin thực sự ảnh hưởng đến tư vấn; mỗi lần chỉ hỏi một câu ngắn, tự nhiên.
        - Có thể gợi ý một hướng tìm hiểu tiếp theo khi phù hợp, nhưng không bắt buộc kết thúc bằng câu hỏi ở mọi lượt trả lời.
        - Khi khách chào hỏi, cảm ơn hoặc xác nhận, phản hồi tương ứng một cách tự nhiên, không tự động giới thiệu sản phẩm.
        - Không tự nhận đã trực tiếp trải nghiệm, kiểm tra hoặc sửa chữa robot.
        - Không tự tạo thông số, giá bán, chính sách bảo hành hoặc cam kết dịch vụ.
        - Với tư vấn thông thường, ưu tiên khoảng 40–100 từ; chỉ trả lời dài hơn khi khách yêu cầu phân tích, so sánh hoặc liệt kê chi tiết.
        - Luôn hoàn thành câu trả lời, không kết thúc giữa câu hoặc giữa một mục liệt kê.
        ## DANH MỤC ROBOT HIỆN CÓ

        Dữ liệu sản phẩm được cung cấp bên dưới:

        ${suctionRankingContext}

        DANH MỤC ROBOT:
        ${JSON.stringify(catalog)}
        `.trim();

        const model = env.GEMINI_MODEL || "gemini-3.8-flash";
        console.log("CHATBOT GEMINI CONFIG:", JSON.stringify({ model, maxOutputTokens: 2048, thinkingLevel: "low" }));
        const geminiResponse = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-goog-api-key": env.GEMINI_API_KEY
            },
            body: JSON.stringify({
              systemInstruction: {
                parts: [{ text: systemInstruction }]
              },
              contents: [
                ...history,
                {
                  role: "user",
                  parts: [{ text: message }]
                }
              ],
              generationConfig: {
                temperature: 0.3,
                maxOutputTokens: 2048,
                thinkingConfig: {
                  thinkingLevel: "low"
                }
              }
            })
          }
        );

if (!geminiResponse.ok) {
  const errorText = await geminiResponse.text();

  console.error(
    "CHATBOT GEMINI ERROR:",
    geminiResponse.status,
    errorText.slice(0, 1000)
  );

  return Response.json(
    {
      ok: false,
      error: "AI_UNAVAILABLE"
    },
    { status: 503 }
  );
}

        const geminiData = await geminiResponse.json();

        const candidate = geminiData?.candidates?.[0];
        const reply = (candidate?.content?.parts || [])
          .map(part => typeof part.text === "string" ? part.text : "")
          .join("")
          .trim();

          console.log("CHATBOT GEMINI RESULT:", JSON.stringify({
            finishReason: candidate?.finishReason || null,
            promptFeedback: geminiData?.promptFeedback?.blockReason || null,
            outputTokenCount: geminiData?.usageMetadata?.candidatesTokenCount ?? null,
            thoughtsTokenCount: geminiData?.usageMetadata?.thoughtsTokenCount ?? null,
            totalTokenCount: geminiData?.usageMetadata?.totalTokenCount ?? null,
            replyLength: reply.length
          }));

        if (!reply) {
          return Response.json(
            {
              ok: false,
              error: "AI chưa tạo được câu trả lời đầy đủ. Vui lòng thử lại."
            },
            { status: 502 }
          );
        }

        return Response.json({
          ok: true,
          reply,
          robotCount: robots.length,
          finishReason: candidate?.finishReason || null
        });

      } catch (error) {
        console.error("CHATBOT ERROR:", error);

        return Response.json(
          {
            ok: false,
            error: "Có lỗi khi xử lý tin nhắn. Vui lòng thử lại."
          },
          { status: 500 }
        );
      }
    }

    // =========================================================
// AI - GENERATE ROBOT CONTENT WITH GEMINI
// =========================================================
if (
  url.pathname ===
  "/api/ai/generate-robot-content"
) {
  if (request.method !== "POST") {
    return Response.json(
      {
        ok: false,
        error:
          "Chỉ hỗ trợ phương thức POST"
      },
      {
        status: 405
      }
    );
  }
  try {
    if (!env.GEMINI_API_KEY) {
      return Response.json(
        {
          ok: false,
          error:
            "Chưa cấu hình GEMINI_API_KEY"
        },
        {
          status: 500
        }
      );
    }
const body =
  await request.json();

const robotId =
  Number(body?.robotId);

if (
  !Number.isInteger(robotId) ||
  robotId <= 0
) {
  return Response.json(
    {
      ok: false,
      error:
        "robotId không hợp lệ"
    },
    {
      status: 400
    }
  );
}

// ---------------------------------------------------------
// LẤY THÔNG TIN ROBOT
// ---------------------------------------------------------

const robot =
  await env
    .trung_tu_te_robot_db
    .prepare(
      `
      SELECT
        id,
        brand,
        model,
        slug,
        year,
        category,
        status
      FROM robots
      WHERE id = ?
      LIMIT 1
      `
    )
    .bind(robotId)
    .first();

if (!robot) {
  return Response.json(
    {
      ok: false,
      error:
        "Không tìm thấy Robot"
    },
    {
      status: 404
    }
  );
}

// ---------------------------------------------------------
// LẤY THÔNG SỐ KỸ THUẬT
// ---------------------------------------------------------

const specs =
  await env
    .trung_tu_te_robot_db
    .prepare(
      `
      SELECT
        suction_power,
        obstacle_recognition,
        mopping_technology,
        mop_extension,
        side_brush_extension,
        automatic_mop_washing,
        mop_drying,
        wash_tray_self_cleaning,
        automatic_dust_emptying,
        automatic_detergent_dispensing,
        carpet_mop_lift,
        dust_bag_capacity,
        clean_dirty_water_capacity,
        battery_capacity,
        cleaning_area,
        robot_dimensions,
        dock_dimensions,
        reference_price
      FROM robot_specs
      WHERE robot_id = ?
      LIMIT 1
      `
    )
    .bind(robotId)
    .first();

// ---------------------------------------------------------
// LẤY TÍNH NĂNG NỔI BẬT
// ---------------------------------------------------------

const featuresResult =
  await env
    .trung_tu_te_robot_db
    .prepare(
      `
      SELECT
        title,
        description,
        sort_order
      FROM robot_features
      WHERE robot_id = ?
      ORDER BY
        sort_order,
        id
      `
    )
    .bind(robotId)
    .all();

const features =
  featuresResult.results || [];

// ---------------------------------------------------------
// LẤY NỘI DUNG HIỆN TẠI
// ---------------------------------------------------------
const content = await env.trung_tu_te_robot_db.prepare("SELECT intro, highlights, pros, notes, suitable_for, ai_content FROM robot_content WHERE robot_id = ? LIMIT 1").bind(robotId).first();;
// ---------------------------------------------------------
// DỮ LIỆU ĐƯA CHO GEMINI
// ---------------------------------------------------------

const sourceData = {
  robot,
  specs: specs || {},
  features,
  existingContent:
    content || {}
};

const prompt = `
Bạn là biên tập viên kỹ thuật cho website "Trung Tử Tế - Robot lau nhà".

NHIỆM VỤ

Dựa CHỈ trên dữ liệu được cung cấp cho đúng model robot đang biên tập, hãy viết nội dung giới thiệu kỹ thuật bằng tiếng Việt, tự nhiên, khách quan, súc tích và dễ đọc trên điện thoại.

Mục tiêu:
- Giúp khách hàng hiểu những tính năng đáng chú ý của robot.
- Giải thích lợi ích sử dụng thực tế của các tính năng có căn cứ.
- Nêu lưu ý sử dụng và bảo trì phù hợp.
- Xác định những nhu cầu sử dụng mà robot có thể đáp ứng dựa trên dữ liệu.

I. NGUYÊN TẮC SỬ DỤNG DỮ LIỆU

Dữ liệu đầu vào có thể bao gồm:
- Tên model robot.
- features: Danh sách tính năng đã được xác định cho chính model.
- specs: Thông số kỹ thuật.
- Các trường nội dung liên quan khác nếu có.

Bắt buộc tuân thủ:

1. Đọc và phân tích toàn bộ features trước khi viết.
2. Kết hợp features với specs để hiểu đúng tính năng, nhưng không yêu cầu một tính năng phải xuất hiện đồng thời ở cả hai nguồn mới được sử dụng.
3. Không bỏ qua tính năng đã có trong features chỉ vì tính năng đó không lặp lại trong specs.
4. Chỉ sử dụng dữ liệu thuộc đúng model đang biên tập.
5. Không tự bịa hoặc suy đoán thông số, tên công nghệ, cảm biến, cơ chế hoạt động hay tính năng.
6. Không lấy thông tin từ model khác để bổ sung.
7. Không biến thông tin chưa xác nhận thành thông số chính thức.
8. Nếu dữ liệu thể hiện đây là thông tin công bố hoặc kết quả thử nghiệm của nhà sản xuất, phải giữ nguyên tính chất đó khi diễn đạt.
9. Không biến kết quả thử nghiệm thành cam kết về hiệu quả sử dụng thực tế.
10. Chỉ giải thích lợi ích khi có căn cứ trực tiếp từ dữ liệu.
11. Không suy luận quá mức từ lực hút, dung lượng pin, diện tích làm sạch hoặc tên công nghệ.
12. Nếu dữ liệu mâu thuẫn hoặc chưa đủ căn cứ, diễn đạt thận trọng hoặc bỏ nhận định đó.
13. Không tự tạo nhược điểm, lỗi thường gặp, giới hạn kỹ thuật, chu kỳ bảo trì hoặc chi phí sửa chữa chưa được xác nhận.
14. Không tự điền thông tin còn thiếu bằng kiến thức chung hoặc bằng thông tin của model khác.

II. PHONG CÁCH BIÊN TẬP

- Viết tiếng Việt tự nhiên, rõ ràng, súc tích.
- Ưu tiên câu ngắn, dễ đọc trên điện thoại.
- Giọng văn tư vấn kỹ thuật, khách quan và thực tế.
- Không quảng cáo quá mức hoặc dùng lời khen chung chung.
- Không dùng các cụm từ như "tốt nhất", "hoàn hảo", "vượt trội tuyệt đối".
- Không viết câu dẫn dài dòng.
- Không liệt kê máy móc thông số trong phần diễn giải.
- Không lặp cùng một lợi ích giữa nhiều mục.
- Không kéo dài nội dung khi dữ liệu không đủ.
- Ưu tiên thông tin hữu ích cho quyết định sử dụng thực tế.

III. CẤU TRÚC NỘI DUNG

1. GIỚI THIỆU NGẮN - intro

- Viết khoảng 2-3 câu.
- Giới thiệu đặc điểm chính, định hướng công nghệ và khả năng sử dụng đáng chú ý của robot.
- Không liệt kê hàng loạt thông số.
- Không sao chép nguyên văn highlight_intro.
- Không nhận định về phân khúc hoặc đối tượng sử dụng nếu dữ liệu không hỗ trợ.

2. CHỨC NĂNG NỔI BẬT - highlight_intro

- Viết một đoạn khoảng 2-3 câu.
- Tóm tắt những tính năng quan trọng nhất của model dựa trên features và specs.
- Ưu tiên tính năng giúp người đọc nhận biết đặc điểm riêng của robot.
- Không cần đưa tất cả tính năng vào đoạn này.
- Không viết thành danh sách thông số.
- Không lặp nguyên văn intro.

3. ƯU ĐIỂM - pros

- Trả về một chuỗi văn bản, không phải mảng.
- Viết một đoạn ngắn, nêu khoảng 2-4 ưu điểm thực tế nếu dữ liệu đủ căn cứ.
- Tập trung vào giá trị sử dụng có thể giải thích trực tiếp từ tính năng đã xác nhận.
- Không biến thông số thành lời quảng cáo.
- Không lặp nguyên văn highlight_intro.
- Không khẳng định robot làm sạch tốt hơn, tiết kiệm thời gian hơn hoặc giảm công bảo trì nếu dữ liệu chưa đủ căn cứ.

4. GÓC NHÌN KỸ THUẬT TRUNG TỬ TẾ - technical_view

- Trả về một chuỗi văn bản.
- Viết khoảng 2-4 câu.
- Có thể đề cập:
  + Lưu ý khi sử dụng.
  + Vệ sinh và bảo trì phổ thông.
  + Điều kiện sử dụng liên quan trực tiếp đến tính năng.
  + Giới hạn đã được dữ liệu xác nhận.
- Không tự tạo lỗi thường gặp, chu kỳ bảo trì, tuổi thọ linh kiện hoặc chi phí sửa chữa.
- Không biến lời khuyên phổ thông thành thông số chính thức.
- Không cố tạo nhược điểm riêng của model nếu không có căn cứ.
- Nếu không có lưu ý đặc thù, chỉ đưa lời khuyên bảo trì phổ thông thực sự hữu ích và phù hợp với cấu tạo đã biết.

5. PHÙ HỢP VỚI AI - suitable_for

BẮT BUỘC trả về một MẢNG CHUỖI, không phải chuỗi văn bản.

Ví dụ:
"suitable_for": [
  "Người cần robot tự động hút bụi và lau sàn theo lịch.",
  "Gia đình muốn giảm thao tác vệ sinh giẻ lau thủ công, nếu model có chức năng giặt giẻ tự động."
]

Quy tắc:
- Mỗi phần tử là một ý độc lập, ngắn gọn, mô tả một nhu cầu sử dụng phù hợp với tính năng thực tế.
- Mỗi phần tử sẽ được hiển thị thành một gạch đầu dòng riêng trên website.
- Không thêm ký hiệu đầu dòng hoặc số thứ tự vào nội dung phần tử. Chỉ trả về câu chữ; giao diện sẽ tự tạo gạch đầu dòng.
- Chỉ nêu nhu cầu có căn cứ trực tiếp từ features hoặc specs.
- Không mặc định robot phù hợp với nhà lớn, nhà nhiều tầng, gia đình có thú cưng hoặc mọi loại sàn nếu dữ liệu không hỗ trợ.
- Không suy luận quá mức từ lực hút, dung lượng pin hoặc diện tích làm sạch.
- Không biến thông số thành cam kết robot đáp ứng một diện tích thực tế cụ thể.
- Không lặp lại cùng một nhu cầu bằng cách diễn đạt khác nhau.
- Ưu tiên từ 1 đến 5 ý nếu dữ liệu hỗ trợ; không bắt buộc phải đủ số lượng này.
- Nếu chỉ có một vài nhu cầu đủ căn cứ, chỉ trả về những nhu cầu đó.
- Nếu không có đủ dữ liệu để xác định nhu cầu phù hợp, trả về [].
- Không được trả về null, một chuỗi đơn hoặc một mảng chứa đối tượng.

6. CÁC CHỦ ĐỀ DIỄN GIẢI - sections

Tạo từ 1 đến tối đa 4 chủ đề dựa trên các nhóm tính năng thực tế của robot.

Mỗi chủ đề gồm:
- title: Tiêu đề ngắn, cụ thể, đúng với tính năng của model.
- content: Một đoạn văn khoảng 2-4 câu giải thích tính năng và lợi ích thực tế.

Yêu cầu:
- Phân tích toàn bộ features trước khi chọn chủ đề.
- Có thể gộp các tính năng liên quan thành một chủ đề.
- Không bỏ sót nhóm tính năng quan trọng chỉ để viết ngắn.
- Không tạo chủ đề chung chung hoặc không có căn cứ.
- Không biến nội dung thành danh sách thông số.
- Không lặp nguyên văn features.
- Chỉ nêu lợi ích có cơ sở trực tiếp từ dữ liệu.
- Không thêm công nghệ, cảm biến hoặc cơ chế hoạt động chưa được xác nhận.
- Hạn chế lặp thông số đã xuất hiện ở mục khác, trừ khi cần thiết để giải thích tính năng.

Các nhóm chủ đề có thể xem xét nếu dữ liệu hỗ trợ:
- Khả năng hút bụi và xử lý tóc, lông thú.
- Hệ thống lau sàn.
- Trạm sạc và quy trình vệ sinh tự động.
- Nhận diện, tránh vật cản và di chuyển.
- Khả năng tiếp cận mép tường hoặc vượt chướng ngại vật.
- Các tính năng tự động hóa hoặc tiện ích đặc thù khác.

Đây là gợi ý, không phải danh sách bắt buộc.

QUY TẮC BẮT BUỘC VỚI sections:
- Nếu features có ít nhất một tính năng đủ thông tin để diễn giải, sections phải có ít nhất một chủ đề.
- Chỉ trả về [] khi không có bất kỳ tính năng nào đủ căn cứ để diễn giải.
- Không trả về sections rỗng chỉ vì muốn viết ngắn.
- Tối đa 4 chủ đề, ưu tiên các nhóm tính năng có giá trị sử dụng rõ ràng nhất.

IV. QUY TẮC CHỐNG TRÙNG LẶP

Mỗi mục có nhiệm vụ riêng:

- intro: Giới thiệu tổng quan về model.
- highlight_intro: Tóm tắt những tính năng đáng chú ý nhất.
- pros: Nêu giá trị sử dụng thực tế.
- technical_view: Lưu ý sử dụng và bảo trì.
- suitable_for: Các nhu cầu sử dụng phù hợp, mỗi nhu cầu là một phần tử riêng.
- sections: Giải thích cụ thể các nhóm tính năng.

Không lặp nguyên văn cùng một câu hoặc cùng một ý ở nhiều mục.
Chỉ nhắc lại một tính năng khi mục đích giải thích khác nhau và thực sự cần thiết.

V. ĐỊNH DẠNG ĐẦU RA JSON

Chỉ trả về một đối tượng JSON hợp lệ theo cấu trúc sau:

{
  "intro": "Đoạn giới thiệu ngắn về model.",
  "highlight_intro": "Đoạn tóm tắt chức năng nổi bật.",
  "pros": "Đoạn tóm tắt ưu điểm thực tế.",
  "technical_view": "Đoạn nhận xét kỹ thuật và lưu ý sử dụng.",
  "suitable_for": [
    "Nhu cầu sử dụng phù hợp thứ nhất.",
    "Nhu cầu sử dụng phù hợp thứ hai."
  ],
  "sections": [
    {
      "title": "Tiêu đề chủ đề",
      "content": "Đoạn diễn giải tính năng và lợi ích thực tế."
    }
  ]
}

QUY TẮC JSON:
- Chỉ trả về JSON, không thêm Markdown hoặc dấu \`\`\` bao quanh.
- Không thêm lời dẫn trước JSON hoặc lời giải thích sau JSON.
- Dùng dấu ngoặc kép chuẩn JSON.
- Escape ký tự đặc biệt đúng quy tắc JSON.
- Không thêm dấu phẩy thừa ở cuối phần tử.
- Tất cả các trường phải có mặt.
- intro, highlight_intro, pros và technical_view phải là chuỗi.
- suitable_for phải luôn là mảng chuỗi.
- sections phải là mảng đối tượng gồm title và content.
- Không trả về null cho bất kỳ trường nào.
- Không thêm trường ngoài cấu trúc đã quy định.
- Nếu không đủ căn cứ cho suitable_for, dùng [].
- Chỉ dùng sections: [] khi không có tính năng nào đủ căn cứ để diễn giải.

VI. KIỂM TRA TRƯỚC KHI TRẢ KẾT QUẢ

Tự kiểm tra trước khi xuất JSON:
1. Đã phân tích toàn bộ features chưa?
2. Có bỏ sót nhóm tính năng quan trọng không?
3. Có thông số hoặc tính năng nào bị bịa hay suy đoán không?
4. Có biến thông tin thử nghiệm thành cam kết không?
5. Có nhận định nào không có căn cứ từ dữ liệu không?
6. Các mục có lặp nội dung không?
7. sections có ít nhất một chủ đề khi dữ liệu đủ căn cứ không?
8. suitable_for có đúng kiểu mảng chuỗi không?
9. Mỗi phần tử suitable_for có diễn đạt một nhu cầu riêng và không chứa ký hiệu đánh số không?
10. Nội dung có ngắn gọn, dễ đọc trên điện thoại không?
11. JSON có hợp lệ và đúng cấu trúc không?

Nếu có lỗi, hãy tự sửa trước khi trả kết quả.

NGUYÊN TẮC CUỐI CÙNG:
Chính xác trước, hữu ích sau, ngắn gọn nhưng không bỏ sót tính năng quan trọng. Không bịa dữ liệu, không suy diễn quá mức và không quảng cáo vượt quá căn cứ kỹ thuật.

DỮ LIỆU ROBOT CẦN BIÊN TẬP:
${JSON.stringify(sourceData, null, 2)}
`;
// ---------------------------------------------------------
// JSON SCHEMA CHO GEMINI
// ---------------------------------------------------------

const responseSchema = {
  type: "object",

  properties: {
    highlight_intro: {
      type: "string",
      description:
        "Đoạn giới thiệu ngắn cho phần Chức năng nổi bật."
    },

    sections: {
      type: "array",
      maxItems: 4,
      description:
        "Các chủ đề diễn giải phù hợp với robot. Không tạo chủ đề nếu dữ liệu không đủ.",
      items: {
        type: "object",

        properties: {
          title: {
            type: "string",
            description:
              "Tên chủ đề kỹ thuật."
          },

          paragraphs: {
            type: "array",
            description:
              "Các đoạn văn diễn giải cho chủ đề.",
            items: {
              type: "string"
            }
          }
        },

        required: [
          "title",
          "paragraphs"
        ]
      }
    },

    pros: {
      type: "string",
      description:
        "Tóm tắt những ưu điểm thực tế của robot dựa trên các tính năng và dữ liệu kỹ thuật đã được cung cấp. Không lặp lại máy móc phần Điểm nổi bật và không tự thêm thông số."
    },
    
    technical_view: {
      type: "string",
      description:
        "Góc nhìn kỹ thuật Trung Tử Tế."
    },

suitable_for: {
  type: "array",
  description:
    "Danh sách các nhóm người dùng hoặc nhu cầu phù hợp với robot. Mỗi phần tử là một ý độc lập, ngắn gọn và có căn cứ từ dữ liệu đầu vào. Không thêm ký hiệu gạch đầu dòng hoặc số thứ tự.",
  items: {
    type: "string"
  }
}
},

required: [
  "highlight_intro",
  "sections",
  "pros",
  "technical_view",
  "suitable_for"
]
};
// ---------------------------------------------------------
// GỌI GEMINI - MODEL ROUTER + MEMORY
// ---------------------------------------------------------

const primaryGeminiModel =
  env.GEMINI_MODEL ||
  "gemini-3.8-flash";

const defaultGeminiModels = [
  primaryGeminiModel,
  "gemini-3.8-flash",
  "gemini-3.7-flash",
  "gemini-3.1-flash-lite",
  "gemini-3.5-flash-lite"
].filter(
  (model, index, arr) =>
    model &&
    arr.indexOf(model) === index
);

// ---------------------------------------------------------
// ĐỌC MODEL ĐÃ THÀNH CÔNG GẦN NHẤT TỪ D1
// ---------------------------------------------------------

let rememberedGeminiModel = null;

try {
  const rememberedResult =
    await env.trung_tu_te_robot_db
      .prepare(
        `
        SELECT model
        FROM ai_model_status
        WHERE last_success_at IS NOT NULL
          AND (
            quota_reset_at IS NULL
            OR quota_reset_at <= ?
          )
        ORDER BY last_success_at DESC
        LIMIT 1
        `
      )
      .bind(
        new Date().toISOString()
      )
      .first();

  if (
    rememberedResult &&
    rememberedResult.model
  ) {
    rememberedGeminiModel =
      rememberedResult.model;

    console.log(
      "GEMINI REMEMBERED MODEL:",
      rememberedGeminiModel
    );
  }
} catch (memoryError) {
  console.error(
    "GEMINI MEMORY READ ERROR:",
    memoryError
  );
}

// ---------------------------------------------------------
// TẠO THỨ TỰ MODEL
//
// Ưu tiên:
// 1. Model thành công gần nhất
// 2. Model trong GEMINI_MODEL
// 3. Các model fallback
// ---------------------------------------------------------

const geminiModels = [
  rememberedGeminiModel,
  ...defaultGeminiModels
].filter(
  (model, index, arr) =>
    model &&
    arr.indexOf(model) === index
);

console.log(
  "GEMINI MODEL ORDER:",
  geminiModels
);

let geminiResponse = null;
let lastGeminiErrorText = "";
let usedGeminiModel =
  rememberedGeminiModel ||
  primaryGeminiModel;

// ---------------------------------------------------------
// DUYỆT QUA CÁC MODEL
// ---------------------------------------------------------

for (
  let modelIndex = 0;
  modelIndex < geminiModels.length;
  modelIndex++
) {
  const geminiModel =
    geminiModels[modelIndex];

  // -------------------------------------------------------
  // KIỂM TRA MODEL CÓ ĐANG BỊ QUOTA BLOCK KHÔNG
  // -------------------------------------------------------

  try {
    const modelStatus =
      await env.trung_tu_te_robot_db
        .prepare(
          `
          SELECT
            status,
            quota_reset_at
          FROM ai_model_status
          WHERE model = ?
          LIMIT 1
          `
        )
        .bind(geminiModel)
        .first();

    if (
      modelStatus &&
      modelStatus.status ===
        "quota_exceeded" &&
      modelStatus.quota_reset_at &&
      new Date(
        modelStatus.quota_reset_at
      ).getTime() >
        Date.now()
    ) {
      console.warn(
        "GEMINI SKIP QUOTA MODEL:",
        {
          model: geminiModel,
          quota_reset_at:
            modelStatus.quota_reset_at
        }
      );

      continue;
    }

    // Nếu thời gian quota đã hết
    // thì mở lại model
    if (
      modelStatus &&
      modelStatus.status ===
        "quota_exceeded" &&
      modelStatus.quota_reset_at &&
      new Date(
        modelStatus.quota_reset_at
      ).getTime() <=
        Date.now()
    ) {
      await env.trung_tu_te_robot_db
        .prepare(
          `
          UPDATE ai_model_status
          SET
            status = 'available',
            quota_reset_at = NULL,
            updated_at = CURRENT_TIMESTAMP
          WHERE model = ?
          `
        )
        .bind(geminiModel)
        .run();

      console.log(
        "GEMINI QUOTA RESET:",
        geminiModel
      );
    }
  } catch (statusError) {
    console.error(
      "GEMINI MODEL STATUS ERROR:",
      statusError
    );
  }

  console.log(
    "GEMINI TRY MODEL:",
    geminiModel
  );

  // -------------------------------------------------------
  // THỬ CÙNG MODEL TỐI ĐA 2 LẦN
  // -------------------------------------------------------

  for (
    let attempt = 1;
    attempt <= 2;
    attempt++
  ) {
    const geminiUrl =
      `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent`;

    geminiResponse =
      await fetch(
        geminiUrl,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
            "x-goog-api-key":
              env.GEMINI_API_KEY
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: prompt
                  }
                ]
              }
            ],
            generationConfig: {
              temperature: 0.4,
              responseMimeType:
                "application/json",
              responseSchema
            }
          })
        }
      );

    // -----------------------------------------------------
    // THÀNH CÔNG
    // -----------------------------------------------------

    if (geminiResponse.ok) {
      usedGeminiModel =
        geminiModel;

      console.log(
        "GEMINI SUCCESS:",
        geminiModel
      );

      // ---------------------------------------------------
      // GHI NHỚ MODEL THÀNH CÔNG
      // ---------------------------------------------------

      try {
        await env.trung_tu_te_robot_db
          .prepare(
            `
            INSERT INTO ai_model_status (
            model,
            status,
            last_success_at,
            quota_reset_at,
            last_error_status,
            updated_at
            )
            VALUES (?, 'active', ?, NULL, NULL, CURRENT_TIMESTAMP)
            ON CONFLICT(model) DO UPDATE SET
            status = 'active',
            last_success_at = excluded.last_success_at,
            quota_reset_at = NULL,
            last_error_status = NULL,
            updated_at = CURRENT_TIMESTAMP
            `
          )
          .bind(
            geminiModel,
            new Date().toISOString()
          )
          .run();

        console.log(
          "GEMINI MEMORY SAVED:",
          geminiModel
        );
      } catch (memorySaveError) {
        console.error(
          "GEMINI MEMORY SAVE ERROR:",
          memorySaveError
        );
      }

      break;
    }

    // -----------------------------------------------------
    // ĐỌC RESPONSE ERROR
    // -----------------------------------------------------

    lastGeminiErrorText =
      await geminiResponse.text();

    console.error(
      "GEMINI ERROR:",
      {
        model: geminiModel,
        attempt,
        status:
          geminiResponse.status,
        details:
          lastGeminiErrorText
      }
    );

    // -----------------------------------------------------
    // 429 - QUOTA / RATE LIMIT
    // -----------------------------------------------------

    if (
      geminiResponse.status ===
      429
    ) {
      let quotaResetAt =
        null;

      // Gemini thường trả về retryDelay
      // trong JSON error response.
      try {
        const errorData =
          JSON.parse(
            lastGeminiErrorText
          );

        const retryInfo =
          errorData?.error?.details?.find(
            (detail) =>
              detail["@type"] ===
              "type.googleapis.com/google.rpc.RetryInfo"
          );

        const retryDelay =
          retryInfo?.retryDelay;

        if (retryDelay) {
          let delaySeconds = 0;

          const secondsMatch =
            String(
              retryDelay
            ).match(
              /([\d.]+)s/
            );

          if (
            secondsMatch
          ) {
            delaySeconds =
              Number(
                secondsMatch[1]
              );
          }

          if (
            delaySeconds > 0
          ) {
            quotaResetAt =
              new Date(
                Date.now() +
                  delaySeconds *
                    1000
              ).toISOString();
          }
        }
      } catch (parseError) {
        console.warn(
          "GEMINI RETRY INFO PARSE ERROR:",
          parseError
        );
      }

      // ---------------------------------------------------
      // LƯU TRẠNG THÁI QUOTA
      // ---------------------------------------------------

      try {
        await env.trung_tu_te_robot_db
          .prepare(
            `
            UPDATE ai_model_status
            SET
              status = 'quota_exceeded',
              last_error_at = ?,
              quota_reset_at = ?,
              error_count =
                error_count + 1,
              last_error_status = 429,
              updated_at =
                CURRENT_TIMESTAMP
            WHERE model = ?
            `
          )
          .bind(
            new Date().toISOString(),
            quotaResetAt,
            geminiModel
          )
          .run();

        console.log(
          "GEMINI QUOTA SAVED:",
          {
            model: geminiModel,
            quota_reset_at:
              quotaResetAt
          }
        );
      } catch (quotaSaveError) {
        console.error(
          "GEMINI QUOTA SAVE ERROR:",
          quotaSaveError
        );
      }

      console.warn(
        "GEMINI QUOTA/RATE LIMIT - FALLBACK:",
        geminiModel
      );

      break;
    }

    // -----------------------------------------------------
    // 503 - SERVER OVERLOAD
    // -----------------------------------------------------

    if (
      geminiResponse.status ===
        503 &&
      attempt < 2
    ) {
      const retryDelay =
        attempt === 1
          ? 1000
          : 2000;

      await new Promise(
        (resolve) =>
          setTimeout(
            resolve,
            retryDelay
          )
      );

      continue;
    }

    break;
  }

  // -------------------------------------------------------
  // MODEL HIỆN TẠI THÀNH CÔNG
  // -------------------------------------------------------

  if (
    geminiResponse &&
    geminiResponse.ok
  ) {
    break;
  }

  // -------------------------------------------------------
  // 503 SAU KHI RETRY
  // -------------------------------------------------------

  if (
    geminiResponse?.status ===
    503
  ) {
    try {
      await env.trung_tu_te_robot_db
        .prepare(
          `
          UPDATE ai_model_status
          SET
            status = 'temporary_error',
            last_error_at = ?,
            error_count =
              error_count + 1,
            last_error_status = 503,
            updated_at =
              CURRENT_TIMESTAMP
          WHERE model = ?
          `
        )
        .bind(
          new Date().toISOString(),
          geminiModel
        )
        .run();
    } catch (statusSaveError) {
      console.error(
        "GEMINI 503 STATUS SAVE ERROR:",
        statusSaveError
      );
    }

    console.warn(
      "GEMINI 503 - FALLBACK:",
      geminiModel
    );

    continue;
  }

  // -------------------------------------------------------
  // CÁC LỖI KHÁC: DỪNG NGAY
  // -------------------------------------------------------

  break;
}

// ---------------------------------------------------------
// KHÔNG CÓ MODEL NÀO THÀNH CÔNG
// ---------------------------------------------------------

if (
  !geminiResponse ||
  !geminiResponse.ok
) {
  console.error(
    "GEMINI FINAL ERROR:",
    {
      model:
        usedGeminiModel,
      status:
        geminiResponse?.status ||
        500,
      details:
        lastGeminiErrorText
    }
  );

  return Response.json(
    {
      ok: false,
      error:
        `Gemini API lỗi: ${
          geminiResponse?.status ||
          500
        }`,
      details:
        lastGeminiErrorText,
      model:
        usedGeminiModel
    },
    {
      status: 502
    }
  );
}

console.log(
  "GEMINI FINAL MODEL:",
  usedGeminiModel
);
const geminiData =
  await geminiResponse.json();
const generatedText =
  geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;
if (!generatedText) {
  return Response.json(
    {
      ok: false,
      error:
        "Gemini không trả về nội dung"
    },
    {
      status: 502
    }
  );
}
let aiContent;
try {
  aiContent =
    JSON.parse(generatedText);
} catch (error) {
  return Response.json(
    {
      ok: false,
      error:
        "Gemini trả về JSON không hợp lệ",
      raw:
        generatedText
    },
    {
      status: 502
    }
  );
}

// ---------------------------------------------------------
// KIỂM TRA CẤU TRÚC CƠ BẢN
// ---------------------------------------------------------

if (
  typeof aiContent.highlight_intro !==
    "string" ||
  !Array.isArray(
    aiContent.sections
  ) ||
  typeof aiContent.technical_view !==
    "string" ||
    !Array.isArray(aiContent.suitable_for) ||
    !aiContent.suitable_for.every(
      item => typeof item === "string"
    )
) {
  return Response.json(
    {
      ok: false,
      error:
        "Cấu trúc nội dung Gemini không hợp lệ",
      aiContent
    },
    {
      status: 502
    }
  );
}


return Response.json({
  ok: true,

  robot: {
    id:
      robot.id,
    brand:
      robot.brand,
    model:
      robot.model,
    slug:
      robot.slug
  },

  aiContent
});

  } catch (error) {
    return Response.json(
      {
        ok: false,
        error:
          error.message
      },
      {
        status: 500
      }
    );
  }
}

// =========================================================
// TEST GEMINI API
// =========================================================
if (
  url.pathname === "/api/ai/test-gemini" &&
  request.method === "GET"
) {
  const isAdmin =
    await requireAdminSession(
      request,
      env
    );

  if (!isAdmin) {
    return Response.json(
      {
        ok: false,
        error: "Chưa đăng nhập quản trị"
      },
      { status: 401 }
    );
  }

  try {
    if (!env.GEMINI_API_KEY) {
      return Response.json(
        {
          ok: false,
          error: "Thiếu GEMINI_API_KEY"
        },
        { status: 500 }
      );
    }
  
    const testModel =
      env.GEMINI_MODEL ||
      "gemini-3.6-flash";
  
    const response =
      await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${testModel}:generateContent`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key":
              env.GEMINI_API_KEY
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text:
                      "Trả lời đúng một câu: Xin chào Trung Tử Tế."
                  }
                ]
              }
            ]
          })
        }
      );
  
    const text =
      await response.text();
  
    console.log(
      "GEMINI GENERATE TEST:",
      response.status,
      text
    );
  
    return Response.json(
      {
        ok: response.ok,
        status: response.status,
        model: testModel,
        gemini: text
      },
      {
        status: response.ok
          ? 200
          : 502
      }
    );
  } catch (error) {
    console.error(
      "GEMINI GENERATE TEST ERROR:",
      error
    );
  
    return Response.json(
      {
        ok: false,
        error: error.message
      },
      { status: 500 }
    );
  }
}
// =========================================================
// ADMIN - SAVE AI ROBOT CONTENT
// =========================================================

const aiContentMatch =
  url.pathname.match(
    /^\/api\/admin\/robot\/(\d+)\/ai-content$/
  );

if (
  aiContentMatch &&
  request.method === "POST"
) {
  const isAdmin =
    await requireAdminSession(
      request,
      env
    );

  if (!isAdmin) {
    return Response.json(
      {
        ok: false,
        error: "Chưa đăng nhập quản trị"
      },
      {
        status: 401
      }
    );
  }

  try {
    const robotId =
      Number(
        aiContentMatch[1]
      );

    if (
      !Number.isInteger(robotId) ||
      robotId <= 0
    ) {
      return Response.json(
        {
          ok: false,
          error: "robotId không hợp lệ"
        },
        {
          status: 400
        }
      );
    }

    const body =
      await request.json();

    const aiContent =
      body?.aiContent;

      if (
        !aiContent ||
        typeof aiContent.highlight_intro !== "string" ||
        !Array.isArray(aiContent.sections) ||
        typeof aiContent.pros !== "string" ||
        typeof aiContent.technical_view !== "string" ||
        !Array.isArray(aiContent.suitable_for) ||
        aiContent.suitable_for.some(
          item => typeof item !== "string"
        )
      ) {
      return Response.json(
        {
          ok: false,
          error:
            "Cấu trúc nội dung AI không hợp lệ"
        },
        {
          status: 400
        }
      );
    }

    if (
      aiContent.sections.length > 4
    ) {
      return Response.json(
        {
          ok: false,
          error:
            "Nội dung AI không được vượt quá 4 chủ đề"
        },
        {
          status: 400
        }
      );
    }

    const robot =
      await env
        .trung_tu_te_robot_db
        .prepare(
          `
          SELECT
            id,
            brand,
            model,
            slug
          FROM robots
          WHERE id = ?
          LIMIT 1
          `
        )
        .bind(robotId)
        .first();

    if (!robot) {
      return Response.json(
        {
          ok: false,
          error:
            "Không tìm thấy Robot"
        },
        {
          status: 404
        }
      );
    }

    const aiJson =
      JSON.stringify(
        aiContent
      );

    const existingContent =
      await env
        .trung_tu_te_robot_db
        .prepare(
          `
          SELECT id
          FROM robot_content
          WHERE robot_id = ?
          LIMIT 1
          `
        )
        .bind(robotId)
        .first();

    if (existingContent) {
      await env
        .trung_tu_te_robot_db
        .prepare(
          `
          UPDATE robot_content
          SET
            ai_content = ?,
            updated_at =
              CURRENT_TIMESTAMP
          WHERE robot_id = ?
          `
        )
        .bind(
          aiJson,
          robotId
        )
        .run();
    } else {
      await env
        .trung_tu_te_robot_db
        .prepare(
          `
          INSERT INTO robot_content
          (
            robot_id,
            ai_content
          )
          VALUES (?, ?)
          `
        )
        .bind(
          robotId,
          aiJson
        )
        .run();
    }

    return Response.json({
      ok: true,
      message:
        "Đã lưu nội dung AI",
      robot: {
        id: robot.id,
        brand: robot.brand,
        model: robot.model,
        slug: robot.slug
      },
      aiContent
    });

  } catch (error) {
    return Response.json(
      {
        ok: false,
        error:
          error.message
      },
      {
        status: 500
      }
    );
  }
}
    // =========================================================
    // GET ROBOT BY SLUG
    // =========================================================

    if (
      url.pathname.startsWith(
        "/api/robot/"
      )
    ) {
      try {
        const slug =
          decodeURIComponent(
            url.pathname
              .replace(
                "/api/robot/",
                ""
              )
              .replace(
                /\/$/,
                ""
              )
          );

        if (!slug) {
          return Response.json(
            {
              ok: false,
              error:
                "Thiếu slug Robot"
            },
            {
              status: 400
            }
          );
        }

        const robot =
          await env
            .trung_tu_te_robot_db
            .prepare(
              `
              SELECT
                id,
                brand,
                model,
                slug,
                year,
                category,
                status,
                created_at,
                updated_at
              FROM robots
              WHERE slug = ?
              LIMIT 1
              `
            )
            .bind(slug)
            .first();

        if (!robot) {
          return Response.json(
            {
              ok: false,
              error:
                "Không tìm thấy Robot"
            },
            {
              status: 404
            }
          );
        }

        const specs =
          await env
            .trung_tu_te_robot_db
            .prepare(
              `
              SELECT
              suction_power,
              obstacle_recognition,
              mopping_technology,
              mop_extension,
              side_brush_extension,
              automatic_mop_washing,
              mop_drying,
              wash_tray_self_cleaning,
              automatic_dust_emptying,
              automatic_detergent_dispensing,
              carpet_mop_lift,
              dust_bag_capacity,
              clean_dirty_water_capacity,
              battery_capacity,
              cleaning_area,
              robot_dimensions,
              dock_dimensions,
              reference_price,
              updated_at
            FROM robot_specs
            WHERE robot_id = ?
            LIMIT 1
              `
            )
            .bind(robot.id)
            .first();

        const featuresResult =
          await env
            .trung_tu_te_robot_db
            .prepare(
              `
              SELECT
                id,
                title,
                description,
                sort_order
              FROM robot_features
              WHERE robot_id = ?
              ORDER BY sort_order, id
              `
            )
            .bind(robot.id)
            .all();

        const content =
          await env
            .trung_tu_te_robot_db
            .prepare(
              `
              SELECT
            intro,
            highlights,
            pros,
            notes,
            suitable_for,
            ai_content,
            updated_at
            FROM robot_content
            WHERE robot_id = ?
            LIMIT 1
              `
            )
            .bind(robot.id)
            .first();

        const imagesResult =
          await env
            .trung_tu_te_robot_db
            .prepare(
              `
              SELECT
                id,
                drive_id,
                file_name,
                mime_type,
                sort_order,
                is_primary
              FROM robot_images
              WHERE robot_id = ?
              ORDER BY sort_order, id
              `
            )
            .bind(robot.id)
            .all();

        const images =
          (
            imagesResult.results ||
            []
          ).map(
            (image) => ({
              id:
                image.id,

              driveId:
                image.drive_id,

              fileName:
                image.file_name,

              mimeType:
                image.mime_type,

              sortOrder:
                image.sort_order,

              isPrimary:
                Boolean(
                  image.is_primary
                ),

              url:
                `/api/image/${image.drive_id}`
            })
          );

        return Response.json({
          ok: true,

          robot: {
            ...robot,

            specs:
              specs || null,

            features:
              featuresResult.results ||
              [],

            content:
              content || null,

            images
          }
        });
      } catch (error) {
        return Response.json(
          {
            ok: false,
            error:
              error.message
          },
          {
            status: 500
          }
        );
      }
    }
    // =========================================================
    // TEST GOOGLE DRIVE
    // =========================================================

    if (
      url.pathname ===
      "/api/test-drive"
    ) {
      try {
        const rootFolderId =
          "1ExFyhXLgdWho7zMc1peSm0s_4rCAa8Bc";

        const rootItems =
          await listDriveFolder(
            env,
            rootFolderId
          );

        return Response.json({
          ok: true,
          rootFolderId,
          itemCount:
            rootItems.length,
          items:
            rootItems
        });
      } catch (error) {
        return Response.json(
          {
            ok: false,
            error:
              error.message
          },
          { status: 500 }
        );
      }
    }

     // =========================================================
    // ROBOTS API - D1
    // =========================================================

    if (
      url.pathname ===
      "/api/robots"
    ) {
      try {

        const robotsResult =
          await env
            .trung_tu_te_robot_db
            .prepare(
              `
              SELECT
  r.id,
  r.brand,
  r.model,
  r.slug,
  r.year,
  CASE
    WHEN rc.ai_content IS NOT NULL
      AND TRIM(rc.ai_content) != ''
    THEN 1
    ELSE 0
  END AS has_ai_content
FROM robots r
LEFT JOIN robot_content rc
  ON rc.robot_id = r.id
ORDER BY
  r.brand ASC,
  r.model ASC
              `
            )
            .all();

const robots =
robotsResult.results || [];

const imagesResult =
await env
  .trung_tu_te_robot_db
  .prepare(
    `
    SELECT
      robot_id,
      drive_id,
      file_name,
      sort_order,
      is_primary
    FROM robot_images
    ORDER BY
      sort_order ASC,
      id ASC
    `
  )
  .all();

const imagesByRobotId = new Map();

for (const image of imagesResult.results || []) {
if (!imagesByRobotId.has(image.robot_id)) {
  imagesByRobotId.set(image.robot_id, []);
}

imagesByRobotId.get(image.robot_id).push({
  id: image.drive_id,
  fileName: image.file_name,
  sortOrder: image.sort_order,
  primary: Boolean(image.is_primary),
  url: `/api/image/${image.drive_id}`
});
}

for (const robot of robots) {
robot.images =
  imagesByRobotId.get(robot.id) || [];
}


        return Response.json({
          ok: true,
          robotCount:
            robots.length,
          robots
        });

      } catch (error) {

        return Response.json(
          {
            ok: false,
            error:
              error.message
          },
          {
            status: 500
          }
        );
      }
    }
        // =========================================================
    // DRIVE FOLDERS - ADMIN
    // Lấy danh sách thư mục hình ảnh từ Google Drive
    // =========================================================

    if (
      url.pathname ===
        "/api/admin/drive/folders" &&
      request.method === "GET"
    ) {
      const isAdmin =
      await requireAdminSession(
        request,
        env
      );

    if (!isAdmin) {
      return Response.json(
        {
          ok: false,
          error: "Unauthorized"
        },
        {
          status: 401
        }
      );
    }

      try {

        const rootFolderId =
          "1ExFyhXLgdWho7zMc1peSm0s_4rCAa8Bc";

        const allItems =
          await listDriveFolder(
            env,
            rootFolderId
          );

        const folders =
          allItems
            .filter(
              function (item) {
                return (
                  item.mimeType ===
                  "application/vnd.google-apps.folder"
                );
              }
            )
            .map(
              function (folder) {

                return {
                  id:
                    folder.id,

                  name:
                    folder.name,

                  path:
                    folder.path
                };

              }
            );

        return Response.json({

          ok: true,

          rootFolderId,

          folderCount:
            folders.length,

          folders

        });

      } catch (error) {

        return Response.json(
          {
            ok: false,
            error:
              error.message
          },
          {
            status: 500
          }
        );

      }

    }
     // =========================================================
    // AVAILABLE ROBOT IMAGES - ADMIN
    // Lấy hình ảnh từ thư mục Google Drive được chọn
    // =========================================================

    if (
      url.pathname.startsWith(
        "/api/admin/robot/"
      ) &&
      url.pathname.endsWith(
        "/available-images"
      ) &&
      request.method === "GET"
    ) {
      const isAdmin =
        await requireAdminSession(
          request,
          env
        );
      if (!isAdmin) {
        return Response.json(
          {
            ok: false,
            error: "Unauthorized"
          },
          {
            status: 401
          }
        );
      }
      try {

        const parts =
          url.pathname
            .split("/")
            .filter(Boolean);

        const robotIndex =
          parts.indexOf("robot");

        const robotId =
          Number(
            parts[robotIndex + 1]
          );

        if (
          !Number.isInteger(robotId) ||
          robotId <= 0
        ) {
          return Response.json(
            {
              ok: false,
              error:
                "Robot ID không hợp lệ"
            },
            {
              status: 400
            }
          );
        }

        const robot =
          await env
            .trung_tu_te_robot_db
            .prepare(
              `
              SELECT
                id,
                brand,
                model
              FROM robots
              WHERE id = ?
              LIMIT 1
              `
            )
            .bind(
              robotId
            )
            .first();

        if (!robot) {
          return Response.json(
            {
              ok: false,
              error:
                "Không tìm thấy Robot"
            },
            {
              status: 404
            }
          );
        }

        const folderId =
          url.searchParams.get(
            "folderId"
          );

        if (!folderId) {
          return Response.json(
            {
              ok: false,
              error:
                "Chưa chọn thư mục Google Drive"
            },
            {
              status: 400
            }
          );
        }

        const accessToken =
          await createGoogleAccessToken(
            env
          );

        const driveUrl =
          "https://www.googleapis.com/drive/v3/files" +
          `?q=${encodeURIComponent(
            `'${folderId}' in parents and trashed = false`
          )}` +
          "&fields=files(id,name,mimeType)" +
          "&pageSize=100";

        const driveResponse =
          await fetch(
            driveUrl,
            {
              headers: {
                Authorization:
                  `Bearer ${accessToken}`
              }
            }
          );

        if (!driveResponse.ok) {
          throw new Error(
            "Google Drive API lỗi: " +
            driveResponse.status +
            " " +
            await driveResponse.text()
          );
        }

        const driveData =
          await driveResponse.json();

        const driveImages =
          (
            driveData.files ||
            []
          )
            .filter(
              function (item) {
                return (
                  item.mimeType &&
                  item.mimeType.startsWith(
                    "image/"
                  )
                );
              }
            )
            .map(
              function (image) {

                return {
                  driveId:
                    image.id,

                  fileName:
                    image.name,

                  mimeType:
                    image.mimeType,

                  url:
                    `/api/image/${image.id}`
                };

              }
            );

        const existingResult =
          await env
            .trung_tu_te_robot_db
            .prepare(
              `
              SELECT
                drive_id
              FROM robot_images
              WHERE robot_id = ?
              `
            )
            .bind(
              robotId
            )
            .all();

        const existingIds =
          new Set(
            (
              existingResult.results ||
              []
            ).map(
              function (item) {
                return item.drive_id;
              }
            )
          );

        const availableImages =
          driveImages.filter(
            function (image) {
              return !existingIds.has(
                image.driveId
              );
            }
          );

        return Response.json({

          ok: true,

          robotId,

          brand:
            robot.brand,

          model:
            robot.model,

          folderId,

          imageCount:
            availableImages.length,

          images:
            availableImages

        });

      } catch (error) {

        return Response.json(
          {
            ok: false,
            error:
              error.message
          },
          {
            status: 500
          }
        );

      }

    }
    // =========================================================
    // UPDATE ROBOT - ADMIN
    // =========================================================

    if (
      url.pathname.startsWith(
        "/api/admin/robot/"
      ) &&
      request.method === "PUT"
    ) {
      const isAdmin =
        await requireAdminSession(
          request,
          env
        );
      if (!isAdmin) {
        return Response.json(
          {
            ok: false,
            error: "Unauthorized"
          },
          {
            status: 401
          }
        );
      }
      try {

        const parts =
          url.pathname
            .split("/")
            .filter(Boolean);

        const robotId =
          Number(
            parts[parts.length - 1]
          );

        if (
          !Number.isInteger(robotId) ||
          robotId <= 0
        ) {
          return Response.json(
            {
              ok: false,
              error: "Robot ID không hợp lệ"
            },
            {
              status: 400
            }
          );
        }

        const body =
          await request.json();

        const robot =
          body.robot || {};

        const specs =
          body.specs || {};

        const content =
          body.content || {};

          const features =
          Array.isArray(
            body.features
          )
            ? body.features
            : [];

        const images =
          Array.isArray(
            body.images
          )
            ? body.images
            : null;

        const existingRobot =
          await env
            .trung_tu_te_robot_db
            .prepare(
              `
              SELECT
                id,
                slug
              FROM robots
              WHERE id = ?
              LIMIT 1
              `
            )
            .bind(
              robotId
            )
            .first();


        if (!existingRobot) {

          return Response.json(
            {
              ok: false,
              error: "Không tìm thấy robot"
            },
            {
              status: 404
            }
          );

        }


        const statements = [];


        statements.push(
          env
            .trung_tu_te_robot_db
            .prepare(
              `
              UPDATE robots
              SET
                brand = ?,
                model = ?,
                year = ?,
                category = ?,
                status = ?,
                updated_at = CURRENT_TIMESTAMP
              WHERE id = ?
              `
            )
            .bind(
              robot.brand || "",
              robot.model || "",
              robot.year === "" ||
              robot.year === null ||
              robot.year === undefined
                ? null
                : Number(robot.year),
              robot.category || "",
              robot.status || "active",
              robotId
            )
        );


        statements.push(
          env
            .trung_tu_te_robot_db
            .prepare(
              `
              UPDATE robot_specs
              SET
              suction_power = ?,
              obstacle_recognition = ?,
              mopping_technology = ?,
              mop_extension = ?,
              side_brush_extension = ?,
              automatic_mop_washing = ?,
              mop_drying = ?,
              wash_tray_self_cleaning = ?,
              automatic_dust_emptying = ?,
              automatic_detergent_dispensing = ?,
              carpet_mop_lift = ?,
              dust_bag_capacity = ?,
              clean_dirty_water_capacity = ?,
              battery_capacity = ?,
              cleaning_area = ?,
              robot_dimensions = ?,
              dock_dimensions = ?,
              reference_price = ?,
              updated_at = CURRENT_TIMESTAMP
              WHERE robot_id = ?
              `
            )
            .bind(
              specs.suction_power || null,
              specs.obstacle_recognition || null,
              specs.mopping_technology || null,
              specs.mop_extension || null,
              specs.side_brush_extension || null,
              specs.automatic_mop_washing || null,
              specs.mop_drying || null,
              specs.wash_tray_self_cleaning || null,
              specs.automatic_dust_emptying || null,
              specs.automatic_detergent_dispensing || null,
              specs.carpet_mop_lift || null,
              specs.dust_bag_capacity || null,
              specs.clean_dirty_water_capacity || null,
              specs.battery_capacity || null,
              specs.cleaning_area || null,
              specs.robot_dimensions || null,
              specs.dock_dimensions || null,
              specs.reference_price === "" || specs.reference_price === undefined || specs.reference_price === null
                ? null
                : (Number(specs.reference_price) > 0 ? Number(specs.reference_price) : null),
              robotId
            )
        );


        statements.push(
          env
            .trung_tu_te_robot_db
            .prepare(
              `
              UPDATE robot_content
              SET
                intro = ?,
                highlights = ?,
                pros = ?,
                notes = ?,
                suitable_for = ?,
                updated_at = CURRENT_TIMESTAMP
              WHERE robot_id = ?
              `
            )
            .bind(
              content.intro || null,
              content.highlights || null,
              content.pros || null,
              content.notes || null,
              content.suitable_for || null,
              robotId
            )
        );


        statements.push(
          env
            .trung_tu_te_robot_db
            .prepare(
              `
              DELETE FROM robot_features
              WHERE robot_id = ?
              `
            )
            .bind(
              robotId
            )
        );


        features.forEach(
          function (feature, index) {

            statements.push(
              env
                .trung_tu_te_robot_db
                .prepare(
                  `
                  INSERT INTO robot_features
                  (
                    robot_id,
                    title,
                    description,
                    sort_order
                  )
                  VALUES (?, ?, ?, ?)
                  `
                )
                .bind(
                  robotId,
                  feature.title || "",
                  feature.description || "",
                  Number(
                    feature.sort_order ||
                    index + 1
                  )
                )
            );

          }
        );

        // =====================================================
        // CẬP NHẬT HÌNH ẢNH
        // Chỉ cập nhật liên kết trong D1
        // Không xóa file trên Google Drive
        // =====================================================

        if (images !== null) {

          statements.push(
            env
              .trung_tu_te_robot_db
              .prepare(
                `
                DELETE FROM robot_images
                WHERE robot_id = ?
                `
              )
              .bind(
                robotId
              )
          );

          let hasPrimary =
            false;

          images.forEach(
            function (image, index) {

              if (
                !image ||
                !image.driveId
              ) {
                return;
              }

              const isPrimary =
                Boolean(
                  image.isPrimary
                );

              if (isPrimary) {
                hasPrimary = true;
              }

              statements.push(
                env
                  .trung_tu_te_robot_db
                  .prepare(
                    `
                    INSERT INTO robot_images
                    (
                      robot_id,
                      drive_id,
                      file_name,
                      mime_type,
                      sort_order,
                      is_primary
                    )
                    VALUES (?, ?, ?, ?, ?, ?)
                    `
                  )
                  .bind(
                    robotId,
                    image.driveId,
                    image.fileName || "",
                    image.mimeType || null,
                    Number(
                      image.sortOrder ||
                      index + 1
                    ),
                    isPrimary
                      ? 1
                      : 0
                  )
              );

            }
          );

          // Nếu có ảnh nhưng chưa chọn ảnh chính,
          // tự động lấy ảnh đầu tiên làm ảnh chính.
          if (
            images.length > 0 &&
            !hasPrimary
          ) {

            statements.push(
              env
                .trung_tu_te_robot_db
                .prepare(
                  `
                  UPDATE robot_images
                  SET is_primary = 1
                  WHERE robot_id = ?
                  AND id = (
                    SELECT id
                    FROM robot_images
                    WHERE robot_id = ?
                    ORDER BY sort_order ASC, id ASC
                    LIMIT 1
                  )
                  `
                )
                .bind(
                  robotId,
                  robotId
                )
            );

          }

        }
  
        await env
          .trung_tu_te_robot_db
          .batch(
            statements
          );


        return Response.json({
          ok: true,
          message:
            "Đã cập nhật robot",
          robotId
        });


      } catch (error) {

        return Response.json(
          {
            ok: false,
            error:
              error.message
          },
          {
            status: 500
          }
        );

      }

    }
            // =====================================================
        // DELETE ROBOT - ADMIN
        // API DELETE /api/admin/robot/:id
        // =====================================================

        if (
          url.pathname.startsWith(
            "/api/admin/robot/"
          ) &&
          request.method === "DELETE"
        ) {
          const isAdmin =
            await requireAdminSession(
              request,
              env
            );
          if (!isAdmin) {
            return Response.json(
              {
                ok: false,
                error: "Unauthorized"
              },
              {
                status: 401
              }
            );
          }
          try {

            const parts =
              url.pathname
                .split("/")
                .filter(Boolean);

            const robotId =
              Number(
                parts[parts.length - 1]
              );

            if (
              !Number.isInteger(robotId) ||
              robotId <= 0
            ) {
              return Response.json(
                {
                  ok: false,
                  error: "Robot ID không hợp lệ"
                },
                {
                  status: 400
                }
              );
            }

            const existingRobot =
              await env
                .trung_tu_te_robot_db
                .prepare(
                  `
                  SELECT
                    id,
                    brand,
                    model
                  FROM robots
                  WHERE id = ?
                  LIMIT 1
                  `
                )
                .bind(
                  robotId
                )
                .first();

            if (!existingRobot) {

              return Response.json(
                {
                  ok: false,
                  error: "Không tìm thấy robot"
                },
                {
                  status: 404
                }
              );

            }

            await env
              .trung_tu_te_robot_db
              .batch([

                env
                  .trung_tu_te_robot_db
                  .prepare(
                    `
                    DELETE FROM robot_images
                    WHERE robot_id = ?
                    `
                  )
                  .bind(
                    robotId
                  ),

                env
                  .trung_tu_te_robot_db
                  .prepare(
                    `
                    DELETE FROM robot_features
                    WHERE robot_id = ?
                    `
                  )
                  .bind(
                    robotId
                  ),

                env
                  .trung_tu_te_robot_db
                  .prepare(
                    `
                    DELETE FROM robot_content
                    WHERE robot_id = ?
                    `
                  )
                  .bind(
                    robotId
                  ),

                env
                  .trung_tu_te_robot_db
                  .prepare(
                    `
                    DELETE FROM robot_specs
                    WHERE robot_id = ?
                    `
                  )
                  .bind(
                    robotId
                  ),

                env
                  .trung_tu_te_robot_db
                  .prepare(
                    `
                    DELETE FROM robots
                    WHERE id = ?
                    `
                  )
                  .bind(
                    robotId
                  )

              ]);

            return Response.json({
              ok: true,
              message: "Đã xóa robot",
              robotId
            });

          } catch (error) {

            return Response.json(
              {
                ok: false,
                error:
                  error.message
              },
              {
                status: 500
              }
            );

          }

        }
        // =====================================================
    // GET DRIVE IMAGES - ADMIN
    // API GET /api/admin/drive/images?folderId=...
    // =====================================================

    if (
      url.pathname ===
        "/api/admin/drive/images" &&
      request.method === "GET"
    ) {
      const isAdmin =
        await requireAdminSession(
          request,
          env
        );
      if (!isAdmin) {
        return Response.json(
          {
            ok: false,
            error: "Unauthorized"
          },
          {
            status: 401
          }
        );
      }
      try {

        const folderId =
          url.searchParams.get(
            "folderId"
          ) || "";

        if (!folderId) {

          return Response.json(
            {
              ok: false,
              error:
                "Thiếu folderId"
            },
            {
              status: 400
            }
          );

        }


        const accessToken =
          await createGoogleAccessToken(
            env
          );


        const driveUrl =
          "https://www.googleapis.com/drive/v3/files" +
          `?q=${encodeURIComponent(
            `'${folderId}' in parents and trashed = false and mimeType contains 'image/'`
          )}` +
          "&fields=files(id,name,mimeType)" +
          "&pageSize=100";


        const response =
          await fetch(
            driveUrl,
            {
              headers: {
                Authorization:
                  `Bearer ${accessToken}`
              }
            }
          );


        if (!response.ok) {

          throw new Error(
            `Google Drive API lỗi: ${response.status} ${await response.text()}`
          );

        }


        const data =
          await response.json();


        const images =
          Array.isArray(
            data.files
          )
            ? data.files.map(
                function (file) {

                  return {
                    driveId:
                      file.id,

                    fileName:
                      file.name,

                    mimeType:
                      file.mimeType,

                    url:
                      "/api/image/" +
                      file.id
                  };

                }
              )
            : [];


        return Response.json(
          {
            ok: true,
            images
          }
        );


      } catch (error) {

        return Response.json(
          {
            ok: false,
            error:
              error.message
          },
          {
            status: 500
          }
        );

      }

    }
        // =====================================================
    // CREATE ROBOT - ADMIN
    // API POST /api/admin/robot
    // =====================================================

    if (
      url.pathname ===
        "/api/admin/robot" &&
      request.method === "POST"
    ) {
      const isAdmin =
        await requireAdminSession(
          request,
          env
        );
      if (!isAdmin) {
        return Response.json(
          {
            ok: false,
            error: "Unauthorized"
          },
          {
            status: 401
          }
        );
      }
      try {

        const body =
          await request.json();

        const robot =
          body.robot || {};

        const specs =
          body.specs || {};

        const content =
          body.content || {};

        const features =
          Array.isArray(
            body.features
          )
            ? body.features
            : [];

        const images =
          Array.isArray(
            body.images
          )
            ? body.images
            : [];


        // =================================================
        // KIỂM TRA THÔNG TIN BẮT BUỘC
        // =================================================

        const brand =
          String(
            robot.brand || ""
          ).trim();

        const model =
          String(
            robot.model || ""
          ).trim();

        if (
          !brand ||
          !model
        ) {

          return Response.json(
            {
              ok: false,
              error:
                "Hãng và Model là bắt buộc"
            },
            {
              status: 400
            }
          );

        }


        // =================================================
        // TẠO SLUG
        // =================================================

        const slug =
          createSlug(
            brand,
            model
          );


        if (!slug) {

          return Response.json(
            {
              ok: false,
              error:
                "Không thể tạo slug cho Robot"
            },
            {
              status: 400
            }
          );

        }


        // =================================================
        // KIỂM TRA SLUG ĐÃ TỒN TẠI
        // =================================================

        const existingRobot =
          await env
            .trung_tu_te_robot_db
            .prepare(
              `
              SELECT
                id,
                brand,
                model
              FROM robots
              WHERE slug = ?
              LIMIT 1
              `
            )
            .bind(
              slug
            )
            .first();


        if (existingRobot) {

          return Response.json(
            {
              ok: false,
              error:
                "Robot đã tồn tại với slug: " +
                slug,
              robotId:
                existingRobot.id
            },
            {
              status: 409
            }
          );

        }


        // =================================================
        // CHUẨN BỊ NĂM
        // =================================================

        const year =
          robot.year === "" ||
          robot.year === null ||
          robot.year === undefined
            ? null
            : Number(
                robot.year
              );


        // =================================================
        // TẠO ROBOT
        // =================================================

        const robotResult =
          await env
            .trung_tu_te_robot_db
            .prepare(
              `
              INSERT INTO robots
              (
                brand,
                model,
                slug,
                year,
                category,
                status
              )
              VALUES (?, ?, ?, ?, ?, ?)
              RETURNING id
              `
            )
            .bind(
              brand,
              model,
              slug,
              year,
              robot.category || "",
              robot.status || "active"
            )
            .first();


        if (
          !robotResult ||
          !robotResult.id
        ) {

          throw new Error(
            "Không thể tạo Robot"
          );

        }


        const robotId =
          Number(
            robotResult.id
          );


        // =================================================
        // CHUẨN BỊ CÁC CÂU LỆNH D1
        // =================================================

        const statements = [];


        // =================================================
        // THÔNG SỐ KỸ THUẬT
        // =================================================

        statements.push(
          env
            .trung_tu_te_robot_db
            .prepare(
              `
              INSERT INTO robot_specs
              (
                robot_id,
                suction_power,
                obstacle_recognition,
                mopping_technology,
                mop_extension,
                side_brush_extension,
                automatic_mop_washing,
                mop_drying,
                wash_tray_self_cleaning,
                automatic_dust_emptying,
                automatic_detergent_dispensing,
                carpet_mop_lift,
                dust_bag_capacity,
                clean_dirty_water_capacity,
                battery_capacity,
                cleaning_area,
                robot_dimensions,
                dock_dimensions,
                reference_price
              )
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
              `
            )
            .bind(
              robotId,
              specs.suction_power || null,
              specs.obstacle_recognition || null,
              specs.mopping_technology || null,
              specs.mop_extension || null,
              specs.side_brush_extension || null,
              specs.automatic_mop_washing || null,
              specs.mop_drying || null,
              specs.wash_tray_self_cleaning || null,
              specs.automatic_dust_emptying || null,
              specs.automatic_detergent_dispensing || null,
              specs.carpet_mop_lift || null,
              specs.dust_bag_capacity || null,
              specs.clean_dirty_water_capacity || null,
              specs.battery_capacity || null,
              specs.cleaning_area || null,
              specs.robot_dimensions || null,
              specs.dock_dimensions || null,
              specs.reference_price === "" ||
              specs.reference_price === undefined ||
              specs.reference_price === null
                ? (
                    Number(specs.referencePrice) > 0
                      ? Number(specs.referencePrice)
                      : null
                  )
                : (
                    Number(specs.reference_price) > 0
                      ? Number(specs.reference_price)
                      : null
                  )
            )
        );

        // =================================================
        // NỘI DUNG
        // =================================================

        statements.push(
          env
            .trung_tu_te_robot_db
            .prepare(
              `
              INSERT INTO robot_content
              (
                robot_id,
                intro,
                highlights,
                pros,
                notes,
                suitable_for
              )
              VALUES (?, ?, ?, ?, ?, ?)
              `
            )
            .bind(
              robotId,
              content.intro || null,
              content.highlights || null,
              content.pros || null,
              content.notes || null,
              content.suitable_for || null
            )
        );


        // =================================================
        // TÍNH NĂNG
        // =================================================

        features.forEach(
          function (
            feature,
            index
          ) {

            if (
              !feature
            ) {
              return;
            }

            const title =
              String(
                feature.title || ""
              ).trim();

            if (!title) {
              return;
            }

            statements.push(
              env
                .trung_tu_te_robot_db
                .prepare(
                  `
                  INSERT INTO robot_features
                  (
                    robot_id,
                    title,
                    description,
                    sort_order
                  )
                  VALUES (?, ?, ?, ?)
                  `
                )
                .bind(
                  robotId,
                  title,
                  feature.description || "",
                  Number(
                    feature.sort_order ||
                    index + 1
                  )
                )
            );

          }
        );


        // =================================================
        // HÌNH ẢNH
        // Chỉ lưu liên kết Drive vào D1
        // Không xóa file Google Drive
        // =================================================

        let hasPrimary =
          false;


        images.forEach(
          function (
            image,
            index
          ) {

            if (
              !image ||
              !image.driveId
            ) {
              return;
            }

            const isPrimary =
              Boolean(
                image.isPrimary
              );


            if (isPrimary) {
              hasPrimary = true;
            }


            statements.push(
              env
                .trung_tu_te_robot_db
                .prepare(
                  `
                  INSERT INTO robot_images
                  (
                    robot_id,
                    drive_id,
                    file_name,
                    mime_type,
                    sort_order,
                    is_primary
                  )
                  VALUES (?, ?, ?, ?, ?, ?)
                  `
                )
                .bind(
                  robotId,
                  image.driveId,
                  image.fileName || "",
                  image.mimeType || null,
                  Number(
                    image.sortOrder ||
                    index + 1
                  ),
                  isPrimary
                    ? 1
                    : 0
                )
            );

          }
        );


        // =================================================
        // NẾU CÓ ẢNH NHƯNG CHƯA CÓ ẢNH CHÍNH
        // LẤY ẢNH ĐẦU TIÊN LÀM ẢNH CHÍNH
        // =================================================

        if (
          images.length > 0 &&
          !hasPrimary
        ) {

          statements.push(
            env
              .trung_tu_te_robot_db
              .prepare(
                `
                UPDATE robot_images
                SET is_primary = 1
                WHERE robot_id = ?
                AND id = (
                  SELECT id
                  FROM robot_images
                  WHERE robot_id = ?
                  ORDER BY sort_order ASC, id ASC
                  LIMIT 1
                )
                `
              )
              .bind(
                robotId,
                robotId
              )
          );

        }


        // =================================================
        // LƯU CÁC BẢNG PHỤ
        // =================================================

        if (
          statements.length > 0
        ) {

          await env
            .trung_tu_te_robot_db
            .batch(
              statements
            );

        }


        // =================================================
        // TRẢ KẾT QUẢ
        // =================================================

        return Response.json({

          ok: true,

          message:
            "Đã tạo Robot",

          robotId,

          slug,

          robot: {
            id:
              robotId,

            brand,

            model,

            slug,

            year,

            category:
              robot.category || "",

            status:
              robot.status ||
              "active"
          }

        });


      } catch (error) {

        return Response.json(
          {
            ok: false,
            error:
              error.message
          },
          {
            status: 500
          }
        );

      }

    }
    // =========================================================
// ARTICLE LIST - ADMIN
// API GET /api/admin/articles
// =========================================================

if (
  url.pathname === "/api/admin/articles" &&
  request.method === "GET"
) {
  const isAdmin =
    await requireAdminSession(
      request,
      env
    );

  if (!isAdmin) {
    return Response.json(
      {
        ok: false,
        error: "Unauthorized"
      },
      {
        status: 401
      }
    );
  }

  try {

    const result =
      await env
        .trung_tu_te_robot_db
        .prepare(
          `
          SELECT
            id,
            title,
            slug,
            category,
            icon,
            excerpt,
            cover_image,
            status,
            sort_order,
            view_count,
            created_at,
            updated_at,
            published_at
          FROM articles
          ORDER BY
            sort_order ASC,
            updated_at DESC,
            id DESC
          `
        )
        .all();

    return Response.json(
      {
        ok: true,
        articles:
          result.results || []
      }
    );

  } catch (error) {

    return Response.json(
      {
        ok: false,
        error:
          error.message
      },
      {
        status: 500
      }
    );

  }
}
// =========================================================
// ARTICLE DETAIL - ADMIN
// API GET /api/admin/article/:id
// =========================================================

if (
  url.pathname.startsWith(
    "/api/admin/article/"
  ) &&
  request.method === "GET"
) {
  const isAdmin =
    await requireAdminSession(
      request,
      env
    );

  if (!isAdmin) {
    return Response.json(
      {
        ok: false,
        error: "Unauthorized"
      },
      {
        status: 401
      }
    );
  }

  try {

    const parts =
      url.pathname
        .split("/")
        .filter(Boolean);

    const articleId =
      Number(
        parts[parts.length - 1]
      );

    if (
      !articleId ||
      !Number.isInteger(articleId)
    ) {
      return Response.json(
        {
          ok: false,
          error:
            "ID bài viết không hợp lệ"
        },
        {
          status: 400
        }
      );
    }

    const article =
      await env
        .trung_tu_te_robot_db
        .prepare(
          `
          SELECT
            id,
            title,
            slug,
            category,
            icon,
            excerpt,
            content,
            cover_image,
            status,
            sort_order,
            view_count,
            created_at,
            updated_at,
            published_at
          FROM articles
          WHERE id = ?
          LIMIT 1
          `
        )
        .bind(articleId)
        .first();

    if (!article) {
      return Response.json(
        {
          ok: false,
          error:
            "Không tìm thấy bài viết"
        },
        {
          status: 404
        }
      );
    }

    return Response.json(
      {
        ok: true,
        article
      }
    );

  } catch (error) {

    return Response.json(
      {
        ok: false,
        error:
          error.message
      },
      {
        status: 500
      }
    );

  }
}
// =========================================================
// CREATE ARTICLE - ADMIN
// API POST /api/admin/article
// =========================================================

if (
  url.pathname === "/api/admin/article" &&
  request.method === "POST"
) {
  const isAdmin =
    await requireAdminSession(
      request,
      env
    );

  if (!isAdmin) {
    return Response.json(
      {
        ok: false,
        error: "Unauthorized"
      },
      {
        status: 401
      }
    );
  }

  try {

    const body =
      await request.json();

    const title =
      String(
        body.title || ""
      ).trim();

    const slug =
      String(
        body.slug || ""
      ).trim();

    const category =
      String(
        body.category || "CHIA SẺ"
      ).trim();

    const icon =
      String(
        body.icon || "📖"
      ).trim();

    const excerpt =
      String(
        body.excerpt || ""
      ).trim();

    const content =
      String(
        body.content || ""
      );

    const coverImage =
      String(
        body.cover_image || ""
      ).trim();

    const status =
      String(
        body.status || "draft"
      ).trim();

    const sortOrder =
      Number(
        body.sort_order || 0
      );

    if (!title) {
      return Response.json(
        {
          ok: false,
          error:
            "Tiêu đề bài viết là bắt buộc"
        },
        {
          status: 400
        }
      );
    }

    if (!slug) {
      return Response.json(
        {
          ok: false,
          error:
            "Slug bài viết là bắt buộc"
        },
        {
          status: 400
        }
      );
    }

    if (
      !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(
        slug
      )
    ) {
      return Response.json(
        {
          ok: false,
          error:
            "Slug không hợp lệ. Chỉ dùng chữ thường, số và dấu gạch ngang."
        },
        {
          status: 400
        }
      );
    }

    if (
      status !== "draft" &&
      status !== "published"
    ) {
      return Response.json(
        {
          ok: false,
          error:
            "Trạng thái bài viết không hợp lệ"
        },
        {
          status: 400
        }
      );
    }

    const existingArticle =
      await env
        .trung_tu_te_robot_db
        .prepare(
          `
          SELECT
            id,
            title
          FROM articles
          WHERE slug = ?
          LIMIT 1
          `
        )
        .bind(slug)
        .first();

    if (existingArticle) {
      return Response.json(
        {
          ok: false,
          error:
            "Slug đã tồn tại",
          articleId:
            existingArticle.id
        },
        {
          status: 409
        }
      );
    }

    let publishedAt =
      null;

    if (
      status === "published"
    ) {
      publishedAt =
        new Date().toISOString();
    }

    const article =
      await env
        .trung_tu_te_robot_db
        .prepare(
          `
          INSERT INTO articles
          (
            title,
            slug,
            category,
            icon,
            excerpt,
            content,
            cover_image,
            status,
            sort_order,
            published_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          RETURNING
            id,
            title,
            slug,
            category,
            icon,
            excerpt,
            content,
            cover_image,
            status,
            sort_order,
            view_count,
            created_at,
            updated_at,
            published_at
          `
        )
        .bind(
          title,
          slug,
          category,
          icon,
          excerpt,
          content,
          coverImage,
          status,
          Number.isFinite(
            sortOrder
          )
            ? sortOrder
            : 0,
          publishedAt
        )
        .first();

    if (!article) {
      throw new Error(
        "Không thể tạo bài viết"
      );
    }

    return Response.json(
      {
        ok: true,
        message:
          "Đã tạo bài viết",
        article
      }
    );

  } catch (error) {

    return Response.json(
      {
        ok: false,
        error:
          error.message
      },
      {
        status: 500
      }
    );

  }
}
// =========================================================
// UPDATE ARTICLE - ADMIN
// API PUT /api/admin/article/:id
// =========================================================

if (
  url.pathname.startsWith(
    "/api/admin/article/"
  ) &&
  request.method === "PUT"
) {
  const isAdmin =
    await requireAdminSession(
      request,
      env
    );

  if (!isAdmin) {
    return Response.json(
      {
        ok: false,
        error: "Unauthorized"
      },
      {
        status: 401
      }
    );
  }

  try {

    const parts =
      url.pathname
        .split("/")
        .filter(Boolean);

    const articleId =
      Number(
        parts[parts.length - 1]
      );

    if (
      !articleId ||
      !Number.isInteger(articleId)
    ) {
      return Response.json(
        {
          ok: false,
          error:
            "ID bài viết không hợp lệ"
        },
        {
          status: 400
        }
      );
    }

    const body =
      await request.json();

    const title =
      String(
        body.title || ""
      ).trim();

    const slug =
      String(
        body.slug || ""
      ).trim();

    const category =
      String(
        body.category || "CHIA SẺ"
      ).trim();

    const icon =
      String(
        body.icon || "📖"
      ).trim();

    const excerpt =
      String(
        body.excerpt || ""
      ).trim();

    const content =
      String(
        body.content || ""
      );

    const coverImage =
      String(
        body.cover_image || ""
      ).trim();

    const status =
      String(
        body.status || "draft"
      ).trim();

    const sortOrder =
      Number(
        body.sort_order || 0
      );

    if (!title) {
      return Response.json(
        {
          ok: false,
          error:
            "Tiêu đề bài viết là bắt buộc"
        },
        {
          status: 400
        }
      );
    }

    if (!slug) {
      return Response.json(
        {
          ok: false,
          error:
            "Slug bài viết là bắt buộc"
        },
        {
          status: 400
        }
      );
    }

    if (
      !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(
        slug
      )
    ) {
      return Response.json(
        {
          ok: false,
          error:
            "Slug không hợp lệ. Chỉ dùng chữ thường, số và dấu gạch ngang."
        },
        {
          status: 400
        }
      );
    }

    if (
      status !== "draft" &&
      status !== "published"
    ) {
      return Response.json(
        {
          ok: false,
          error:
            "Trạng thái bài viết không hợp lệ"
        },
        {
          status: 400
        }
      );
    }

    const existingArticle =
      await env
        .trung_tu_te_robot_db
        .prepare(
          `
          SELECT
            id,
            title,
            slug,
            status,
            published_at
          FROM articles
          WHERE id = ?
          LIMIT 1
          `
        )
        .bind(articleId)
        .first();

    if (!existingArticle) {
      return Response.json(
        {
          ok: false,
          error:
            "Không tìm thấy bài viết"
        },
        {
          status: 404
        }
      );
    }

    const slugOwner =
      await env
        .trung_tu_te_robot_db
        .prepare(
          `
          SELECT
            id
          FROM articles
          WHERE slug = ?
            AND id != ?
          LIMIT 1
          `
        )
        .bind(
          slug,
          articleId
        )
        .first();

    if (slugOwner) {
      return Response.json(
        {
          ok: false,
          error:
            "Slug đã được sử dụng bởi bài viết khác",
          articleId:
            slugOwner.id
        },
        {
          status: 409
        }
      );
    }

    let publishedAt =
      existingArticle.published_at ||
      null;

    if (
      status === "published" &&
      !publishedAt
    ) {
      publishedAt =
        new Date().toISOString();
    }

    if (
      status === "draft"
    ) {
      publishedAt = null;
    }

    const article =
      await env
        .trung_tu_te_robot_db
        .prepare(
          `
          UPDATE articles
          SET
            title = ?,
            slug = ?,
            category = ?,
            icon = ?,
            excerpt = ?,
            content = ?,
            cover_image = ?,
            status = ?,
            sort_order = ?,
            updated_at = CURRENT_TIMESTAMP,
            published_at = ?
          WHERE id = ?
          RETURNING
            id,
            title,
            slug,
            category,
            icon,
            excerpt,
            content,
            cover_image,
            status,
            sort_order,
            view_count,
            created_at,
            updated_at,
            published_at
          `
        )
        .bind(
          title,
          slug,
          category,
          icon,
          excerpt,
          content,
          coverImage,
          status,
          Number.isFinite(
            sortOrder
          )
            ? sortOrder
            : 0,
          publishedAt,
          articleId
        )
        .first();

    if (!article) {
      throw new Error(
        "Không thể cập nhật bài viết"
      );
    }

    return Response.json(
      {
        ok: true,
        message:
          "Đã cập nhật bài viết",
        article
      }
    );

  } catch (error) {

    return Response.json(
      {
        ok: false,
        error:
          error.message
      },
      {
        status: 500
      }
    );

  }
}
    // =========================================================
    // IMAGE API
    // =========================================================

    if (
      url.pathname.startsWith(
        "/api/image/"
      )
    ) {
      try {
        const fileId =
          url.pathname
            .split("/")
            .pop();

        if (!fileId) {
          return new Response(
            "Thiếu file ID",
            { status: 400 }
          );
        }

        const accessToken =
          await createGoogleAccessToken(
            env
          );

        const driveUrl =
          `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}` +
          "?alt=media";

        const response =
          await fetch(
            driveUrl,
            {
              headers: {
                Authorization:
                  `Bearer ${accessToken}`
              }
            }
          );

        if (!response.ok) {
          return new Response(
            `Google Drive API lỗi: ${response.status}`,
            {
              status:
                response.status
            }
          );
        }

        const contentType =
          response.headers.get(
            "content-type"
          ) ||
          "application/octet-stream";

        return new Response(
          response.body,
          {
            headers: {
              "Content-Type":
                contentType,

              "Cache-Control":
                "public, max-age=86400"
            }
          }
        );
      } catch (error) {
        return new Response(
          `Lỗi lấy ảnh: ${error.message}`,
          {
            status: 500
          }
        );
      }
    }
// =========================================================
// ARTICLE DYNAMIC PAGE
// =========================================================

if (
  url.pathname.startsWith("/chia-se/") &&
  url.pathname !== "/chia-se/"
) {
  const parts =
    url.pathname
      .split("/")
      .filter(Boolean);

  const slug =
    parts[parts.length - 1];

  if (slug) {

    const article =
      await env
        .trung_tu_te_robot_db
        .prepare(
          `
          SELECT id
          FROM articles
          WHERE slug = ?
            AND status = 'published'
          LIMIT 1
          `
        )
        .bind(slug)
        .first();

    if (article) {

      const templateUrl =
        new URL(
          "/chia-se/template/",
          request.url
        );

      templateUrl.searchParams.set(
        "slug",
        slug
      );

      return env.ASSETS.fetch(
        new Request(
          templateUrl,
          request
        )
      );
    }
  }
}
    // =========================================================
    // ROBOT DYNAMIC PAGE
    // =========================================================

    if (
      url.pathname.startsWith(
        "/robot/"
      ) &&
      url.pathname !== "/robot/" &&
      !url.pathname.startsWith(
        "/robot/template/"
      )
    ) {
      const parts =
        url.pathname
          .split("/")
          .filter(Boolean);

      let slug = "";

      if (
        parts.length >= 3 &&
        parts[0] === "robot"
      ) {
        slug =
          `${parts[1]}-${parts[2]}`;
      }

      if (!slug) {
        slug =
          parts[parts.length - 1];
      }

      const robot =
        await env
          .trung_tu_te_robot_db
          .prepare(
            `
            SELECT id
            FROM robots
            WHERE slug = ?
            LIMIT 1
            `
          )
          .bind(slug)
          .first();

      if (robot) {
        const templateUrl =
          new URL(
            "/robot/template/index.html",
            request.url
          );

        templateUrl.searchParams.set(
          "slug",
          slug
        );

        return env.ASSETS.fetch(
          new Request(
            templateUrl,
            request
          )
        );
      }
    }
// =========================================================
// SITE VISIT TRACKING
// =========================================================

if (
  url.pathname === "/api/visit" &&
  request.method === "POST"
) {
  try {
    let body = {};

    try {
      body = await request.json();
    } catch (error) {
      body = {};
    }

    const pagePath =
      String(
        body.page_path ||
        "/"
      ).slice(0, 500);

    const today =
      new Date()
        .toISOString()
        .slice(0, 10);

    const cookieHeader =
      request.headers.get(
        "Cookie"
      ) || "";

    const visitorMatch =
      cookieHeader.match(
        /(?:^|;\s*)visitor_id=([^;]+)/
      );

    let visitorId =
      visitorMatch
        ? visitorMatch[1]
        : "";

    let isNewVisitor = false;

    if (!visitorId) {
      visitorId =
        crypto.randomUUID();

      isNewVisitor = true;
    }

    await env
      .trung_tu_te_robot_db
      .prepare(
        `
        INSERT INTO site_visits (
          visit_date,
          visitor_id,
          page_path
        )
        VALUES (?, ?, ?)
        `
      )
      .bind(
        today,
        visitorId,
        pagePath
      )
      .run();

    const headers = {
      "Content-Type":
        "application/json; charset=utf-8",
      "Cache-Control":
        "no-store"
    };

    if (isNewVisitor) {
      headers[
        "Set-Cookie"
      ] = [
        "visitor_id=" +
          visitorId,
        "Max-Age=31536000",
        "Path=/",
        "SameSite=Lax"
      ].join("; ");
    }

    return new Response(
      JSON.stringify({
        ok: true
      }),
      {
        status: 200,
        headers
      }
    );

  } catch (error) {
    console.error(
      "SITE VISIT ERROR:",
      error
    );

    return Response.json(
      {
        ok: false,
        error:
          "Không thể ghi nhận lượt truy cập"
      },
      {
        status: 500
      }
    );
  }
}
// =========================================================
// PUBLIC SITE STATS
// =========================================================

if (
  url.pathname === "/api/site-stats" &&
  request.method === "GET"
) {
  try {
    const result =
      await env
        .trung_tu_te_robot_db
        .prepare(
          `
          SELECT COUNT(*) AS total_views
          FROM site_visits
          `
        )
        .first();

    return Response.json(
      {
        ok: true,
        total_views:
          Number(
            result?.total_views || 0
          )
      },
      {
        headers: {
          "Content-Type":
            "application/json; charset=utf-8",
          "Cache-Control":
            "public, max-age=300"
        }
      }
    );

  } catch (error) {
    console.error(
      "PUBLIC SITE STATS ERROR:",
      error
    );

    return Response.json(
      {
        ok: false,
        error:
          "Không thể tải thống kê"
      },
      {
        status: 500
      }
    );
  }
}
// =========================================================
// ADMIN ANALYTICS
// =========================================================

if (
  url.pathname === "/api/admin/analytics" &&
  request.method === "GET"
) {
  try {
    const authorized =
      await requireAdminSession(
        request,
        env
      );

    if (!authorized) {
      return Response.json(
        {
          ok: false,
          error: "Unauthorized"
        },
        {
          status: 401
        }
      );
    }

    const today =
      new Date()
        .toISOString()
        .slice(0, 10);

    const result =
      await env
        .trung_tu_te_robot_db
        .prepare(
          `
          SELECT
            COUNT(*) AS total_views,
            COUNT(
              DISTINCT visitor_id
            ) AS unique_visitors,

            SUM(
              CASE
                WHEN visit_date = ?
                THEN 1
                ELSE 0
              END
            ) AS today_views,

            COUNT(
              DISTINCT CASE
                WHEN visit_date = ?
                THEN visitor_id
              END
            ) AS today_visitors,

            SUM(
              CASE
                WHEN visit_date >= date(?, '-6 days')
                THEN 1
                ELSE 0
              END
            ) AS last_7_days_views,

            COUNT(
              DISTINCT CASE
                WHEN visit_date >= date(?, '-6 days')
                THEN visitor_id
              END
            ) AS last_7_days_visitors,

            SUM(
              CASE
                WHEN visit_date >= date(?, '-29 days')
                THEN 1
                ELSE 0
              END
            ) AS last_30_days_views,

            COUNT(
              DISTINCT CASE
                WHEN visit_date >= date(?, '-29 days')
                THEN visitor_id
              END
            ) AS last_30_days_visitors

          FROM site_visits
          `
        )
        .bind(
          today,
          today,
          today,
          today,
          today,
          today
        )
        .first();

    return Response.json(
      {
        ok: true,
        analytics: {
          today: {
            views:
              Number(
                result?.today_views ||
                0
              ),
            visitors:
              Number(
                result?.today_visitors ||
                0
              )
          },

          last_7_days: {
            views:
              Number(
                result?.last_7_days_views ||
                0
              ),
            visitors:
              Number(
                result?.last_7_days_visitors ||
                0
              )
          },

          last_30_days: {
            views:
              Number(
                result?.last_30_days_views ||
                0
              ),
            visitors:
              Number(
                result?.last_30_days_visitors ||
                0
              )
          },

          total: {
            views:
              Number(
                result?.total_views ||
                0
              ),
            visitors:
              Number(
                result?.unique_visitors ||
                0
              )
          }
        }
      },
      {
        headers: {
          "Content-Type":
            "application/json; charset=utf-8",
          "Cache-Control":
            "no-store"
        }
      }
    );

  } catch (error) {
    console.error(
      "ADMIN ANALYTICS ERROR:",
      error
    );

    return Response.json(
      {
        ok: false,
        error:
          "Không thể tải thống kê truy cập"
      },
      {
        status: 500
      }
    );
  }
}
    // =========================================================
    // ADMIN PAGE
    // =========================================================
    // Trang Admin được mở trực tiếp.
    // admin.js sẽ kiểm tra /api/admin/session
    // và hiển thị màn hình đăng nhập nếu chưa xác thực.
if (
  url.pathname === "/admin" ||
  url.pathname === "/admin/"
) {
  return env.ASSETS.fetch(
    request
  );
}
// =========================================================
// ADMIN - LOGOUT
// =========================================================

if (
  url.pathname === "/api/admin/logout" &&
  request.method === "POST"
) {
  return new Response(
    JSON.stringify({
      ok: true,
      message: "Đã đăng xuất Admin"
    }),
    {
      status: 200,
      headers: {
        "Content-Type":
          "application/json",

        "Set-Cookie":
          [
            "admin_session=",
            "HttpOnly",
            "Secure",
            "SameSite=Strict",
            "Path=/",
            "Max-Age=0"
          ].join("; ")
      }
    }
  );
}
// =========================================================
// ADMIN - AI MODEL STATUS
// =========================================================

if (
  url.pathname === "/api/admin/ai-model-status" &&
  request.method === "GET"
) {
  const isAdmin =
    await requireAdminSession(
      request,
      env
    );

  if (!isAdmin) {
    return Response.json(
      {
        ok: false,
        error: "Không có quyền truy cập"
      },
      {
        status: 401
      }
    );
  }

  try {
    const result =
      await env.trung_tu_te_robot_db
        .prepare(
          `
          SELECT
            model,
            status,
            last_success_at,
            last_error_at,
            quota_reset_at,
            error_count,
            last_error_status,
            updated_at
          FROM ai_model_status
          ORDER BY
            CASE status
              WHEN 'active' THEN 1
              WHEN 'available' THEN 2
              WHEN 'quota_exceeded' THEN 3
              WHEN 'temporary_error' THEN 4
              ELSE 5
            END,
            model ASC
          `
        )
        .all();

    return Response.json({
      ok: true,
      models:
        result.results || []
    });

  } catch (error) {

    console.error(
      "AI MODEL STATUS ERROR:",
      error
    );

    return Response.json(
      {
        ok: false,
        error:
          "Không thể đọc trạng thái Model AI"
      },
      {
        status: 500
      }
    );
  }
}

    // =========================================================
    // CHATBOT FAQ - ADMIN
    // =========================================================
    if (
      url.pathname === "/api/admin/chatbot-faqs" &&
      ["GET", "POST"].includes(request.method)
    ) {
      const isAdmin = await requireAdminSession(request, env);

      if (!isAdmin) {
        return Response.json(
          { ok: false, error: "Unauthorized" },
          { status: 401 }
        );
      }

      try {
        const db = env.trung_tu_te_robot_db;

        if (request.method === "GET") {
          const result = await db.prepare(`
            SELECT id, code, category, question, keywords,
                   answer_template, answer_type, is_active,
                   sort_order, created_at, updated_at
            FROM chatbot_faqs
            ORDER BY sort_order ASC, id ASC
          `).all();

          return Response.json({
            ok: true,
            faqs: result.results || []
          });
        }

        const body = await request.json();
        const code = String(body.code || "").trim();
        const question = String(body.question || "").trim();
        const answerTemplate = String(body.answer_template || "").trim();
        const category = String(body.category || "general").trim();
        const keywords = String(body.keywords || "").trim();
        const answerType = String(body.answer_type || "static").trim();
        const sortOrder = Number(body.sort_order ?? 0);
        const isActive = Number(body.is_active ?? 1);

        const allowedTypes = [
          "static", "suction", "mop_wash_dry", "mop_lift",
          "obstacle_avoidance", "obstacle_clearance",
          "price", "compare", "contact"
        ];

        if (
          !/^[a-zA-Z0-9_-]{2,80}$/.test(code) ||
          !question ||
          question.length > 500 ||
          !answerTemplate ||
          answerTemplate.length > 10000 ||
          !allowedTypes.includes(answerType) ||
          !Number.isInteger(sortOrder) ||
          ![0, 1].includes(isActive)
        ) {
          return Response.json(
            { ok: false, error: "Dữ liệu FAQ không hợp lệ." },
            { status: 400 }
          );
        }

        const result = await db.prepare(`
          INSERT INTO chatbot_faqs
            (code, category, question, keywords, answer_template,
             answer_type, is_active, sort_order, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `).bind(
          code, category, question, keywords, answerTemplate,
          answerType, isActive, sortOrder
        ).run();

        return Response.json({
          ok: true,
          id: result.meta?.last_row_id ?? null
        });
      } catch (error) {
        const duplicate = /unique constraint/i.test(error.message || "");

        return Response.json(
          {
            ok: false,
            error: duplicate
              ? "Mã FAQ đã tồn tại."
              : "Không thể xử lý FAQ."
          },
          { status: duplicate ? 409 : 500 }
        );
      }
    }

    if (
      url.pathname.startsWith("/api/admin/chatbot-faq/") &&
      ["PUT", "DELETE"].includes(request.method)
    ) {
      const isAdmin = await requireAdminSession(request, env);

      if (!isAdmin) {
        return Response.json(
          { ok: false, error: "Unauthorized" },
          { status: 401 }
        );
      }

      const id = Number(url.pathname.split("/").pop());

      if (!Number.isInteger(id) || id < 1) {
        return Response.json(
          { ok: false, error: "ID FAQ không hợp lệ." },
          { status: 400 }
        );
      }

      try {
        const db = env.trung_tu_te_robot_db;

        if (request.method === "DELETE") {
          await db.prepare(`
            UPDATE chatbot_faqs
            SET is_active = 0, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `).bind(id).run();

          return Response.json({ ok: true });
        }

        const body = await request.json();
        const question = String(body.question || "").trim();
        const answerTemplate = String(body.answer_template || "").trim();
        const category = String(body.category || "general").trim();
        const keywords = String(body.keywords || "").trim();
        const answerType = String(body.answer_type || "static").trim();
        const sortOrder = Number(body.sort_order ?? 0);
        const isActive = Number(body.is_active ?? 1);

        const allowedTypes = [
          "static", "suction", "mop_wash_dry", "mop_lift",
          "obstacle_avoidance", "obstacle_clearance",
          "price", "compare", "contact"
        ];

        if (
          !question ||
          question.length > 500 ||
          !answerTemplate ||
          answerTemplate.length > 10000 ||
          !allowedTypes.includes(answerType) ||
          !Number.isInteger(sortOrder) ||
          ![0, 1].includes(isActive)
        ) {
          return Response.json(
            { ok: false, error: "Dữ liệu FAQ không hợp lệ." },
            { status: 400 }
          );
        }

        const result = await db.prepare(`
          UPDATE chatbot_faqs
          SET category = ?, question = ?, keywords = ?,
              answer_template = ?, answer_type = ?,
              is_active = ?, sort_order = ?,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).bind(
          category, question, keywords, answerTemplate,
          answerType, isActive, sortOrder, id
        ).run();

        if (!result.meta?.changes) {
          return Response.json(
            { ok: false, error: "Không tìm thấy FAQ." },
            { status: 404 }
          );
        }

        return Response.json({ ok: true });
      } catch (error) {
        console.error("CHATBOT FAQ ADMIN ERROR:", error);

        return Response.json(
          { ok: false, error: "Không thể lưu FAQ." },
          { status: 500 }
        );
      }
    }

    // =========================================================
    // STATIC WEBSITE
    // =========================================================

    return env.ASSETS.fetch(
      request
    );
  }
};
