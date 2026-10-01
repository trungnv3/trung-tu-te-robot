let currentRobotImages = [];
let addRobotImages = [];
const state = {
  robots: [],
  loading: false,
  error: null
};

async function loadRobots() {
  state.loading = true;
  state.error = null;

  try {
    const response = await fetch("/api/robots");

    if (!response.ok) {
      throw new Error("Không thể kết nối API Robot");
    }

    const data = await response.json();

    if (!data.ok || !Array.isArray(data.robots)) {
      throw new Error("Dữ liệu API Robot không hợp lệ");
    }

    state.robots = data.robots;

    updateDashboardStats();
    renderRobotList();

    console.log("Admin Robot API:", data);
  } catch (error) {
    state.error = error.message;

    console.error("Lỗi tải Robot:", error);

    renderRobotError();
  } finally {
    state.loading = false;
  }
}


function updateDashboardStats() {
  const statCards = document.querySelectorAll(".stat-card");

  if (statCards.length < 3) {
    return;
  }

  const robotNumber = statCards[0].querySelector("strong");
  const imageNumber = statCards[2].querySelector("strong");

  let imageCount = 0;

  state.robots.forEach(function(robot) {
    if (Array.isArray(robot.images)) {
      imageCount += robot.images.length;
    }
  });

  if (robotNumber) {
    robotNumber.textContent = state.robots.length;
  }

  if (imageNumber) {
    imageNumber.textContent = imageCount;
  }
}


function renderRobotList() {
  const container = document.querySelector("#robot-list");

  if (!container) {
    return;
  }

  if (state.robots.length === 0) {
    container.innerHTML =
      '<div class="robot-loading">Chưa có Robot nào.</div>';

    return;
  }

  let html = "";

  state.robots.forEach(function(robot) {
    const images = Array.isArray(robot.images)
      ? robot.images
      : [];

    let imageHtml = '<span>🤖</span>';

    if (images.length > 0) {
      imageHtml =
        '<img src="/api/image/' +
        images[0].id +
        '" alt="' +
        (robot.model || "Robot") +
        '">';
    }

    html +=
    '<article class="robot-card">' +

    '<div class="robot-card-image">' +

      imageHtml +

    '</div>' +

    '<div class="robot-card-content">' +

      '<span class="robot-brand">' +

        (robot.brand || "") +

      '</span>' +

      '<h3>' +

        (robot.model || "") +

      '</h3>' +

      '<p>' +

        images.length +

        ' hình ảnh' +

      '</p>' +

      '<button class="robot-edit-button" data-robot-id="' +

        robot.id +

      '">' +

        'Sửa' +

      '</button>' +
      '<button ' +
          'type="button" ' +
          'class="robot-delete-button" ' +
          'data-robot-id="' +
          robot.id +
        '">' +
          'Xóa' +
        '</button>' +
        '</div>' +

    '</div>' +

  '</article>'
  });

  container.innerHTML = html;
}
function showSection(sectionName) {
  const sections = document.querySelectorAll(".admin-section");

  const navLinks = document.querySelectorAll(
    ".admin-nav a[data-section]"
  );

  sections.forEach(function(section) {
    section.classList.remove("active-section");
  });

  navLinks.forEach(function(link) {
    link.classList.remove("active");
  });

  const targetSection = document.querySelector(
    "#" + sectionName + "-section"
  );

  if (targetSection) {
    targetSection.classList.add("active-section");
  }

  navLinks.forEach(function(link) {
    if (link.dataset.section === sectionName) {
      link.classList.add("active");
    }
  });

  if (sectionName === "robots") {
    renderRobotList();
  }
}


