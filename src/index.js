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
                description,
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
        status,
        description
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
        suction,
        battery,
        dustbin,
        water_tank,
        navigation,
        noise,
        hot_water,
        mop_wash,
        mop_dry,
        mop_lift,
        self_empty,
        detergent
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
Nhiệm vụ:
Dựa CHỈ trên dữ liệu kỹ thuật được cung cấp bên dưới, hãy viết nội dung giới thiệu kỹ thuật cho robot.
MỤC TIÊU:
- Nội dung tự nhiên, dễ đọc bằng tiếng Việt.
- Phong cách tư vấn kỹ thuật, khách quan, thực tế.
- Không viết kiểu quảng cáo quá mức.
- Không lặp lại máy móc các thông số.
- Giải thích ý nghĩa thực tế của các tính năng.
- Có thể gom nhiều tính năng liên quan thành một chủ đề.
- Không bắt buộc phải có đúng 4 chủ đề.
- Chỉ tạo những chủ đề thực sự phù hợp với robot.
- Mỗi chủ đề có thể có 1 đến 3 đoạn văn.
- Nếu dữ liệu không đủ để tạo một chủ đề thì KHÔNG tạo chủ đề đó.
QUY TẮC VỀ THÔNG SỐ:
- Tuyệt đối không tự bịa thông số.
- Không tự suy đoán giá trị kỹ thuật không có trong dữ liệu.
- Không biến một thông tin chưa được xác nhận thành thông số chính thức.
- Nếu có thông tin là công bố/thử nghiệm của nhà sản xuất thì phải diễn đạt rõ là thông tin công bố hoặc thử nghiệm.
- Không tự thêm tên công nghệ, cảm biến hoặc tính năng nếu dữ liệu không có.
- Có thể giải thích ý nghĩa thực tế của thông số đã được cung cấp.
- Có thể đưa ra khuyến nghị bảo trì ở mức phổ thông, nhưng không được biến suy luận thành thông số kỹ thuật.
PHẦN "CHỨC NĂNG NỔI BẬT":
Hãy tạo một đoạn giới thiệu ngắn và sau đó có thể tạo các đoạn diễn giải dựa trên nhóm tính năng nổi bật.
Không cần tạo danh sách bullet trong phần này vì website đã có danh sách tính năng riêng.
CÁC CHỦ ĐỀ DIỄN GIẢI:

Hãy tự phân tích dữ liệu kỹ thuật của từng robot và tự đặt tiêu đề phù hợp.

Yêu cầu:
- Tối đa 4 chủ đề.
- Không bắt buộc phải đủ 4 chủ đề.
- Chỉ tạo chủ đề khi robot thực sự có dữ liệu hỗ trợ.
- Nếu robot chỉ có 2 hoặc 3 nhóm tính năng nổi bật thì chỉ tạo 2 hoặc 3 chủ đề tương ứng.
- Không dùng danh sách tiêu đề cố định cho mọi robot.
- Tiêu đề phải mô tả đúng nhóm công nghệ hoặc khả năng thực tế của model đó.
- Có thể gộp nhiều tính năng vào cùng một chủ đề nếu chúng liên quan.

Ví dụ:

Robot có lực hút mạnh + chống rối:
→ "Khả năng hút bụi và xử lý tóc rối"

Robot có khăn lau mở rộng + nâng khăn + giặt khăn:
→ "Khả năng lau nhà và xử lý các khu vực khó tiếp cận"

Robot có trạm tự động:
→ "Trạm sạc đa chức năng và khả năng tự động hóa"

Robot có camera AI:
→ "Điều hướng thông minh và nhận diện vật cản"

Robot đơn giản không có trạm:
→ Không tạo phần về trạm đa chức năng.

