document.addEventListener("DOMContentLoaded", () => {
  const menuButton = document.querySelector(".menu");
  const nav = document.querySelector("nav");

  if (!menuButton || !nav) {
    return;
  }

  menuButton.addEventListener("click", () => {
    nav.classList.toggle("open");

    const isOpen = nav.classList.contains("open");

    menuButton.setAttribute(
      "aria-expanded",
      isOpen ? "true" : "false"
    );
  });

  nav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      nav.classList.remove("open");
      menuButton.setAttribute("aria-expanded", "false");
    });
  });
});
// PRODUCT GALLERY - X50
// X40 dùng gallery riêng bên dưới
const productMainImage = document.querySelector(".product-gallery-main img");
const productThumbs = document.querySelectorAll(".product-gallery-thumbs img");

if (
  productMainImage &&
  productThumbs.length &&
  productMainImage.id !== "product-main-image"
) {
  productThumbs.forEach((thumb) => {
    thumb.addEventListener("click", () => {
      productMainImage.src = thumb.src;
      productMainImage.alt = thumb.alt;
    });
  });
}
// ============================================================
// PRODUCT GALLERY - GOOGLE DRIVE
// ============================================================

const galleryThumbs =
  document.querySelector("#product-gallery-thumbs");

const galleryMainImage =
  document.querySelector("#product-main-image");

if (galleryThumbs && galleryMainImage) {

  const pathParts =
    window.location.pathname
      .split("/")
      .filter(Boolean);

  // Cấu trúc:
  // /robot/dreame/x50/
  // /robot/dreame/x40/
  const dreameIndex =
    pathParts.indexOf("dreame");

  const currentModel =
    dreameIndex !== -1
      ? pathParts[dreameIndex + 1]
      : null;

  // Chỉ chạy trên trang model Dreame
  if (currentModel) {

    fetch("/api/robots")
      .then((response) => {

        if (!response.ok) {
          throw new Error(
            "Không thể đọc API robot"
          );
        }

        return response.json();
      })

      .then((data) => {

        if (!data.ok) {
          throw new Error(
            data.error || "API robot báo lỗi"
          );
        }

        /*
         * Tìm model tương ứng.
         *
         * models.json:
         * x50 → Dreame X50 Ultra
         * x40 → Dreame X40 Ultra
         *
         * Google Drive:
         * ROBOT / Dreame / X50 Ultra
         * ROBOT / Dreame / X40 Ultra
         */

        const robot =
          data.robots.find(
            (item) =>
              item.brand === "Dreame" &&
              item.model
                .toLowerCase()
                .replace(/\s+/g, "")
                .includes(
                  currentModel
                    .toLowerCase()
                )
          );

        if (!robot) {
          throw new Error(
            `Không tìm thấy dữ liệu Google Drive cho model: ${currentModel}`
          );
        }

        if (
          !Array.isArray(robot.images) ||
          robot.images.length === 0
        ) {
          throw new Error(
            `Model ${robot.model} chưa có ảnh trên Google Drive`
          );
        }

        galleryThumbs.innerHTML = "";

        const modelName =
          galleryMainImage.alt ||
          robot.model;

        robot.images.forEach(
          (image, index) => {

            const imageUrl =
              `/api/image/${image.id}`;

            // Ảnh đầu tiên
            // làm ảnh lớn
            if (index === 0) {

              galleryMainImage.src =
                imageUrl;

              galleryMainImage.alt =
                modelName;
            }

            // Tạo thumbnail
            const img =
              document.createElement("img");

            img.src = imageUrl;

            img.alt =
              `${modelName} - hình ${index + 1}`;

            img.loading = "lazy";

            if (index === 0) {
              img.classList.add("active");
            }

            img.addEventListener(
              "click",
              () => {

                galleryMainImage.src =
                  imageUrl;

                galleryMainImage.alt =
                  img.alt;

                galleryThumbs
                  .querySelectorAll("img")
                  .forEach((thumb) => {
                    thumb.classList.remove(
                      "active"
                    );
                  });

                img.classList.add("active");
              }
            );

            galleryThumbs.appendChild(img);
          }
        );
      })

      .catch((error) => {

        console.error(
          "Product Gallery:",
          error
        );

      });
  }
}
// ============================================================
// ROBOT MODELS - TỰ ĐỘNG TẠO DANH SÁCH TỪ D1
// ============================================================

const dreameModelsList =
  document.querySelector("#dreame-models-list");

if (dreameModelsList) {

  fetch("/api/robots")
    .then((response) => {

      if (!response.ok) {
        throw new Error(
          "Không thể đọc API robot"
        );
      }

      return response.json();

    })

    .then((data) => {

      if (
        !data.ok ||
        !Array.isArray(data.robots)
      ) {
        throw new Error(
          data.error ||
          "API robot không đúng định dạng"
        );
      }

      const robots =
        data.robots;

      dreameModelsList.innerHTML = "";

      robots.forEach((robot) => {

        const link =
          document.createElement("a");

        link.href =
          "/robot/template/index.html?slug=" +
          encodeURIComponent(
            robot.slug
          );

        link.className =
          "article-model-card";

        /*
         * Tìm ảnh chính.
         * Nếu chưa có ảnh chính thì lấy ảnh đầu tiên.
         */

        const primaryImage =
          Array.isArray(robot.images)
            ? (
                robot.images.find(
                  (image) =>
                    image.primary === true
                ) ||
                robot.images[0]
              )
            : null;

        /*
         * Khung ảnh
         */

        const imageBox =
          document.createElement("div");

        imageBox.className =
          "article-model-card-image";

        if (
          primaryImage &&
          primaryImage.url
        ) {

          const image =
            document.createElement("img");

          image.src =
            primaryImage.url;

          image.alt =
            robot.model ||
            "Robot lau nhà";

          image.loading =
            "lazy";

          imageBox.appendChild(
            image
          );

        } else {

          imageBox.classList.add(
            "no-image"
          );

          imageBox.textContent =
            "Chưa có hình ảnh";

        }

        /*
         * Nội dung card
         */

        const content =
          document.createElement("div");

        content.className =
          "article-model-card-content";

        /*
         * Thương hiệu
         */

        const brand =
          document.createElement("span");

        brand.className =
          "article-model-card-brand";

        brand.textContent =
          robot.brand ||
          "";

        /*
         * Tên model
         */

        const name =
          document.createElement("strong");

        name.className =
          "article-model-card-name";

        name.textContent =
          robot.model ||
          "Robot lau nhà";

        /*
         * Năm sản xuất
         */

        const year =
          document.createElement("span");

        year.className =
          "article-model-card-year";

        if (
          robot.year !== null &&
          robot.year !== undefined &&
          robot.year !== ""
        ) {

          year.textContent =
            "Năm " +
            robot.year;

        } else {

          year.textContent =
            "Đang cập nhật";

        }

        /*
         * Link chi tiết
         */

        const detail =
          document.createElement("span");

        detail.className =
          "article-model-card-link";

        detail.textContent =
          "Xem chi tiết →";

        content.appendChild(
          brand
        );

        content.appendChild(
          name
        );

        content.appendChild(
          year
        );

        content.appendChild(
          detail
        );

        link.appendChild(
          imageBox
        );

        link.appendChild(
          content
        );

        dreameModelsList.appendChild(
          link
        );

      });

    })

    .catch((error) => {

      console.error(
        "Robot Models:",
        error
      );

      dreameModelsList.innerHTML =
        "<span>Không thể tải danh sách Robot.</span>";

    });

}