function setupNavigation() {
  const links = document.querySelectorAll("[data-section]");

  links.forEach(function(link) {
    link.addEventListener("click", function(event) {
      event.preventDefault();

      const sectionName = link.dataset.section;

      if (!sectionName) {
        return;
      }

      showSection(sectionName);

      window.location.hash = sectionName;
    });
  });
}
document.addEventListener("click", async function (event) {
  const deleteButton =
    event.target.closest(".robot-delete-button");

  if (deleteButton) {

    const robotId =
      deleteButton.dataset.robotId;

    if (!robotId) {
      return;
    }

    const confirmed =
      window.confirm(
        "Bạn có chắc muốn xóa Robot này không?\n\n" +
        "Toàn bộ thông tin, tính năng và liên kết hình ảnh của Robot sẽ bị xóa khỏi hệ thống."
      );

    if (!confirmed) {
      return;
    }

    deleteButton.disabled = true;
    deleteButton.textContent = "Đang xóa...";

    try {

      const response =
        await fetch(
          "/api/admin/robot/" +
          encodeURIComponent(robotId),
          {
            method: "DELETE"
          }
        );

      const data =
        await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(
          data.error ||
          "Không thể xóa Robot"
        );
      }

      console.log(
        "Đã xóa Robot:",
        robotId
      );

      /*
       * Nếu panel chỉnh sửa đang mở đúng Robot vừa xóa
       * thì đóng panel.
       */
      const editPanel =
        document.querySelector(
          "#robot-edit-panel"
        );

      if (
        editPanel &&
        String(
          editPanel.dataset.robotId || ""
        ) === String(robotId)
      ) {
        editPanel.hidden = true;
        editPanel.removeAttribute(
          "data-robot-id"
        );
      }

      /*
       * Tải lại danh sách Robot
       */
      await loadRobots();

    } catch (error) {

      console.error(
        "Delete robot error:",
        error
      );

      window.alert(
        "Không thể xóa Robot.\n\n" +
        (error.message ||
          "Đã xảy ra lỗi không xác định.")
      );

      deleteButton.disabled = false;
      deleteButton.textContent = "Xóa";
    }

    return;
  }
  const editButton =
    event.target.closest(".robot-edit-button");

  if (!editButton) {
    return;
  }

  const robotId =
    editButton.dataset.robotId;

  console.log(
    "Edit robot ID:",
    robotId
  );

  try {

    const listResponse =
      await fetch(
        "/api/robots"
      );

    const listData =
      await listResponse.json();

    if (!listData.ok) {
      throw new Error(
        listData.error ||
        "Không lấy được danh sách robot"
      );
    }

    const robot =
      listData.robots.find(
        function (item) {
          return String(item.id) ===
            String(robotId);
        }
      );

    if (!robot) {
      throw new Error(
        "Không tìm thấy robot ID " +
        robotId
      );
    }

    console.log(
      "Robot slug:",
      robot.slug
    );

    const detailResponse =
      await fetch(
        "/api/robot/" +
        encodeURIComponent(
          robot.slug
        )
      );

    const detailData =
      await detailResponse.json();

    if (!detailData.ok) {
      throw new Error(
        detailData.error ||
        "Không lấy được dữ liệu chi tiết"
      );
    }

    console.log(
      "Robot detail:",
      detailData.robot
    );
    const selectedRobot =
      detailData.robot;
      console.log(
        "DEBUG SELECTED ROBOT IMAGES:",
        selectedRobot.images
      );
    const editPanel =
      document.querySelector(
        "#robot-edit-panel"
      );

    if (!editPanel) {
      throw new Error(
        "Không tìm thấy form chỉnh sửa robot"
      );
    }
    editPanel.dataset.robotId =
  selectedRobot.id;
    editPanel.hidden = false;

    document.querySelector(
      "#robot-edit-title"
    ).textContent =
      "Chỉnh sửa " +
      (selectedRobot.model || "Robot");

    document.querySelector(
      "#edit-brand"
    ).value =
      selectedRobot.brand || "";

    document.querySelector(
      "#edit-model"
    ).value =
      selectedRobot.model || "";

    document.querySelector(
      "#edit-year"
    ).value =
      selectedRobot.year || "";

    document.querySelector(
      "#edit-category"
    ).value =
      selectedRobot.category || "";

    document.querySelector(
      "#edit-status"
    ).value =
      selectedRobot.status || "active";

    const specs =
      selectedRobot.specs || {};

    document.querySelector(
      "#edit-suction"
    ).value =
      specs.suction || "";

    document.querySelector(
      "#edit-battery"
    ).value =
      specs.battery || "";

    document.querySelector(
      "#edit-dustbin"
    ).value =
      specs.dustbin || "";

    document.querySelector(
      "#edit-water-tank"
    ).value =
      specs.water_tank || "";

    document.querySelector(
      "#edit-navigation"
    ).value =
      specs.navigation || "";

    document.querySelector(
      "#edit-noise"
    ).value =
      specs.noise || "";

    document.querySelector(
      "#edit-hot-water"
    ).value =
      specs.hot_water || "";

    document.querySelector(
      "#edit-mop-wash"
    ).value =
      specs.mop_wash || "";

    document.querySelector(
      "#edit-mop-dry"
    ).value =
      specs.mop_dry || "";

    document.querySelector(
      "#edit-mop-lift"
    ).value =
      specs.mop_lift || "";

    document.querySelector(
      "#edit-self-empty"
    ).value =
      specs.self_empty || "";

    document.querySelector(
      "#edit-detergent"
    ).value =
      specs.detergent || "";

    const content =
      selectedRobot.content || {};

    document.querySelector(
      "#edit-intro"
    ).value =
      content.intro || "";

    document.querySelector(
      "#edit-highlights"
    ).value =
      content.highlights || "";

    document.querySelector(
      "#edit-pros"
    ).value =
      content.pros || "";

    document.querySelector(
      "#edit-notes"
    ).value =
      content.notes || "";

    document.querySelector(
      "#edit-suitable-for"
    ).value =
      content.suitable_for || "";
      const featuresContainer =
      document.querySelector(
        "#edit-features"
      );

    featuresContainer.innerHTML = "";

    const features =
      selectedRobot.features || [];

    features.forEach(
      function (feature) {

        const featureBox =
          document.createElement(
            "div"
          );

        featureBox.className =
          "edit-feature-item";

        featureBox.innerHTML =
          '<label>' +
            '<span>Tiêu đề</span>' +
            '<input ' +
              'type="text" ' +
              'class="edit-feature-title" ' +
              'value="' +
                (feature.title || "")
                  .replace(/"/g, "&quot;") +
              '">' +
          '</label>' +

          '<label>' +
            '<span>Mô tả</span>' +
            '<textarea ' +
              'class="edit-feature-description" ' +
              'rows="4">' +
                (feature.description || "") +
            '</textarea>' +
          '</label>' +

          '<label>' +
            '<span>Thứ tự</span>' +
            '<input ' +
              'type="number" ' +
              'class="edit-feature-order" ' +
              'value="' +
                (feature.sort_order || 0) +
              '">' +
          '</label>';

        featuresContainer.appendChild(
          featureBox
        );

      }
    );
    const imagesContainer =
    document.querySelector(
      "#edit-images"
    );

  imagesContainer.innerHTML = "";

  const images =
  selectedRobot.images || [];

currentRobotImages =
  images.map(
    function (image) {

      return {
        driveId:
          image.driveId,
    
        fileName:
          image.fileName || "",
    
        mimeType:
          image.mimeType || null,
    
        sortOrder:
          Number(
            image.sortOrder || 0
          ),
    
        isPrimary:
          Boolean(
            image.isPrimary
          ),
    
        url:
          image.url || ""
      };
    }
  );
  console.log(
    "Current robot images:",
    currentRobotImages
  );

  images.forEach(
    function (image, index) {

      const imageBox =
        document.createElement(
          "div"
        );

      imageBox.className =
        "robot-edit-image-item";

      imageBox.dataset.driveId =
        image.driveId;

      imageBox.innerHTML =
        '<div class="robot-edit-image-preview">' +

          '<img ' +
            'src="' +
              image.url +
            '" ' +
            'alt="' +
              (image.fileName || "Robot") +
            '">' +

        '</div>' +

        '<div class="robot-edit-image-info">' +

          '<strong>' +
            (image.fileName || "") +
          '</strong>' +

          '<span class="robot-edit-image-status">' +
            (
              image.isPrimary
                ? "★ Ảnh chính"
                : "Ảnh phụ"
            ) +
          '</span>' +

        '</div>' +

        '<div class="robot-edit-image-actions">' +

          '<button ' +
            'type="button" ' +
            'class="image-set-primary" ' +
            'data-index="' +
              index +
            '">' +
            '★' +
          '</button>' +

          '<button ' +
            'type="button" ' +
            'class="image-move-left" ' +
            'data-index="' +
              index +
            '">' +
            '←' +
          '</button>' +

          '<button ' +
            'type="button" ' +
            'class="image-move-right" ' +
            'data-index="' +
              index +
            '">' +
            '→' +
          '</button>' +

          '<button ' +
            'type="button" ' +
            'class="image-remove" ' +
            'data-index="' +
              index +
            '">' +
            'Xóa' +
          '</button>' +

        '</div>';

      imagesContainer.appendChild(
        imageBox
      );

    }
  );
    editPanel.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  } catch (error) {

    console.error(
      "Edit robot error:",
      error
    );

  }

});
document.addEventListener("click", function (event) {

  const cancelButton =
    event.target.closest(
      "#robot-edit-cancel"
    );

  if (!cancelButton) {
    return;
  }

  const editPanel =
    document.querySelector(
      "#robot-edit-panel"
    );

  if (!editPanel) {
    return;
  }

  editPanel.hidden = true;

});
document.addEventListener("click", async function (event) {

  const saveButton =
    event.target.closest(
      "#robot-edit-save"
    );

  if (!saveButton) {
    return;
  }

  const editPanel =
    document.querySelector(
      "#robot-edit-panel"
    );

  if (!editPanel) {
    return;
  }

  const robotId =
    editPanel.dataset.robotId;

  if (!robotId) {
    console.error(
      "Không xác định được Robot ID"
    );
    return;
  }

  try {

    saveButton.disabled = true;

    saveButton.textContent =
      "Đang lưu...";


    const getValue =
      function (selector) {

        const element =
          document.querySelector(
            selector
          );

        return element
          ? element.value
          : "";

      };


    const robot = {

      brand:
        getValue("#edit-brand"),

      model:
        getValue("#edit-model"),

      year:
        getValue("#edit-year"),

      category:
        getValue("#edit-category"),

      status:
        getValue("#edit-status")

    };


    const specs = {

      suction:
        getValue("#edit-suction"),

      battery:
        getValue("#edit-battery"),

      dustbin:
        getValue("#edit-dustbin"),

      water_tank:
        getValue("#edit-water-tank"),

      navigation:
        getValue("#edit-navigation"),

      noise:
        getValue("#edit-noise"),

      hot_water:
        getValue("#edit-hot-water"),

      mop_wash:
        getValue("#edit-mop-wash"),

      mop_dry:
        getValue("#edit-mop-dry"),

      mop_lift:
        getValue("#edit-mop-lift"),

      self_empty:
        getValue("#edit-self-empty"),

      detergent:
        getValue("#edit-detergent")

    };


    const content = {

      intro:
        getValue("#edit-intro"),

      highlights:
        getValue("#edit-highlights"),

      pros:
        getValue("#edit-pros"),

      notes:
        getValue("#edit-notes"),

      suitable_for:
        getValue(
          "#edit-suitable-for"
        )

    };


    const features = [];

    document
      .querySelectorAll(
        "#edit-features .edit-feature-item"
      )
      .forEach(
        function (item) {

          const title =
            item.querySelector(
              ".edit-feature-title"
            );

          const description =
            item.querySelector(
              ".edit-feature-description"
            );

          const sortOrder =
            item.querySelector(
              ".edit-feature-order"
            );

          features.push({

            title:
              title
                ? title.value
                : "",

            description:
              description
                ? description.value
                : "",

            sort_order:
              sortOrder
                ? Number(
                    sortOrder.value
                  )
                : 0

          });

        }
      );


    const response =
      await fetch(
        "/api/admin/robot/" +
        encodeURIComponent(
          robotId
        ),
        {
          method: "PUT",

          headers: {
            "Content-Type":
              "application/json"
          },

          body:
          JSON.stringify({
            robot,
            specs,
            content,
            features,
            images:
              currentRobotImages
          })
        }
      );


    const data =
      await response.json();


    if (!response.ok || !data.ok) {

      throw new Error(
        data.error ||
        "Không thể lưu robot"
      );

    }


    console.log(
      "Robot saved:",
      data
    );


    alert(
      "Đã lưu thay đổi Robot."
    );


    editPanel.hidden = true;


    if (
      typeof loadRobots ===
      "function"
    ) {

      await loadRobots();

    }


  } catch (error) {

    console.error(
      "Save robot error:",
      error
    );

    alert(
      "Lưu thất bại: " +
      error.message
    );

  } finally {

    saveButton.disabled = false;

    saveButton.textContent =
      "Lưu thay đổi";

  }

});
function loadInitialSection() {
  const hash = window.location.hash.replace("#", "");

  if (hash === "robots") {
    showSection("robots");
    return;
  }

  showSection("dashboard");
}


