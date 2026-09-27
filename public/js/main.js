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
// PRODUCT GALLERY - LOAD FROM gallery.json
// Dùng chung cho các trang model có gallery.json
const galleryThumbs = document.querySelector("#product-gallery-thumbs");
const galleryMainImage = document.querySelector("#product-main-image");

if (galleryThumbs && galleryMainImage) {
  fetch("images/gallery.json")
    .then((response) => {
      if (!response.ok) {
        throw new Error("Không thể đọc gallery.json");
      }

      return response.json();
    })
    .then((images) => {
      if (!Array.isArray(images) || images.length === 0) {
        throw new Error("gallery.json không có ảnh");
      }

      // Tên model lấy từ alt của ảnh chính
      const modelName =
        galleryMainImage.alt || "Robot lau nhà";

      // Ảnh đầu tiên làm ảnh lớn
      galleryMainImage.src = `images/${images[0]}`;
      galleryMainImage.alt = modelName;

      // Tạo thumbnail cho tất cả ảnh
      images.forEach((imageName, index) => {
        const img = document.createElement("img");

        img.src = `images/${imageName}`;
        img.alt = `${modelName} - hình ${index + 1}`;
        img.loading = "lazy";

        if (index === 0) {
          img.classList.add("active");
        }

        img.addEventListener("click", () => {
          galleryMainImage.src = `images/${imageName}`;
          galleryMainImage.alt = img.alt;

          galleryThumbs
            .querySelectorAll("img")
            .forEach((thumb) => {
              thumb.classList.remove("active");
            });

          img.classList.add("active");
        });

        galleryThumbs.appendChild(img);
      });
    })
    .catch((error) => {
      console.error("Product Gallery:", error);
    });
}
// ============================================================
// DREAME MODELS - TỰ ĐỘNG TẠO DANH SÁCH MODEL
// ============================================================

const dreameModelsList = document.querySelector("#dreame-models-list");

if (dreameModelsList) {
  const modelsUrl = dreameModelsList.dataset.modelsUrl;
  const isModelPage =
    dreameModelsList.classList.contains("article-models-grid");

  // Nếu đang ở trang model, lấy tên thư mục hiện tại
  const pathParts = window.location.pathname
    .split("/")
    .filter(Boolean);

  const currentModel = isModelPage
    ? pathParts[pathParts.length - 1]
    : null;

  fetch(modelsUrl)
    .then((response) => {
      if (!response.ok) {
        throw new Error("Không thể đọc models.json");
      }

      return response.json();
    })
    .then((models) => {
      if (!Array.isArray(models)) {
        throw new Error("models.json không đúng định dạng");
      }

      dreameModelsList.innerHTML = "";

      models.forEach((model) => {
        const link = document.createElement("a");

        // Trang Dreame và trang model dùng đường dẫn khác nhau
        link.href = isModelPage
          ? `../${model.folder}/index.html`
          : `${model.folder}/index.html`;

        if (isModelPage) {
          link.className = "article-model-card";

          const name = document.createElement("strong");
          name.textContent = model.name;

          const status = document.createElement("span");

          if (model.folder === currentModel) {
            status.textContent = "Đang xem";
            link.setAttribute("aria-current", "page");
          } else {
            status.textContent = "Xem thông tin →";
          }

          link.appendChild(name);
          link.appendChild(status);
        } else {
          const name = document.createElement("b");
          name.textContent = model.name;

          const description = document.createElement("span");
          description.textContent = "Thông tin & trải nghiệm →";

          link.appendChild(name);
          link.appendChild(description);
        }

        dreameModelsList.appendChild(link);
      });
    })
    .catch((error) => {
      console.error("Dreame Models:", error);
    });
}