Không tạo tiêu đề chỉ để đủ số lượng.
"GÓC NHÌN KỸ THUẬT TRUNG TỬ TẾ":
Viết một phần nhận xét kỹ thuật thực tế.
Có thể đề cập đến việc vệ sinh, bảo trì, môi trường sử dụng hoặc những điểm người dùng nên lưu ý.
Không được đưa ra thông số mới.
Không được khẳng định những điều không có cơ sở từ dữ liệu.
PHÙ HỢP VỚI AI:
Phần phù hợp sử dụng chỉ dựa trên các tính năng thực tế.
Không suy luận quá mức từ dung lượng pin, lực hút hoặc số liệu kỹ thuật.
DỮ LIỆU ROBOT:
${JSON.stringify(
  sourceData,
  null,
  2
)}
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

    technical_view: {
      type: "string",
      description:
        "Góc nhìn kỹ thuật Trung Tử Tế."
    },

    suitable_for: {
      type: "string",
      description:
        "Đoạn mô tả robot phù hợp với nhóm người dùng nào."
    }
  },

  required: [
    "highlight_intro",
    "sections",
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
            UPDATE ai_model_status
            SET
              status = 'active',
              last_success_at = ?,
              quota_reset_at = NULL,
              last_error_status = NULL,
              updated_at = CURRENT_TIMESTAMP
            WHERE model = ?
            `
          )
          .bind(
            new Date().toISOString(),
            geminiModel
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
  typeof aiContent.suitable_for !==
    "string"
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
      typeof aiContent.technical_view !== "string" ||
      typeof aiContent.suitable_for !== "string"
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
                description,
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
                suction,
                battery,
                dustbin,
                water_tank,
                navigation,
                noise,
                hot_water,
                mop_wash,
                mop_dry,
                mop_lift,
                self_empty,
                detergent,
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

        for (
          const robot of robots
        ) {

          const imagesResult =
            await env
              .trung_tu_te_robot_db
              .prepare(
                `
                SELECT
                  drive_id,
                  file_name,
                  sort_order,
                  is_primary
                FROM robot_images
                WHERE robot_id = ?
                ORDER BY
                  sort_order ASC,
                  id ASC
                `
              )
              .bind(
                robot.id
              )
              .all();

          robot.images =
            (
              imagesResult.results ||
              []
            ).map(
              (image) => ({
                id:
                  image.drive_id,
                fileName:
                  image.file_name,
                sortOrder:
                  image.sort_order,
                primary:
                  Boolean(
                    image.is_primary
                  ),
                url:
                  `/api/image/${image.drive_id}`
              })
            );
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
                suction = ?,
                battery = ?,
                dustbin = ?,
                water_tank = ?,
                navigation = ?,
                noise = ?,
                hot_water = ?,
                mop_wash = ?,
                mop_dry = ?,
                mop_lift = ?,
                self_empty = ?,
                detergent = ?,
                updated_at = CURRENT_TIMESTAMP
              WHERE robot_id = ?
              `
            )
            .bind(
              specs.suction || null,
              specs.battery || null,
              specs.dustbin || null,
              specs.water_tank || null,
              specs.navigation || null,
              specs.noise || null,
              specs.hot_water || null,
              specs.mop_wash || null,
              specs.mop_dry || null,
              specs.mop_lift || null,
              specs.self_empty || null,
              specs.detergent || null,
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
                suction,
                battery,
                dustbin,
                water_tank,
                navigation,
                noise,
                hot_water,
                mop_wash,
                mop_dry,
                mop_lift,
                self_empty,
                detergent
              )
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
              `
            )
            .bind(
              robotId,
              specs.suction || null,
              specs.battery || null,
              specs.dustbin || null,
              specs.water_tank || null,
              specs.navigation || null,
              specs.noise || null,
              specs.hot_water || null,
              specs.mop_wash || null,
              specs.mop_dry || null,
              specs.mop_lift || null,
              specs.self_empty || null,
              specs.detergent || null
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
    // STATIC WEBSITE
    // =========================================================

    return env.ASSETS.fetch(
      request
    );
  }
};