document.addEventListener("DOMContentLoaded", function() {
  setupNavigation();

  loadInitialSection();

  loadRobots();
});
document.addEventListener("click", function (event) {

  const button =
    event.target.closest(
      ".image-set-primary, .image-move-left, .image-move-right, .image-remove"
    );

  if (!button) {
    return;
  }

  const index =
    Number(
      button.dataset.index
    );

  if (
    !Number.isInteger(index) ||
    index < 0 ||
    index >= currentRobotImages.length
  ) {
    return;
  }

  // =========================================================
  // ĐẶT ẢNH CHÍNH
  // =========================================================

  if (
    button.classList.contains(
      "image-set-primary"
    )
  ) {

    currentRobotImages.forEach(
      function (image, imageIndex) {

        image.isPrimary =
          imageIndex === index;

      }
    );

  }

  // =========================================================
  // ĐƯA ẢNH SANG TRÁI
  // =========================================================

  else if (
    button.classList.contains(
      "image-move-left"
    )
  ) {

    if (index > 0) {

      const temp =
        currentRobotImages[index - 1];

      currentRobotImages[index - 1] =
        currentRobotImages[index];

      currentRobotImages[index] =
        temp;

    }

  }

  // =========================================================
  // ĐƯA ẢNH SANG PHẢI
  // =========================================================

  else if (
    button.classList.contains(
      "image-move-right"
    )
  ) {

    if (
      index <
      currentRobotImages.length - 1
    ) {

      const temp =
        currentRobotImages[index + 1];

      currentRobotImages[index + 1] =
        currentRobotImages[index];

      currentRobotImages[index] =
        temp;

    }

  }

  // =========================================================
  // XÓA ẢNH KHỎI ROBOT
  // Không xóa file Google Drive
  // =========================================================

  else if (
    button.classList.contains(
      "image-remove"
    )
  ) {

    const image =
      currentRobotImages[index];

    if (!image) {
      return;
    }

    const confirmed =
      window.confirm(
        "Bỏ hình ảnh này khỏi Robot?\n\n" +
        "File trên Google Drive sẽ không bị xóa."
      );

    if (!confirmed) {
      return;
    }

    currentRobotImages.splice(
      index,
      1
    );

  }
  // =========================================================
  // CẬP NHẬT THỨ TỰ
  // =========================================================

  currentRobotImages.forEach(
    function (image, imageIndex) {

      image.sortOrder =
        imageIndex + 1;

    }
  );

  // =========================================================
  // ĐẢM BẢO LUÔN CÓ 1 ẢNH CHÍNH
  // =========================================================

  if (
    currentRobotImages.length > 0
  ) {

    const primaryExists =
      currentRobotImages.some(
        function (image) {
          return image.isPrimary;
        }
      );

    if (!primaryExists) {

      currentRobotImages[0]
        .isPrimary = true;

    }

  }

  // =========================================================
  // VẼ LẠI DANH SÁCH ẢNH
  // =========================================================

  const imagesContainer =
    document.querySelector(
      "#edit-images"
    );

  if (!imagesContainer) {
    return;
  }

  imagesContainer.innerHTML = "";

  currentRobotImages.forEach(
    function (image, imageIndex) {

      const imageBox =
        document.createElement(
          "div"
        );

      imageBox.className =
        "robot-edit-image-item";

      imageBox.dataset.driveId =
        image.driveId;

      imageBox.innerHTML =
        '<div class="robot-edit-image-preview">' +

          '<img ' +
            'src="/api/image/' +
              image.driveId +
            '" ' +
            'alt="' +
              (image.fileName || "Robot") +
            '">' +

        '</div>' +

        '<div class="robot-edit-image-info">' +

          '<strong>' +
            (image.fileName || "") +
          '</strong>' +

          '<span class="robot-edit-image-status">' +
            (
              image.isPrimary
                ? "★ Ảnh chính"
                : "Ảnh phụ"
            ) +
          '</span>' +

        '</div>' +

        '<div class="robot-edit-image-actions">' +

          '<button ' +
            'type="button" ' +
            'class="image-set-primary" ' +
            'data-index="' +
              imageIndex +
            '">' +
            '★' +
          '</button>' +

          '<button ' +
            'type="button" ' +
            'class="image-move-left" ' +
            'data-index="' +
              imageIndex +
            '">' +
            '←' +
          '</button>' +

          '<button ' +
            'type="button" ' +
            'class="image-move-right" ' +
            'data-index="' +
              imageIndex +
            '">' +
            '→' +
          '</button>' +

          '<button ' +
            'type="button" ' +
            'class="image-remove" ' +
            'data-index="' +
              imageIndex +
            '">' +
            'Xóa' +
          '</button>' +

        '</div>';

      imagesContainer.appendChild(
        imageBox
      );

    }
  );

});
document.addEventListener("click", function (event) {

  /* =======================================================
     ĐÓNG HỘP CHỌN HÌNH ẢNH
     ======================================================= */

  const closeButton =
    event.target.closest(
      ".robot-image-picker-close"
    );

  if (closeButton) {

    const modal =
      document.querySelector(
        "#robot-image-picker"
      );

    if (modal) {
      modal.hidden = true;
    }

    return;
  }


  /* =======================================================
     THÊM ẢNH ĐÃ CHỌN
     ======================================================= */

  const addSelectedButton =
    event.target.closest(
      "#robot-image-picker-add"
    );

  if (!addSelectedButton) {
    return;
  }

  const modal =
    document.querySelector(
      "#robot-image-picker"
    );

  if (!modal) {
    return;
  }

  const checkboxes =
    modal.querySelectorAll(
      ".robot-image-picker-checkbox:checked"
    );

  if (
    checkboxes.length === 0
  ) {

    alert(
      "Vui lòng chọn ít nhất một hình ảnh."
    );

    return;
  }


  /* =======================================================
     LẤY THÔNG TIN ẢNH ĐÃ CHỌN
     ======================================================= */

  const selectedIds =
    Array.from(
      checkboxes
    ).map(
      function (checkbox) {
        return checkbox.value;
      }
    );


  /*
   * Lấy thông tin ảnh từ danh sách đang hiển thị.
   * API đã trả về dữ liệu ảnh nhưng checkbox chỉ giữ driveId,
   * vì vậy đọc lại thông tin từ DOM.
   */

  const selectedImages = [];


  checkboxes.forEach(
    function (checkbox) {

      const item =
        checkbox.closest(
          ".robot-image-picker-item"
        );

      if (!item) {
        return;
      }

      const imageElement =
        item.querySelector(
          "img"
        );

      const nameElement =
        item.querySelector(
          ".robot-image-picker-info strong"
        );

      selectedImages.push({

        driveId:
          checkbox.value,

        fileName:
          nameElement
            ? nameElement.textContent
            : "",

        mimeType:
          null,

        sortOrder:
          0,

        isPrimary:
          false,

        url:
          imageElement
            ? imageElement.src
            : "/api/image/" +
              checkbox.value

      });

    }
  );


  /* =======================================================
     KIỂM TRA ẢNH ĐÃ CÓ TRONG ROBOT CHƯA
     ======================================================= */

  selectedImages.forEach(
    function (image) {

      const exists =
        currentRobotImages.some(
          function (currentImage) {

            return (
              currentImage.driveId ===
              image.driveId
            );

          }
        );

      if (exists) {
        return;
      }

      currentRobotImages.push(
        image
      );

    }
  );


  /* =======================================================
     CẬP NHẬT THỨ TỰ ẢNH
     ======================================================= */

  currentRobotImages.forEach(
    function (image, index) {

      image.sortOrder =
        index + 1;

    }
  );


  /* =======================================================
     ĐẢM BẢO LUÔN CÓ ẢNH CHÍNH
     ======================================================= */

  if (
    currentRobotImages.length > 0
  ) {

    const primaryExists =
      currentRobotImages.some(
        function (image) {

          return image.isPrimary;

        }
      );

    if (!primaryExists) {

      currentRobotImages[0]
        .isPrimary = true;

    }

  }


  /* =======================================================
     HIỂN THỊ LẠI DANH SÁCH ẢNH
     ======================================================= */

  const imagesContainer =
    document.querySelector(
      "#edit-images"
    );

  if (imagesContainer) {

    imagesContainer.innerHTML =
      "";

    currentRobotImages.forEach(
      function (image, imageIndex) {

        const imageBox =
          document.createElement(
            "div"
          );

        imageBox.className =
          "robot-edit-image-item";

        imageBox.dataset.driveId =
          image.driveId;

        imageBox.innerHTML =
          '<div class="robot-edit-image-preview">' +

            '<img ' +
              'src="/api/image/' +
                image.driveId +
              '" ' +
              'alt="' +
                (image.fileName || "Robot") +
              '">' +

          '</div>' +

          '<div class="robot-edit-image-info">' +

            '<strong>' +
              (image.fileName || "") +
            '</strong>' +

            '<span class="robot-edit-image-status">' +
              (
                image.isPrimary
                  ? "★ Ảnh chính"
                  : "Ảnh phụ"
              ) +
            '</span>' +

          '</div>' +

          '<div class="robot-edit-image-actions">' +

            '<button type="button" class="image-set-primary" data-index="' +
              imageIndex +
            '">★</button>' +

            '<button type="button" class="image-move-left" data-index="' +
              imageIndex +
            '">←</button>' +

            '<button type="button" class="image-move-right" data-index="' +
              imageIndex +
            '">→</button>' +

            '<button type="button" class="image-remove" data-index="' +
              imageIndex +
            '">Xóa</button>' +

          '</div>';

        imagesContainer.appendChild(
          imageBox
        );

      }
    );

  }


  /* =======================================================
     ĐÓNG HỘP CHỌN ẢNH
     ======================================================= */

  modal.hidden =
    true;


  console.log(
    "Đã thêm ảnh:",
    selectedIds
  );

  console.log(
    "Danh sách ảnh hiện tại:",
    currentRobotImages
  );

});
// ============================================================
// ============================================================
// THÊM ROBOT - HỆ THỐNG FORM 5 BƯỚC
// ============================================================

const addRobotState = {
  step: 1,

  robot: {
    brand: "",
    model: "",
    year: "",
    category: "robot-lau-nha",
    status: "active"
  },

  specs: {
    suction: "",
    battery: "",
    dustbin: "",
    water_tank: "",
    navigation: "",
    noise: "",
    hot_water: "",
    mop_wash: "",
    mop_dry: "",
    mop_lift: "",
    self_empty: "",
    detergent: ""
  },

  content: {
    intro: "",
    highlights: "",
    pros: "",
    notes: "",
    suitable_for: ""
  },

  features: []
};


// ============================================================
// HÀM TIỆN ÍCH
// ============================================================

function getAddRobotPanel() {
  return document.querySelector("#robot-add-panel");
}


function scrollAddRobotPanel() {
  const panel = getAddRobotPanel();

  if (!panel) {
    return;
  }

  panel.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
}


function escapeAddRobotHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


function resetAddRobotState() {
  addRobotImages = [];

  addRobotState.step = 1;

  addRobotState.robot = {
    brand: "",
    model: "",
    year: "",
    category: "robot-lau-nha",
    status: "active"
  };

  addRobotState.specs = {
    suction: "",
    battery: "",
    dustbin: "",
    water_tank: "",
    navigation: "",
    noise: "",
    hot_water: "",
    mop_wash: "",
    mop_dry: "",
    mop_lift: "",
    self_empty: "",
    detergent: ""
  };

  addRobotState.content = {
    intro: "",
    highlights: "",
    pros: "",
    notes: "",
    suitable_for: ""
  };

  addRobotState.features = [];
}


// ============================================================
// LƯU BƯỚC 1
// ============================================================

function saveAddRobotStep1() {
  const brandInput = document.querySelector("#add-brand");
  const modelInput = document.querySelector("#add-model");
  const yearInput = document.querySelector("#add-year");
  const categoryInput = document.querySelector("#add-category");
  const statusInput = document.querySelector("#add-status");

  if (!brandInput || !modelInput || !yearInput || !categoryInput || !statusInput) {
    return false;
  }

  const brand = brandInput.value.trim();
  const model = modelInput.value.trim();
  const year = yearInput.value.trim();
  const category = categoryInput.value.trim();
  const status = statusInput.value;

  if (!brand) {
    alert("Vui lòng nhập Hãng.");
    brandInput.focus();
    return false;
  }

  if (!model) {
    alert("Vui lòng nhập Model.");
    modelInput.focus();
    return false;
  }

  if (year) {
    const yearNumber = Number(year);

    if (
      !Number.isInteger(yearNumber) ||
      yearNumber < 2000 ||
      yearNumber > 2100
    ) {
      alert("Năm không hợp lệ.");
      yearInput.focus();
      return false;
    }
  }

  addRobotState.robot.brand = brand;
  addRobotState.robot.model = model;
  addRobotState.robot.year = year;
  addRobotState.robot.category = category;
  addRobotState.robot.status = status;

  return true;
}


// ============================================================
// LƯU BƯỚC 2
// ============================================================

function saveAddRobotStep2() {
  const ids = [
    "suction",
    "battery",
    "dustbin",
    "water-tank",
    "navigation",
    "noise",
    "hot-water",
    "mop-wash",
    "mop-dry",
    "mop-lift",
    "self-empty",
    "detergent"
  ];

  ids.forEach(function (id) {
    const input = document.querySelector("#add-" + id);

    if (!input) {
      return;
    }

    addRobotState.specs[
      id.replace(/-([a-z])/g, function (_, letter) {
        return letter.toUpperCase();
      })
    ] = input.value.trim();
  });

  return true;
}


// ============================================================
// LƯU BƯỚC 3
// ============================================================

function saveAddRobotStep3() {
  const fields = [
    ["intro", "intro"],
    ["highlights", "highlights"],
    ["pros", "pros"],
    ["notes", "notes"],
    ["suitable-for", "suitable_for"]
  ];

  fields.forEach(function (item) {
    const id = item[0];
    const key = item[1];

    const input = document.querySelector("#add-" + id);

    if (!input) {
      return;
    }

    addRobotState.content[key] = input.value.trim();
  });

  return true;
}


// ============================================================
// LƯU BƯỚC 4
// ============================================================

function saveAddRobotStep4() {
  const container =
    document.querySelector("#robot-add-features");

  if (!container) {
    return true;
  }

  const rows =
    container.querySelectorAll(
      ".robot-add-feature-row"
    );

  const features = [];

  rows.forEach(function (row) {
    const titleInput =
      row.querySelector(
        ".add-feature-title"
      );

    const descriptionInput =
      row.querySelector(
        ".add-feature-description"
      );

    const title =
      titleInput
        ? titleInput.value.trim()
        : "";

    const description =
      descriptionInput
        ? descriptionInput.value.trim()
        : "";

    if (!title) {
      return;
    }

    features.push({
      title: title,
      description: description,
      sort_order: features.length + 1
    });
  });

  addRobotState.features =
    features;

  return true;
}


// ============================================================
// BƯỚC 1
// ============================================================

function renderAddRobotStep1() {
  const panel =
    getAddRobotPanel();

  if (!panel) {
    return;
  }

  const robot =
    addRobotState.robot;

  panel.innerHTML =
    '<div class="panel-header">' +
      '<div>' +
        '<p class="eyebrow">THÊM MỚI · BƯỚC 1/5</p>' +
        '<h2>Thông tin Robot</h2>' +
      '</div>' +
      '<button type="button" id="robot-add-close" class="button-secondary">Đóng</button>' +
    '</div>' +

    '<div class="admin-form-section">' +
      '<h3>Thông tin cơ bản</h3>' +

      '<div class="admin-form-grid">' +

        '<label>' +
          '<span>Hãng</span>' +
          '<input id="add-brand" type="text" value="' +
            escapeAddRobotHtml(robot.brand) +
            '" placeholder="Ví dụ: Dreame">' +
        '</label>' +

        '<label>' +
          '<span>Model</span>' +
          '<input id="add-model" type="text" value="' +
            escapeAddRobotHtml(robot.model) +
            '" placeholder="Ví dụ: X50 Ultra">' +
        '</label>' +

        '<label>' +
          '<span>Năm</span>' +
          '<input id="add-year" type="number" value="' +
            escapeAddRobotHtml(robot.year) +
            '" placeholder="2026">' +
        '</label>' +

        '<label>' +
          '<span>Danh mục</span>' +
          '<input id="add-category" type="text" value="' +
            escapeAddRobotHtml(robot.category) +
            '" placeholder="Robot lau nhà & hút bụi">' +
        '</label>' +

        '<label>' +
          '<span>Trạng thái</span>' +
          '<select id="add-status">' +
            '<option value="active" ' +
              (robot.status === "active" ? "selected" : "") +
            '>Đang hiển thị</option>' +
            '<option value="inactive" ' +
              (robot.status === "inactive" ? "selected" : "") +
            '>Tạm ẩn</option>' +
          '</select>' +
        '</label>' +

      '</div>' +
    '</div>' +

    '<div class="admin-form-actions">' +
      '<button type="button" id="robot-add-cancel" class="button-secondary">Hủy</button>' +
      '<button type="button" id="robot-add-next-step-1" class="button-primary">Tiếp tục</button>' +
    '</div>';

  scrollAddRobotPanel();
}


// ============================================================
// BƯỚC 2
// ============================================================

function renderAddRobotStep2() {
  const panel =
    getAddRobotPanel();

  if (!panel) {
    return;
  }

  const specs =
    addRobotState.specs;

  panel.innerHTML =
    '<div class="panel-header">' +
      '<div>' +
        '<p class="eyebrow">THÊM MỚI · BƯỚC 2/5</p>' +
        '<h2>Thông số kỹ thuật</h2>' +
      '</div>' +
      '<button type="button" id="robot-add-close" class="button-secondary">Đóng</button>' +
    '</div>' +

    '<div class="admin-form-section">' +
      '<h3>Thông số Robot</h3>' +

      '<div class="admin-form-grid">' +

        '<label>' +
          '<span>Lực hút</span>' +
          '<input id="add-suction" type="text" value="' +
            escapeAddRobotHtml(specs.suction) +
            '" placeholder="Ví dụ: 20.000 Pa">' +
        '</label>' +

        '<label>' +
          '<span>Pin</span>' +
          '<input id="add-battery" type="text" value="' +
            escapeAddRobotHtml(specs.battery) +
            '" placeholder="Ví dụ: 6.400 mAh">' +
        '</label>' +

        '<label>' +
          '<span>Hộp bụi</span>' +
          '<input id="add-dustbin" type="text" value="' +
            escapeAddRobotHtml(specs.dustbin) +
            '" placeholder="Ví dụ: 395 ml">' +
        '</label>' +

        '<label>' +
          '<span>Bình nước</span>' +
          '<input id="add-water-tank" type="text" value="' +
            escapeAddRobotHtml(specs.water_tank) +
            '" placeholder="Ví dụ: 4,5 L / 4,0 L">' +
        '</label>' +

        '<label>' +
          '<span>Điều hướng</span>' +
          '<input id="add-navigation" type="text" value="' +
            escapeAddRobotHtml(specs.navigation) +
            '" placeholder="Ví dụ: LiDAR + Camera AI">' +
        '</label>' +

        '<label>' +
          '<span>Độ ồn</span>' +
          '<input id="add-noise" type="text" value="' +
            escapeAddRobotHtml(specs.noise) +
            '" placeholder="Ví dụ: 65 dB">' +
        '</label>' +

        '<label>' +
          '<span>Nước nóng</span>' +
          '<input id="add-hot-water" type="text" value="' +
            escapeAddRobotHtml(specs.hot_water) +
            '" placeholder="Ví dụ: Tới 80°C">' +
        '</label>' +

        '<label>' +
          '<span>Giặt khăn</span>' +
          '<input id="add-mop-wash" type="text" value="' +
            escapeAddRobotHtml(specs.mop_wash) +
            '" placeholder="Ví dụ: Có">' +
        '</label>' +

        '<label>' +
          '<span>Sấy khăn</span>' +
          '<input id="add-mop-dry" type="text" value="' +
            escapeAddRobotHtml(specs.mop_dry) +
            '" placeholder="Ví dụ: Sấy bằng khí nóng">' +
        '</label>' +

        '<label>' +
          '<span>Nâng khăn</span>' +
          '<input id="add-mop-lift" type="text" value="' +
            escapeAddRobotHtml(specs.mop_lift) +
            '" placeholder="Ví dụ: 10,5 mm">' +
        '</label>' +

        '<label>' +
          '<span>Tự đổ bụi</span>' +
          '<input id="add-self-empty" type="text" value="' +
            escapeAddRobotHtml(specs.self_empty) +
            '" placeholder="Ví dụ: Túi bụi 3,2 L">' +
        '</label>' +

        '<label>' +
          '<span>Dung dịch vệ sinh</span>' +
          '<input id="add-detergent" type="text" value="' +
            escapeAddRobotHtml(specs.detergent) +
            '" placeholder="Ví dụ: Có">' +
        '</label>' +

      '</div>' +
    '</div>' +

    '<div class="admin-form-actions">' +
      '<button type="button" id="robot-add-back-step-2" class="button-secondary">← Quay lại</button>' +
      '<button type="button" id="robot-add-next-step-2" class="button-primary">Tiếp tục</button>' +
    '</div>';

  scrollAddRobotPanel();
}


// ============================================================
// BƯỚC 3
// ============================================================

function renderAddRobotStep3() {
  const panel =
    getAddRobotPanel();

  if (!panel) {
    return;
  }

  const content =
    addRobotState.content;

  panel.innerHTML =
    '<div class="panel-header">' +
      '<div>' +
        '<p class="eyebrow">THÊM MỚI · BƯỚC 3/5</p>' +
        '<h2>Nội dung Robot</h2>' +
      '</div>' +
      '<button type="button" id="robot-add-close" class="button-secondary">Đóng</button>' +
    '</div>' +

    '<div class="admin-form-section">' +
      '<h3>Nội dung hiển thị trên trang Robot</h3>' +

      '<div class="admin-form-content">' +

        '<label>' +
          '<span>Giới thiệu</span>' +
          '<textarea id="add-intro" rows="6" placeholder="Giới thiệu tổng quan về Robot...">' +
            escapeAddRobotHtml(content.intro) +
          '</textarea>' +
        '</label>' +

        '<label>' +
          '<span>Điểm nổi bật</span>' +
          '<textarea id="add-highlights" rows="6" placeholder="Các điểm nổi bật của Robot...">' +
            escapeAddRobotHtml(content.highlights) +
          '</textarea>' +
        '</label>' +

        '<label>' +
          '<span>Ưu điểm</span>' +
          '<textarea id="add-pros" rows="6" placeholder="Những ưu điểm đáng chú ý...">' +
            escapeAddRobotHtml(content.pros) +
          '</textarea>' +
        '</label>' +

        '<label>' +
          '<span>Lưu ý</span>' +
          '<textarea id="add-notes" rows="6" placeholder="Những lưu ý khi sử dụng hoặc bảo trì...">' +
            escapeAddRobotHtml(content.notes) +
          '</textarea>' +
        '</label>' +

        '<label>' +
          '<span>Phù hợp với</span>' +
          '<textarea id="add-suitable-for" rows="6" placeholder="Robot phù hợp với nhu cầu hoặc không gian nào...">' +
            escapeAddRobotHtml(content.suitable_for) +
          '</textarea>' +
        '</label>' +

      '</div>' +
    '</div>' +

    '<div class="admin-form-actions">' +
      '<button type="button" id="robot-add-back-step-3" class="button-secondary">← Quay lại</button>' +
      '<button type="button" id="robot-add-next-step-3" class="button-primary">Tiếp tục</button>' +
    '</div>';

  scrollAddRobotPanel();
}


// ============================================================
// BƯỚC 4
// ============================================================

function renderAddRobotStep4() {
  const panel =
    getAddRobotPanel();

  if (!panel) {
    return;
  }

  panel.innerHTML =
    '<div class="panel-header">' +
      '<div>' +
        '<p class="eyebrow">THÊM MỚI · BƯỚC 4/5</p>' +
        '<h2>Tính năng nổi bật</h2>' +
      '</div>' +
      '<button type="button" id="robot-add-close" class="button-secondary">Đóng</button>' +
    '</div>' +

    '<div class="admin-form-section">' +

      '<div class="robot-add-feature-header">' +
        '<div>' +
          '<h3>Tính năng Robot</h3>' +
          '<p class="robot-add-feature-note">Thêm các tính năng chính của Robot.</p>' +
        '</div>' +
        '<button type="button" id="robot-add-feature" class="button-secondary">＋ Thêm tính năng</button>' +
      '</div>' +

      '<div id="robot-add-features" class="robot-add-features"></div>' +

    '</div>' +

    '<div class="admin-form-actions">' +
      '<button type="button" id="robot-add-back-step-4" class="button-secondary">← Quay lại</button>' +
      '<button type="button" id="robot-add-next-step-4" class="button-primary">Tiếp tục</button>' +
    '</div>';

  const container =
    document.querySelector(
      "#robot-add-features"
    );

  if (container) {
    addRobotState.features.forEach(
      function (feature) {
        createAddRobotFeatureRow(
          container,
          feature
        );
      }
    );
  }

  scrollAddRobotPanel();
}


// ============================================================
// TẠO DÒNG TÍNH NĂNG
// ============================================================

function createAddRobotFeatureRow(
  container,
  feature
) {
  if (!container) {
    return;
  }

  const row =
    document.createElement(
      "div"
    );

  row.className =
    "robot-add-feature-row";

  row.innerHTML =
    '<div class="robot-add-feature-number">1</div>' +

    '<div class="robot-add-feature-fields">' +

      '<label>' +
        '<span>Tên tính năng</span>' +
        '<input type="text" class="add-feature-title" value="' +
          escapeAddRobotHtml(
            feature && feature.title
              ? feature.title
              : ""
          ) +
          '" placeholder="Ví dụ: Lực hút mạnh">' +
      '</label>' +

      '<label>' +
        '<span>Mô tả</span>' +
        '<textarea class="add-feature-description" rows="3" placeholder="Mô tả ngắn về tính năng...">' +
          escapeAddRobotHtml(
            feature && feature.description
              ? feature.description
              : ""
          ) +
        '</textarea>' +
      '</label>' +

    '</div>' +

    '<button type="button" class="robot-add-feature-remove" title="Xóa tính năng">Xóa</button>';

  container.appendChild(
    row
  );

  updateAddRobotFeatureNumbers();
}


function updateAddRobotFeatureNumbers() {
  const rows =
    document.querySelectorAll(
      "#robot-add-features .robot-add-feature-row"
    );

  rows.forEach(
    function (row, index) {
      const number =
        row.querySelector(
          ".robot-add-feature-number"
        );

      if (number) {
        number.textContent =
          index + 1;
      }
    }
  );
}


// ============================================================
// BƯỚC 5
// ============================================================

function renderAddRobotStep5() {
  const panel =
    getAddRobotPanel();

  if (!panel) {
    return;
  }

  panel.innerHTML =
    '<div class="panel-header">' +
      '<div>' +
        '<p class="eyebrow">THÊM MỚI · BƯỚC 5/5</p>' +
        '<h2>Hình ảnh Robot</h2>' +
      '</div>' +
      '<button type="button" id="robot-add-close" class="button-secondary">Đóng</button>' +
    '</div>' +

    '<div class="admin-form-section">' +

      '<div class="robot-add-feature-header">' +
        '<div>' +
          '<h3>Hình ảnh Robot</h3>' +
          '<p class="robot-add-image-note">Chọn hình ảnh từ Google Drive của Robot.</p>' +
        '</div>' +

        '<button type="button" id="robot-add-image" class="button-secondary">＋ Thêm hình ảnh</button>' +
      '</div>' +

      '<div id="robot-add-images" class="robot-add-images"></div>' +

    '</div>' +

    '<div class="admin-form-actions">' +
      '<button type="button" id="robot-add-back-step-5" class="button-secondary">← Quay lại</button>' +
      '<button type="button" id="robot-add-create" class="button-primary">Tạo Robot</button>' +
    '</div>';

  renderAddRobotImages();

  scrollAddRobotPanel();
}


// ============================================================
// HIỂN THỊ DANH SÁCH ẢNH ĐÃ CHỌN
// ============================================================

function renderAddRobotImages() {
  const container =
    document.querySelector(
      "#robot-add-images"
    );

  if (!container) {
    return;
  }

  container.innerHTML =
    "";

  if (
    !Array.isArray(addRobotImages) ||
    addRobotImages.length === 0
  ) {
    container.innerHTML =
      '<div class="robot-image-picker-empty">' +
        'Chưa có hình ảnh nào được chọn.' +
      '</div>';

    return;
  }

  addRobotImages.forEach(
    function (image, index) {
      const imageBox =
        document.createElement(
          "div"
        );

      imageBox.className =
        "robot-add-image-item";

      imageBox.innerHTML =
        '<div class="robot-add-image-preview">' +
          '<img src="/api/image/' +
            encodeURIComponent(
              image.driveId
            ) +
            '" alt="' +
            escapeAddRobotHtml(
              image.fileName ||
              "Robot"
            ) +
          '">' +
        '</div>' +

        '<div class="robot-add-image-info">' +
          '<strong>' +
            escapeAddRobotHtml(
              image.fileName ||
              ""
            ) +
          '</strong>' +

          '<span>' +
            (
              image.isPrimary
                ? "★ Ảnh chính"
                : "Ảnh " + (index + 1)
            ) +
          '</span>' +
        '</div>' +

        '<div class="robot-add-image-actions">' +

          '<button type="button" class="button-secondary robot-add-image-primary" data-drive-id="' +
            escapeAddRobotHtml(
              image.driveId
            ) +
            '">' +
            'Đặt ảnh chính' +
          '</button>' +

          '<button type="button" class="button-secondary robot-add-image-left" data-drive-id="' +
            escapeAddRobotHtml(
              image.driveId
            ) +
            '">' +
            '←' +
          '</button>' +

          '<button type="button" class="button-secondary robot-add-image-right" data-drive-id="' +
            escapeAddRobotHtml(
              image.driveId
            ) +
            '">' +
            '→' +
          '</button>' +

          '<button type="button" class="button-secondary robot-add-image-remove" data-drive-id="' +
            escapeAddRobotHtml(
              image.driveId
            ) +
            '">' +
            'Xóa' +
          '</button>' +

        '</div>';

      container.appendChild(
        imageBox
      );
    }
  );
}


// ============================================================
// HIỂN THỊ BƯỚC
// ============================================================

function renderAddRobotStep(step) {
  addRobotState.step =
    step;

  if (step === 1) {
    renderAddRobotStep1();
    return;
  }

  if (step === 2) {
    renderAddRobotStep2();
    return;
  }

  if (step === 3) {
    renderAddRobotStep3();
    return;
  }

  if (step === 4) {
    renderAddRobotStep4();
    return;
  }

  if (step === 5) {
    renderAddRobotStep5();
  }
}


// ============================================================
// THÊM ROBOT - MỞ FORM
// ============================================================

document.addEventListener(
  "click",
  function (event) {

    const addButton =
      event.target.closest(
        "#robot-add-button"
      );

    if (!addButton) {
      return;
    }

    const existingPanel =
      document.querySelector(
        "#robot-add-panel"
      );

    if (existingPanel) {
      existingPanel.hidden =
        false;

      resetAddRobotState();

      renderAddRobotStep1();

      return;
    }

    const panel =
      document.createElement(
        "section"
      );

    panel.id =
      "robot-add-panel";

    panel.className =
      "panel robot-add-panel";

    const robotSection =
      document.querySelector(
        "#robots-section"
      );

    if (!robotSection) {
      alert(
        "Không tìm thấy khu vực danh sách Robot."
      );

      return;
    }

    robotSection.appendChild(
      panel
    );

    resetAddRobotState();

    panel.hidden =
      false;

    renderAddRobotStep1();

  }
);


// ============================================================
// ĐÓNG / HỦY FORM
// ============================================================

document.addEventListener(
  "click",
  function (event) {

    const closeButton =
      event.target.closest(
        "#robot-add-close, #robot-add-cancel"
      );

    if (!closeButton) {
      return;
    }

    const panel =
      getAddRobotPanel();

    if (!panel) {
      return;
    }

    panel.hidden =
      true;

  }
);


// ============================================================
// BƯỚC 1 → BƯỚC 2
// ============================================================

document.addEventListener(
  "click",
  function (event) {

    const nextButton =
      event.target.closest(
        "#robot-add-next-step-1"
      );

    if (!nextButton) {
      return;
    }

    if (!saveAddRobotStep1()) {
      return;
    }

    renderAddRobotStep2();

  }
);


// ============================================================
// BƯỚC 2 → BƯỚC 1
// ============================================================

document.addEventListener(
  "click",
  function (event) {

    const backButton =
      event.target.closest(
        "#robot-add-back-step-2"
      );

    if (!backButton) {
      return;
    }

    saveAddRobotStep2();

    renderAddRobotStep1();

  }
);


// ============================================================
// BƯỚC 2 → BƯỚC 3
// ============================================================

document.addEventListener(
  "click",
  function (event) {

    const nextButton =
      event.target.closest(
        "#robot-add-next-step-2"
      );

    if (!nextButton) {
      return;
    }

    saveAddRobotStep2();

    renderAddRobotStep3();

  }
);


// ============================================================
// BƯỚC 3 → BƯỚC 2
// ============================================================

document.addEventListener(
  "click",
  function (event) {

    const backButton =
      event.target.closest(
        "#robot-add-back-step-3"
      );

    if (!backButton) {
      return;
    }

    saveAddRobotStep3();

    renderAddRobotStep2();

  }
);


// ============================================================
// BƯỚC 3 → BƯỚC 4
// ============================================================

document.addEventListener(
  "click",
  function (event) {

    const nextButton =
      event.target.closest(
        "#robot-add-next-step-3"
      );

    if (!nextButton) {
      return;
    }

    saveAddRobotStep3();

    renderAddRobotStep4();

  }
);


// ============================================================
// BƯỚC 4 → BƯỚC 3
// ============================================================

document.addEventListener(
  "click",
  function (event) {

    const backButton =
      event.target.closest(
        "#robot-add-back-step-4"
      );

    if (!backButton) {
      return;
    }

    saveAddRobotStep4();

    renderAddRobotStep3();

  }
);


// ============================================================
// THÊM TÍNH NĂNG
// ============================================================

document.addEventListener(
  "click",
  function (event) {

    const addFeatureButton =
      event.target.closest(
        "#robot-add-feature"
      );

    if (!addFeatureButton) {
      return;
    }

    const container =
      document.querySelector(
        "#robot-add-features"
      );

    if (!container) {
      return;
    }

    createAddRobotFeatureRow(
      container,
      {
        title: "",
        description: ""
      }
    );

  }
);


// ============================================================
// XÓA TÍNH NĂNG
// ============================================================

document.addEventListener(
  "click",
  function (event) {

    const removeButton =
      event.target.closest(
        ".robot-add-feature-remove"
      );

    if (!removeButton) {
      return;
    }

    const row =
      removeButton.closest(
        ".robot-add-feature-row"
      );

    if (!row) {
      return;
    }

    row.remove();

    updateAddRobotFeatureNumbers();

  }
);


// ============================================================
// BƯỚC 4 → BƯỚC 5
// ============================================================

document.addEventListener(
  "click",
  function (event) {

    const nextButton =
      event.target.closest(
        "#robot-add-next-step-4"
      );

    if (!nextButton) {
      return;
    }

    saveAddRobotStep4();

    renderAddRobotStep5();

  }
);


// ============================================================
// BƯỚC 5 → BƯỚC 4
// ============================================================

document.addEventListener(
  "click",
  function (event) {

    const backButton =
      event.target.closest(
        "#robot-add-back-step-5"
      );

    if (!backButton) {
      return;
    }

    renderAddRobotStep4();

  }
);


// ============================================================
// GOOGLE DRIVE - MỞ BỘ CHỌN HÌNH ẢNH
// ============================================================

document.addEventListener(
  "click",
  async function (event) {
    const addImageButton =
    event.target.closest(
      "#robot-add-image"
    );
  
  if (!addImageButton) {
    return;
  }
  
  const addPanel =
    getAddRobotPanel();
  
  if (!addPanel) {
    return;
  }
  
  try {
  
    addImageButton.disabled =
      true;
  
    addImageButton.textContent =
      "Đang tải thư mục...";
  
    const folderResponse =
      await fetch(
        "/api/admin/drive/folders"
      );
  
    const folderData =
      await folderResponse.json();
  
    if (
      !folderResponse.ok ||
      !folderData.ok
    ) {
      throw new Error(
        folderData.error ||
        "Không thể lấy danh sách thư mục"
      );
    }
  
    const folders =
      Array.isArray(
        folderData.folders
      )
        ? folderData.folders
        : [];
  
    if (
      folders.length === 0
    ) {
      throw new Error(
        "Không có thư mục Google Drive"
      );
    }
  
    let modal =
      document.querySelector(
        "#robot-add-image-picker"
      );
  
    if (!modal) {
      modal =
        document.createElement(
          "div"
        );
  
      modal.id =
        "robot-add-image-picker";
  
      modal.className =
        "robot-image-picker";
  
      document.body.appendChild(
        modal
      );
    }
  
    modal.innerHTML =
      '<div class="robot-image-picker-overlay">' +
  
        '<div class="robot-image-picker-dialog">' +
  
          '<div class="robot-image-picker-header">' +
  
            '<div>' +
              '<p class="eyebrow">GOOGLE DRIVE</p>' +
              '<h3>Thêm hình ảnh</h3>' +
            '</div>' +
  
            '<button type="button" class="robot-add-image-picker-close">×</button>' +
  
          '</div>' +
  
          '<div class="robot-image-picker-browser">' +
  
            '<div class="robot-image-picker-folders">' +
              '<div class="robot-image-picker-pane-title">Thư mục</div>' +
              '<div id="robot-add-folder-tree" class="robot-folder-tree"></div>' +
            '</div>' +
  
            '<div class="robot-image-picker-files">' +
  
              '<div class="robot-image-picker-pane-title">' +
                '<span>Hình ảnh</span>' +
                '<span id="robot-add-image-picker-folder-name"></span>' +
              '</div>' +
  
              '<div id="robot-add-image-picker-list" class="robot-image-picker-list">' +
                '<div class="robot-image-picker-empty">Chọn một thư mục để xem hình ảnh.</div>' +
              '</div>' +
  
            '</div>' +
  
          '</div>' +
  
          '<div class="robot-image-picker-actions">' +
            '<button type="button" class="button-secondary robot-add-image-picker-close">Hủy</button>' +
            '<button type="button" id="robot-add-image-picker-add" class="button-primary">Thêm ảnh đã chọn</button>' +
          '</div>' +
  
        '</div>' +
  
      '</div>';
  
    const tree =
      modal.querySelector(
        "#robot-add-folder-tree"
      );
  
    const folderName =
      modal.querySelector(
        "#robot-add-image-picker-folder-name"
      );
  
    const imageList =
      modal.querySelector(
        "#robot-add-image-picker-list"
      );
  
    function createFolderTree(folderList) {
  
      const root = {
        name: "",
        path: "",
        children: {},
        folder: null
      };
  
      folderList.forEach(
        function (folder) {
  
          const parts =
            folder.path
              .split("/")
              .filter(Boolean);
  
          let current =
            root;
  
          parts.forEach(
            function (part, index) {
  
              if (!current.children[part]) {
  
                current.children[part] = {
                  name: part,
                  path: parts
                    .slice(
                      0,
                      index + 1
                    )
                    .join("/"),
                  children: {},
                  folder: null
                };
  
              }
  
              current =
                current.children[part];
  
              if (
                index ===
                parts.length - 1
              ) {
                current.folder =
                  folder;
              }
  
            }
          );
  
        }
      );
  
      return root;
    }
  
  
    function renderTreeNode(
      node,
      parentElement,
      level
    ) {
  
      const names =
        Object.keys(
          node.children
        ).sort(
          function (a, b) {
            return a.localeCompare(
              b,
              "vi"
            );
          }
        );
  
      names.forEach(
        function (name) {
  
          const child =
            node.children[name];
  
          const row =
            document.createElement(
              "div"
            );
  
          row.className =
            "robot-folder-row";
  
          row.dataset.level =
            level;
  
          const hasChildren =
            Object.keys(
              child.children
            ).length > 0;
  
          const arrow =
            document.createElement(
              "button"
            );
  
          arrow.type =
            "button";
  
          arrow.className =
            "robot-folder-arrow";
  
          arrow.textContent =
            hasChildren
              ? "▶"
              : "";
  
          const folderButton =
            document.createElement(
              "button"
            );
  
          folderButton.type =
            "button";
  
          folderButton.className =
            "robot-folder-button";
  
          folderButton.innerHTML =
            '<span class="robot-folder-icon">📁</span>' +
            '<span class="robot-folder-name">' +
              escapeAddRobotHtml(
                child.name
              ) +
            '</span>';
  
          row.appendChild(
            arrow
          );
  
          row.appendChild(
            folderButton
          );
  
          parentElement.appendChild(
            row
          );
  
          let childrenContainer =
            null;
  
          if (hasChildren) {
  
            childrenContainer =
              document.createElement(
                "div"
              );
  
            childrenContainer.className =
              "robot-folder-children";
  
            childrenContainer.hidden =
              true;
  
            parentElement.appendChild(
              childrenContainer
            );
  
            arrow.addEventListener(
              "click",
              function () {
  
                childrenContainer.hidden =
                  !childrenContainer.hidden;
  
                arrow.textContent =
                  childrenContainer.hidden
                    ? "▶"
                    : "▼";
  
              }
            );
  
          }
  
          if (child.folder) {
  
            folderButton.dataset.folderId =
              child.folder.id;
  
            folderButton.dataset.folderPath =
              child.folder.path;
  
            folderButton.addEventListener(
              "click",
              async function () {
  
                const buttons =
                  tree.querySelectorAll(
                    ".robot-folder-button"
                  );
  
                buttons.forEach(
                  function (button) {
                    button.classList.remove(
                      "is-selected"
                    );
                  }
                );
  
                folderButton.classList.add(
                  "is-selected"
                );
  
                folderName.textContent =
                  child.folder.path;
  
                await loadAddRobotFolderImages(
                  child.folder.id,
                  imageList
                );
  
              }
            );
  
          } else {
  
            folderButton.classList.add(
              "is-folder-group"
            );
  
          }
  
          if (
            hasChildren &&
            childrenContainer
          ) {
  
            renderTreeNode(
              child,
              childrenContainer,
              level + 1
            );
  
          }
  
        }
      );
    }
  
  
    async function loadAddRobotFolderImages(
      folderId,
      target
    ) {
  
      target.innerHTML =
        '<div class="robot-image-picker-empty">Đang tải hình ảnh...</div>';
  
      try {
  
        const response =
          await fetch(
            "/api/admin/drive/images?folderId=" +
            encodeURIComponent(
              folderId
            )
          );
  
        const data =
          await response.json();
  
        if (
          !response.ok ||
          !data.ok
        ) {
          throw new Error(
            data.error ||
            "Không thể lấy hình ảnh"
          );
        }
  
        if (
          !Array.isArray(
            data.images
          ) ||
          data.images.length === 0
        ) {
  
          target.innerHTML =
            '<div class="robot-image-picker-empty">' +
              "Không có hình ảnh trong thư mục này." +
            "</div>";
  
          return;
        }
  
        target.innerHTML =
          "";
  
        data.images.forEach(
          function (image) {
  
            const item =
              document.createElement(
                "label"
              );
  
            item.className =
              "robot-image-picker-item";
  
            item.innerHTML =
              '<input type="checkbox" class="robot-add-image-picker-checkbox" value="' +
                escapeAddRobotHtml(
                  image.driveId
                ) +
              '">' +
  
              '<div class="robot-image-picker-preview">' +
                '<img src="' +
                  escapeAddRobotHtml(
                    image.url
                  ) +
                  '" alt="' +
                  escapeAddRobotHtml(
                    image.fileName ||
                    "Robot"
                  ) +
                '">' +
              "</div>" +
  
              '<div class="robot-image-picker-info">' +
                "<strong>" +
                  escapeAddRobotHtml(
                    image.fileName ||
                    ""
                  ) +
                "</strong>" +
              "</div>";
  
            target.appendChild(
              item
            );
  
          }
        );
  
      } catch (error) {
  
        console.error(
          "Load add robot folder images error:",
          error
        );
  
        target.innerHTML =
          '<div class="robot-image-picker-empty">' +
            "Không thể tải hình ảnh: " +
            escapeAddRobotHtml(
              error.message
            ) +
          "</div>";
  
      }
    }
  
  
    /*
     * TẠO CÂY THƯ MỤC
     * Đây là phần trước đó đang bị thiếu.
     */
    const folderTree =
      createFolderTree(
        folders
      );
  
    tree.innerHTML =
      "";
  
    renderTreeNode(
      folderTree,
      tree,
      0
    );
  
  
    function findFolderButton(
      path
    ) {
  
      const buttons =
        tree.querySelectorAll(
          ".robot-folder-button"
        );
  
      for (
        const button of buttons
      ) {
  
        if (
          button.dataset.folderPath ===
          path
        ) {
          return button;
        }
  
      }
  
      return null;
    }
  
  
    const brand =
      addRobotState.robot.brand ||
      "";
  
    const model =
      addRobotState.robot.model ||
      "";
  
    const defaultFolderPath =
      "ROBOT/" +
      brand +
      "/" +
      model;
  
    const defaultFolderButton =
      findFolderButton(
        defaultFolderPath
      );
  
    if (defaultFolderButton) {
  
      defaultFolderButton.click();
  
      let row =
        defaultFolderButton.closest(
          ".robot-folder-row"
        );
  
      while (row) {
  
        const children =
          row.nextElementSibling;
  
        if (
          children &&
          children.classList.contains(
            "robot-folder-children"
          )
        ) {
  
          children.hidden =
            false;
  
          const arrow =
            row.querySelector(
              ".robot-folder-arrow"
            );
  
          if (arrow) {
            arrow.textContent =
              "▼";
          }
  
        }
  
        row =
          row.parentElement
            ? row.parentElement.closest(
                ".robot-folder-row"
              )
            : null;
  
      }
  
    }
  
    modal.hidden =
      false;
  
  } catch (error) {
  
    console.error(
      "Load add robot image picker error:",
      error
    );
  
    alert(
      "Không thể mở danh sách hình ảnh:\n\n" +
      error.message
    );
  
  } finally {
  
    addImageButton.disabled =
      false;
  
    addImageButton.textContent =
      "＋ Thêm hình ảnh";
  
  }

  }
);


// ============================================================
// GOOGLE DRIVE - ĐÓNG BỘ CHỌN HÌNH ẢNH
// ============================================================

document.addEventListener(
  "click",
  function (event) {

    const closeButton =
      event.target.closest(
        ".robot-add-image-picker-close"
      );

    if (!closeButton) {
      return;
    }

    const modal =
      document.querySelector(
        "#robot-add-image-picker"
      );

    if (modal) {
      modal.hidden =
        true;
    }

  }
);


// ============================================================
// GOOGLE DRIVE - THÊM ẢNH ĐÃ CHỌN
// ============================================================

document.addEventListener(
  "click",
  function (event) {

    const addSelectedButton =
      event.target.closest(
        "#robot-add-image-picker-add"
      );

    if (!addSelectedButton) {
      return;
    }

    const modal =
      document.querySelector(
        "#robot-add-image-picker"
      );

    if (!modal) {
      return;
    }

    const checkboxes =
      modal.querySelectorAll(
        ".robot-add-image-picker-checkbox:checked"
      );

    if (
      checkboxes.length === 0
    ) {
      alert(
        "Vui lòng chọn ít nhất một hình ảnh."
      );

      return;
    }

    checkboxes.forEach(
      function (checkbox) {

        const driveId =
          checkbox.value;

        const exists =
          addRobotImages.some(
            function (image) {
              return String(
                image.driveId
              ) ===
              String(
                driveId
              );
            }
          );

        if (exists) {
          return;
        }

        const item =
          checkbox.closest(
            ".robot-image-picker-item"
          );

        const imageElement =
          item
            ? item.querySelector(
                "img"
              )
            : null;

        const nameElement =
          item
            ? item.querySelector(
                ".robot-image-picker-info strong"
              )
            : null;

        addRobotImages.push({
          driveId: driveId,
          fileName:
            nameElement
              ? nameElement.textContent.trim()
              : "",
          mimeType:
            "image/*",
          sortOrder:
            addRobotImages.length + 1,
          isPrimary:
            false,
          url:
            imageElement
              ? imageElement.src
              : "/api/image/" +
                driveId
        });

      }
    );

    if (
      addRobotImages.length > 0 &&
      !addRobotImages.some(
        function (image) {
          return Boolean(
            image.isPrimary
          );
        }
      )
    ) {
      addRobotImages[0].isPrimary =
        true;
    }

    addRobotImages.forEach(
      function (image, index) {
        image.sortOrder =
          index + 1;
      }
    );

    modal.hidden =
      true;

    renderAddRobotImages();

  }
);


// ============================================================
// QUẢN LÝ ẢNH - ẢNH CHÍNH / TRÁI / PHẢI / XÓA
// ============================================================

document.addEventListener(
  "click",
  function (event) {

    const button =
      event.target.closest(
        ".robot-add-image-primary, .robot-add-image-left, .robot-add-image-right, .robot-add-image-remove"
      );

    if (!button) {
      return;
    }

    const driveId =
      button.dataset.driveId;

    if (!driveId) {
      return;
    }

    const index =
      addRobotImages.findIndex(
        function (image) {
          return String(
            image.driveId
          ) ===
          String(
            driveId
          );
        }
      );

    if (index < 0) {
      return;
    }

    if (
      button.classList.contains(
        "robot-add-image-primary"
      )
    ) {

      addRobotImages.forEach(
        function (image) {
          image.isPrimary =
            String(
              image.driveId
            ) ===
            String(
              driveId
            );
        }
      );

    }


    if (
      button.classList.contains(
        "robot-add-image-left"
      )
    ) {

      if (index > 0) {

        const temp =
          addRobotImages[index - 1];

        addRobotImages[index - 1] =
          addRobotImages[index];

        addRobotImages[index] =
          temp;

      }

    }


    if (
      button.classList.contains(
        "robot-add-image-right"
      )
    ) {

      if (
        index <
        addRobotImages.length - 1
      ) {

        const temp =
          addRobotImages[index + 1];

        addRobotImages[index + 1] =
          addRobotImages[index];

        addRobotImages[index] =
          temp;

      }

    }


    if (
      button.classList.contains(
        "robot-add-image-remove"
      )
    ) {

      addRobotImages.splice(
        index,
        1
      );

    }


    if (
      addRobotImages.length > 0
    ) {

      let primaryIndex =
        addRobotImages.findIndex(
          function (image) {
            return Boolean(
              image.isPrimary
            );
          }
        );

      if (
        primaryIndex < 0
      ) {
        primaryIndex =
          0;
      }

      addRobotImages.forEach(
        function (image, imageIndex) {
          image.isPrimary =
            imageIndex ===
            primaryIndex;
        }
      );

    }


    addRobotImages.forEach(
      function (image, imageIndex) {
        image.sortOrder =
          imageIndex + 1;
      }
    );

    renderAddRobotImages();

  }
);


// ============================================================
// TẠO ROBOT
// ============================================================

document.addEventListener(
  "click",
  async function (event) {

    const createButton =
      event.target.closest(
        "#robot-add-create"
      );

    if (!createButton) {
      return;
    }

    const panel =
      getAddRobotPanel();

    if (!panel) {
      return;
    }

    try {

      createButton.disabled =
        true;

      createButton.textContent =
        "Đang tạo Robot...";

      const robot =
        Object.assign(
          {},
          addRobotState.robot
        );

      const specs =
        Object.assign(
          {},
          addRobotState.specs
        );

      const content =
        Object.assign(
          {},
          addRobotState.content
        );

      const features =
        Array.isArray(
          addRobotState.features
        )
          ? addRobotState.features.map(
              function (feature, index) {
                return {
                  title:
                    feature.title ||
                    "",
                  description:
                    feature.description ||
                    "",
                  sort_order:
                    index + 1
                };
              }
            )
          : [];

      const images =
        Array.isArray(
          addRobotImages
        )
          ? addRobotImages.map(
              function (image, index) {
                return {
                  driveId:
                    image.driveId,
                  fileName:
                    image.fileName ||
                    "",
                  mimeType:
                    image.mimeType ||
                    "image/*",
                  sortOrder:
                    index + 1,
                  isPrimary:
                    Boolean(
                      image.isPrimary
                    )
                };
              }
            )
          : [];

      if (
        !robot.brand ||
        !robot.model
      ) {
        throw new Error(
          "Hãng và Model là bắt buộc."
        );
      }

      const response =
        await fetch(
          "/api/admin/robot",
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json"
            },

            body:
              JSON.stringify({
                robot:
                  robot,

                specs:
                  specs,

                content:
                  content,

                features:
                  features,

                images:
                  images
              })
          }
        );

      const data =
        await response.json();

      if (
        !response.ok ||
        !data.ok
      ) {
        throw new Error(
          data.error ||
          "Không thể tạo Robot."
        );
      }

      alert(
        "Đã tạo Robot thành công.\n\n" +
        data.robot.model +
        "\n\n" +
        "ID: " +
        data.robotId
      );

      addRobotImages =
        [];

      addRobotState.step =
        1;

      panel.remove();

      if (
        typeof loadRobots ===
        "function"
      ) {
        await loadRobots();
      } else {
        window.location.reload();
      }

    } catch (error) {

      console.error(
        "Create robot error:",
        error
      );

      alert(
        "Không thể tạo Robot:\n\n" +
        error.message
      );

    } finally {

      createButton.disabled =
        false;

      createButton.textContent =
        "Tạo Robot";

    }

  }
);
