/* =========================================================
   TRUNG TỬ TẾ - SO SÁNH ROBOT LAU NHÀ
   Dữ liệu lấy từ API D1 hiện có.
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  const searchA = document.querySelector("#compare-search-a");
  const searchB = document.querySelector("#compare-search-b");
  const searchC = document.querySelector("#compare-search-c");

  const selectA = document.querySelector("#compare-robot-a");
  const selectB = document.querySelector("#compare-robot-b");
  const selectC = document.querySelector("#compare-robot-c");

  const suggestionsA = document.querySelector("#compare-suggestions-a");
  const suggestionsB = document.querySelector("#compare-suggestions-b");
  const suggestionsC = document.querySelector("#compare-suggestions-c");

  const selectedA = document.querySelector("#compare-selected-a");
  const selectedB = document.querySelector("#compare-selected-b");
  const selectedC = document.querySelector("#compare-selected-c");

  const submitButton = document.querySelector("#compare-submit");
  const shareButton = document.querySelector("#compare-share");
  const status = document.querySelector("#compare-status");
  const results = document.querySelector("#compare-results");
  const emptyState = document.querySelector("#compare-empty");
  const productGrid = document.querySelector("#compare-product-grid");
  const specsContainer = document.querySelector("#compare-specs");
  const featuresContainer = document.querySelector("#compare-features");
  const analysisContainer = document.querySelector("#compare-analysis");
  const differencesContainer = document.querySelector("#compare-differences");
  const adviceContainer = document.querySelector("#compare-advice");

  if (
    !searchA ||
    !searchB ||
    !selectA ||
    !selectB ||
    !suggestionsA ||
    !suggestionsB ||
    !suggestionsC ||
    !selectedA ||
    !selectedB ||
    !selectedC ||
    !submitButton ||
    !status ||
    !results ||
    !emptyState ||
    !productGrid ||
    !specsContainer ||
    !featuresContainer
  ) {
    return;
  }

  let robots = [];
  let currentRobots = [];

  const MISSING = "Chưa có dữ liệu";


  const SPEC_FIELDS = [
    ["suction_power", "Lực hút"],
    ["obstacle_recognition", "Nhận diện vật cản"],
    ["mopping_technology", "Công nghệ lau"],
    ["mop_extension", "Mở rộng cây lau"],
    ["side_brush_extension", "Chổi cạnh mở rộng"],
    ["automatic_mop_washing", "Tự động giặt giẻ"],
    ["mop_drying", "Sấy khô giẻ lau"],
    ["wash_tray_self_cleaning", "Tự làm sạch khay giặt"],
    ["automatic_dust_emptying", "Tự động đổ rác"],
    ["automatic_detergent_dispensing", "Tự pha nước lau sàn"],
    ["carpet_mop_lift", "Nâng giẻ khi gặp thảm"],
    ["dust_bag_capacity", "Dung tích túi bụi"],
    ["clean_dirty_water_capacity", "Dung tích bình nước sạch/bẩn"],
    ["battery_capacity", "Dung lượng pin"],
    ["cleaning_area", "Diện tích làm sạch"],
    ["robot_dimensions", "Kích thước robot"],
    ["dock_dimensions", "Kích thước trạm sạc"],
    ["reference_price", "Giá tham khảo"]
  ];


  function setStatus(message) {
    status.textContent = message;
  }

  function isAvailable(value) {
    if (value === null || value === undefined) {
      return false;
    }

    if (typeof value === "string") {
      return value.trim() !== "";
    }

    return true;
  }

  function displayValue(value) {
    return isAvailable(value) ? String(value) : MISSING;
  }
  function capitalizeFirst(value) {
    const text = String(value);

    if (!text || text === MISSING) {
      return text;
    }

    return text.charAt(0).toLocaleUpperCase("vi-VN") + text.slice(1);
  }
  function createElement(tag, className, text) {
    const element = document.createElement(tag);

    if (className) {
      element.className = className;
    }

    if (text !== undefined && text !== null) {
      element.textContent = String(text);
    }

    return element;
  }

  function getPrimaryImage(robot) {
    const images = Array.isArray(robot.images)
      ? robot.images
      : [];

    const image =
  images.find((item) => item.isPrimary === true) ||
  images.find((item) => item.primary === true) ||
  images.find((item) => item.is_primary === 1) ||
  images.find((item) => item.is_primary === true) ||
  images[0];

    if (!image) {
      return "";
    }

    if (image.url) {
      return image.url;
    }

    if (image.drive_id) {
      return `/api/image/${encodeURIComponent(image.drive_id)}`;
    }

    if (image.id) {
      return `/api/image/${encodeURIComponent(image.id)}`;
    }

    return "";
  }

  function normalizeText(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/Đ/g, "D")
      .toLowerCase()
      .trim();
  }

  function getSelectedRobot(slug) {
    return robots.find((robot) => robot.slug === slug) || null;
  }

  function closeSuggestions(input, suggestions) {
    suggestions.hidden = true;
    input.setAttribute("aria-expanded", "false");
  }

  function chooseRobot(side, robot) {
    const fields = {
      a: {
        input: searchA,
        hidden: selectA,
        selected: selectedA,
        suggestions: suggestionsA
      },
      b: {
        input: searchB,
        hidden: selectB,
        selected: selectedB,
        suggestions: suggestionsB
      },
      c: {
        input: searchC,
        hidden: selectC,
        selected: selectedC,
        suggestions: suggestionsC
      }
    };

    const field = fields[side];

    if (!field) return;

    const otherSelections = Object.entries(fields)
      .filter(([key]) => key !== side)
      .map(([, item]) => item.hidden.value);

    if (otherSelections.includes(robot.slug)) {
      setStatus("Mỗi ô cần chọn một model robot khác nhau.");
      return;
    }

    field.hidden.value = robot.slug;
    field.input.value = robot.model || robot.slug;
    field.selected.textContent =
      `${robot.brand || "Khác"} · ${robot.model || robot.slug}`;

    closeSuggestions(field.input, field.suggestions);
    setStatus(`Đã chọn ${robot.model || robot.slug}.`);
  }

  function renderSuggestions(side) {
    const fields = {
      a: { input: searchA, hidden: selectA, suggestions: suggestionsA },
      b: { input: searchB, hidden: selectB, suggestions: suggestionsB },
      c: { input: searchC, hidden: selectC, suggestions: suggestionsC }
    };

    const field = fields[side];

    if (!field) return;

    const { input, hidden, suggestions } = field;
    const query = normalizeText(input.value);

    suggestions.replaceChildren();

    if (!query) {
      closeSuggestions(input, suggestions);
      return;
    }

    const selectedSlugs = Object.entries(fields)
      .filter(([key]) => key !== side)
      .map(([, item]) => item.hidden.value)
      .filter(Boolean);

    const matches = robots
      .filter((robot) => {
        const searchable = normalizeText(
          `${robot.brand || ""} ${robot.model || ""} ${robot.slug || ""}`
        );

        return searchable.includes(query);
      })
      .filter((robot) => !selectedSlugs.includes(robot.slug))
      .slice(0, 10);

    if (matches.length === 0) {
      suggestions.appendChild(
        createElement(
          "div",
          "compare-suggestion-empty",
          "Không tìm thấy robot phù hợp."
        )
      );

      suggestions.hidden = false;
      input.setAttribute("aria-expanded", "true");
      return;
    }

    matches.forEach((robot) => {
      const option = createElement("button", "compare-suggestion");
      option.type = "button";
      option.setAttribute("role", "option");

      option.appendChild(
        createElement(
          "span",
          "compare-suggestion-name",
          robot.model || robot.slug
        )
      );

      option.appendChild(
        createElement(
          "small",
          "compare-suggestion-brand",
          robot.brand || "Khác"
        )
      );

      option.addEventListener("click", () => chooseRobot(side, robot));
      suggestions.appendChild(option);
    });

    suggestions.hidden = false;
    input.setAttribute("aria-expanded", "true");
  }

  function renderProductCard(robot) {
    const card = createElement("article", "compare-product-card");
    const imageWrap = createElement(
      "div",
      "compare-product-image-wrap"
    );

    const imageUrl = getPrimaryImage(robot);

    if (imageUrl) {
      const image = createElement("img", "compare-product-image");

      image.src = imageUrl;
      image.alt = `${robot.brand || ""} ${robot.model || ""}`.trim();
      image.loading = "lazy";

      image.addEventListener("error", () => {
        image.remove();

        if (!imageWrap.querySelector(".compare-image-placeholder")) {
          imageWrap.appendChild(
            createElement(
              "span",
              "compare-image-placeholder",
              "Chưa có ảnh hiển thị"
            )
          );
        }
      });

      imageWrap.appendChild(image);
    } else {
      imageWrap.appendChild(
        createElement(
          "span",
          "compare-image-placeholder",
          "Chưa có ảnh"
        )
      );
    }

    const info = createElement("div", "compare-product-info");

    info.appendChild(
      createElement(
        "p",
        "compare-product-brand",
        robot.brand || "Chưa có thương hiệu"
      )
    );

    info.appendChild(
      createElement(
        "h3",
        "compare-product-name",
        robot.model || "Chưa có tên model"
      )
    );

    info.appendChild(
      createElement(
        "p",
        "compare-product-year",
        `Năm ra mắt: ${displayValue(robot.year)}`
      )
    );

    card.append(imageWrap, info);

    return card;
  }


  function renderSpecs(robotsToCompare) {
    const comparedRobots = Array.isArray(robotsToCompare)
      ? robotsToCompare
      : Array.from(arguments);

    const table = createElement("table", "compare-table");
    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");

    ["Thông số", ...comparedRobots.map(
      (robot, index) => robot.model || `Robot ${index + 1}`
    )].forEach((label) => {
      headerRow.appendChild(createElement("th", "", label));
    });

    thead.appendChild(headerRow);

    const tbody = document.createElement("tbody");

    const numericFields = new Set([
      "suction_power",
      "battery_capacity"
    ]);

    function parseComparableNumber(value) {
      if (!isAvailable(value)) return null;

      const match = String(value).trim().match(/(\d[\d.,]*)/);
      if (!match) return null;

      let numberText = match[1];

      if (/^\d{1,3}(\.\d{3})+$/.test(numberText)) {
        numberText = numberText.replace(/\./g, "");
      } else {
        numberText = numberText.replace(",", ".");
      }

      const number = Number(numberText);
      return Number.isFinite(number) ? number : null;
    }

    SPEC_FIELDS.forEach(([field, label]) => {
      const values = comparedRobots.map((robot) =>
        robot.specs ? robot.specs[field] : null
      );

      const available = values.map((value) =>
        field === "reference_price"
          ? Number(value) > 0
          : isAvailable(value)
      );

      if (
        field === "cleaning_area" &&
        !available.some(Boolean)
      ) {
        return;
      }

      const row = document.createElement("tr");
      row.appendChild(createElement("td", "", label));

      const formatValue = (value, isValueAvailable) => {
        if (!isValueAvailable) return MISSING;

        if (field === "reference_price") {
          return `Khoảng ${Math.floor(Number(value) / 1000000)} triệu`;
        }

        return displayValue(value);
      };

      const cells = values.map((value, index) => {
        const cell = createElement(
          "td",
          available[index] ? "" : "compare-value-missing",
          capitalizeFirst(formatValue(value, available[index]))
        );

        return cell;
      });

      const distinctValues = values
        .map((value, index) =>
          available[index] ? normalizeText(value) : null
        )
        .filter((value) => value !== null);

      const hasDifferentValues =
        new Set(distinctValues).size > 1;

      if (hasDifferentValues) {
        cells.forEach((cell, index) => {
          if (available[index]) {
            cell.classList.add("compare-value-different");
          }
        });

        if (numericFields.has(field)) {
          const numericValues = values.map((value, index) => ({
            index,
            number: available[index]
              ? parseComparableNumber(value)
              : null
          })).filter((item) => item.number !== null);

          if (numericValues.length >= 2) {
            const highest = Math.max(
              ...numericValues.map((item) => item.number)
            );

            numericValues.forEach((item) => {
              if (item.number === highest) {
                cells[item.index].classList.add(
                  "compare-value-higher"
                );
              }
            });
          }
        }
      }

      row.append(...cells);
      tbody.appendChild(row);
    });

    table.append(thead, tbody);
    specsContainer.replaceChildren(table);
  }


  function renderDifferences(robotsToCompare) {
    if (!differencesContainer) return;

    const comparedRobots = Array.isArray(robotsToCompare)
      ? robotsToCompare
      : Array.from(arguments);

    differencesContainer.replaceChildren();

    const differences = [];

    function parseNumber(value) {
      if (!isAvailable(value)) return null;

      const match = String(value).match(/(\d[\d.,]*)/);
      if (!match) return null;

      let number = match[1];

      if (/^\d{1,3}(\.\d{3})+$/.test(number)) {
        number = number.replace(/\./g, "");
      } else {
        number = number.replace(",", ".");
      }

      const result = Number(number);
      return Number.isFinite(result) ? result : null;
    }

    function addDifference(title, values, higherIsBetter = false) {
      const availableValues = values
        .map((value, index) => ({
          index,
          value,
          text: String(value ?? "").trim()
        }))
        .filter((item) => isAvailable(item.value));

      if (availableValues.length < 2) return;

      const distinctValues = new Set(
        availableValues.map((item) => normalizeText(item.text))
      );

      if (distinctValues.size < 2) return;

      let explanation = "";

      if (higherIsBetter) {
        const numericValues = availableValues
          .map((item) => ({
            ...item,
            number: parseNumber(item.value)
          }))
          .filter((item) => item.number !== null);

        if (numericValues.length >= 2) {
          const highest = Math.max(
            ...numericValues.map((item) => item.number)
          );

          const highestRobots = numericValues
            .filter((item) => item.number === highest)
            .map((item) =>
              comparedRobots[item.index].model || `Robot ${item.index + 1}`
            );

          explanation = `${highestRobots.join(", ")} có giá trị cao nhất`;
        }
      }

      differences.push({
        title,
        values: values.map((value, index) => ({
          model: comparedRobots[index].model || `Robot ${index + 1}`,
          value: isAvailable(value) ? String(value).trim() : MISSING
        })),
        explanation
      });
    }

    const specs = comparedRobots.map((robot) => robot.specs || {});

    addDifference(
      "Lực hút",
      specs.map((item) => item.suction_power),
      true
    );

    addDifference(
      "Dung lượng pin",
      specs.map((item) => item.battery_capacity),
      true
    );

    function getFeatureTitles(robot) {
      return (Array.isArray(robot.features) ? robot.features : [])
        .map((feature) => String(feature.title || "").trim())
        .filter(Boolean);
    }

    const featureLists = comparedRobots.map(getFeatureTitles);
    const allTitles = featureLists.flat();
    const seen = new Set();

    allTitles.forEach((title) => {
      const key = normalizeText(title);

      if (!key || seen.has(key)) return;
      seen.add(key);

      const presence = featureLists.map((titles) =>
        titles.some((item) => normalizeText(item) === key)
      );

      if (presence.every(Boolean) || presence.every((value) => !value)) {
        return;
      }

      differences.push({
        title: "Khác biệt tính năng",
        values: comparedRobots.map((robot, index) => ({
          model: robot.model || `Robot ${index + 1}`,
          value: presence[index] ? title : "Chưa thấy trong dữ liệu"
        })),
        explanation: ""
      });
    });

    const selectedDifferences = differences.slice(0, 5);

    if (selectedDifferences.length === 0) {
      differencesContainer.appendChild(
        createElement(
          "p",
          "compare-feature-empty",
          "Chưa đủ dữ liệu để xác định điểm khác biệt nổi bật."
        )
      );
      return;
    }

    selectedDifferences.forEach((item) => {
      const card = createElement("article", "compare-difference-card");

      card.appendChild(createElement("h4", "", item.title));

      const values = createElement("div", "compare-difference-values");

      item.values.forEach((entry) => {
        values.appendChild(
          createElement(
            "p",
            "compare-difference-value",
            `${entry.model}: ${entry.value}`
          )
        );
      });

      card.appendChild(values);

      if (item.explanation) {
        card.appendChild(
          createElement(
            "p",
            "compare-difference-note",
            item.explanation
          )
        );
      }

      differencesContainer.appendChild(card);
    });
  }


  function renderFeatures(robotsToCompare) {
    const comparedRobots = Array.isArray(robotsToCompare)
      ? robotsToCompare
      : Array.from(arguments);

    featuresContainer.replaceChildren();

    comparedRobots.forEach((robot) => {
      const card = createElement("article", "compare-feature-card");

      card.appendChild(
        createElement(
          "h4",
          "",
          `${robot.brand || ""} ${robot.model || ""}`.trim()
        )
      );

      const features = Array.isArray(robot.features)
        ? robot.features
        : [];

      if (features.length === 0) {
        card.appendChild(
          createElement(
            "p",
            "compare-feature-empty",
            MISSING
          )
        );
      } else {
        const list = createElement("ul", "compare-feature-list");

        features.forEach((feature) => {
          const title = isAvailable(feature.title)
            ? String(feature.title).trim()
            : "";

          const description = isAvailable(feature.description)
            ? String(feature.description).trim()
            : "";

          const text =
            title && description
              ? `${title}: ${description}`
              : title || description;

          if (text) {
            list.appendChild(createElement("li", "", text));
          }
        });

        if (list.children.length === 0) {
          card.appendChild(
            createElement(
              "p",
              "compare-feature-empty",
              MISSING
            )
          );
        } else {
          card.appendChild(list);
        }
      }

      featuresContainer.appendChild(card);
    });
  }

  function renderAnalysis(robotsToCompare) {
    if (!analysisContainer) return;

    const comparedRobots = Array.isArray(robotsToCompare)
      ? robotsToCompare
      : Array.from(arguments);

    analysisContainer.replaceChildren();

    comparedRobots.forEach((robot) => {
      const card = createElement("article", "compare-feature-card");

      card.appendChild(
        createElement(
          "h4",
          "",
          `${robot.brand || ""} ${robot.model || ""}`.trim()
        )
      );

      const content = robot.content || {};
      let aiContent = content.ai_content || {};

      if (typeof aiContent === "string") {
        try {
          aiContent = JSON.parse(aiContent);
        } catch {
          aiContent = {};
        }
      }

      const aiSections = Array.isArray(aiContent.sections)
        ? aiContent.sections
        : [];

      const features = Array.isArray(robot.features)
        ? robot.features
        : [];

        const featureSummaries = features
        .map((feature) => {
          const title = String(feature.title || "").trim();
          const description = String(
            feature.description ||
            feature.content ||
            feature.detail ||
            ""
          ).trim();

          return [title, description]
            .filter(Boolean)
            .join(": ");
        })
        .filter(Boolean)
        .slice(0, 4);

      const sectionSummaries = aiSections
        .map((section) => {
          const title = String(section.title || "").trim();
          const paragraphs = Array.isArray(section.paragraphs)
            ? section.paragraphs
                .map((paragraph) => String(paragraph || "").trim())
                .filter(Boolean)
                .join(" ")
            : "";

          return [title, paragraphs]
            .filter(Boolean)
            .join(": ");
        })
        .filter(Boolean)
        .slice(0, 4);

      const pros = isAvailable(content.pros)
        ? content.pros
        : (
            featureSummaries.length
              ? featureSummaries
              : sectionSummaries
          ).join("; ");

      function extractTechnicalNotes(text) {
        const sentences = String(text || "")
          .replace(/\s+/g, " ")
          .split(/(?<=[.!?])\s+/)
          .map((sentence) => sentence.trim())
          .filter(Boolean);

        const maintenanceKeywords =
          /vệ sinh|bảo dưỡng|kiểm tra|làm sạch định kỳ|thay thế|tránh tắc|cặn bẩn|khay giặt|bình nước/i;

        return sentences
          .filter((sentence) => maintenanceKeywords.test(sentence))
          .slice(0, 2)
          .join("; ");
      }

      const notes = isAvailable(content.notes)
        ? content.notes
        : extractTechnicalNotes(aiContent.technical_view);

      function shorten(text, maxLength = 150) {
        const normalized = String(text)
          .replace(/\s+/g, " ")
          .trim();

        if (normalized.length <= maxLength) return normalized;

        const sentenceEnd = normalized
          .slice(0, maxLength)
          .search(/[.!?](?:\s|$)/);

        if (sentenceEnd > 0) {
          return normalized.slice(0, sentenceEnd + 1).trim();
        }

        const shortened = normalized.slice(0, maxLength);
        const lastSpace = shortened.lastIndexOf(" ");

        return shortened
          .slice(0, lastSpace > 0 ? lastSpace : maxLength)
          .trim();
      }

      function appendSection(title, value, maxItems, maxLength) {
        if (!isAvailable(value)) return;

        const section = createElement("div", "compare-analysis-section");
        section.appendChild(createElement("h5", "", title));

        let items = Array.isArray(value)
          ? value
          : String(value).split(/[;\n]+/);

        items = items
          .map((item) => String(item).replace(/\s+/g, " ").trim())
          .filter(Boolean)
          .slice(0, maxItems)
          .map((item) =>
            shorten(
              item.charAt(0).toLocaleUpperCase("vi-VN") + item.slice(1),
              maxLength
            )
          );

        if (items.length === 0) return;

        const list = createElement("ul", "compare-feature-list");

        items.forEach((item) => {
          list.appendChild(createElement("li", "", item));
        });

        section.appendChild(list);
        card.appendChild(section);
      }

      appendSection("Ưu điểm", pros, 4, 150);
      appendSection("Lưu ý kỹ thuật", notes, 2, 180);

      if (!card.querySelector(".compare-analysis-section")) {
        card.appendChild(
          createElement("p", "compare-feature-empty", MISSING)
        );
      }

      analysisContainer.appendChild(card);
    });
  }

  function renderAdvice(robotsToCompare) {
    if (!adviceContainer) return;

    const comparedRobots = Array.isArray(robotsToCompare)
      ? robotsToCompare
      : Array.from(arguments);

    adviceContainer.replaceChildren();

    const criteria = [
      {
        field: "suction_power",
        label: "Lực hút",
        unit: "Pa",
        higherText: "có thông số lực hút cao hơn"
      },
      {
        field: "battery_capacity",
        label: "Dung lượng pin",
        unit: "mAh",
        higherText: "có dung lượng pin lớn hơn"
      }
    ];

    function parseNumber(value) {
      if (!isAvailable(value)) return null;

      const match = String(value).match(/(\d[\d.,]*)/);
      if (!match) return null;

      let number = match[1];

      if (/^\d{1,3}(\.\d{3})+$/.test(number)) {
        number = number.replace(/\./g, "");
      } else {
        number = number.replace(",", ".");
      }

      const result = Number(number);
      return Number.isFinite(result) ? result : null;
    }

    function formatValue(value, unit) {
      if (!isAvailable(value)) return "Chưa có dữ liệu";

      const number = parseNumber(value);

      if (number === null) {
        return String(value).trim();
      }

      return `${number.toLocaleString("vi-VN")} ${unit}`;
    }

    const models = comparedRobots.map((robot, index) => ({
      robot,
      specs: robot.specs || {},
      index,
      advantages: [],
      considerations: [],
      priorities: []
    }));

    criteria.forEach((criterion) => {
      const availableModels = models
        .map((model) => ({
          ...model,
          value: model.specs[criterion.field],
          number: parseNumber(model.specs[criterion.field])
        }))
        .filter(
          (model) =>
            isAvailable(model.value) &&
            model.number !== null
        );

      if (availableModels.length < 2) return;

      const distinctValues = new Set(
        availableModels.map((model) => model.number)
      );

      if (distinctValues.size < 2) return;

      const highest = Math.max(
        ...availableModels.map((model) => model.number)
      );

      const lowest = Math.min(
        ...availableModels.map((model) => model.number)
      );

      availableModels.forEach((model) => {
        const name =
          model.robot.model ||
          model.robot.slug ||
          `Robot ${model.index + 1}`;

        const valueText = formatValue(
          model.value,
          criterion.unit
        );

        if (model.number === highest) {
          model.advantages.push(
            `${criterion.label}: ${valueText}, cao nhất trong nhóm model có dữ liệu.`
          );

          if (criterion.field === "suction_power") {
            model.priorities.push("lực hút theo thông số");
          } else if (criterion.field === "battery_capacity") {
            model.priorities.push("dung lượng pin theo thông số");
          }
        }

        if (model.number === lowest) {
          const otherValues = availableModels
            .filter((other) => other.index !== model.index)
            .map((other) =>
              `${other.robot.model || `Robot ${other.index + 1}`}: ${formatValue(other.value, criterion.unit)}`
            );

          model.considerations.push(
            `${criterion.label}: ${valueText}; các model còn lại có thông số ${otherValues.join("; ")}.`
          );
        }
      });
    });

    models.forEach(({ robot, advantages, considerations, priorities, index }) => {
      const card = createElement("article", "compare-feature-card");

      card.appendChild(
        createElement(
          "h4",
          "",
          robot.model || robot.slug || `Robot ${index + 1}`
        )
      );

      function appendList(title, items, emptyText) {
        const section = createElement("div", "compare-analysis-section");
        section.appendChild(createElement("h5", "", title));

        const list = createElement("ul", "compare-feature-list");
        const entries = items.length ? items : [emptyText];

        entries.forEach((item) => {
          list.appendChild(createElement("li", "", item));
        });

        section.appendChild(list);
        card.appendChild(section);
      }

      appendList(
        "Ưu điểm theo thông số",
        advantages,
        "Chưa đủ dữ liệu để xác định lợi thế về các thông số đang đối chiếu."
      );

      appendList(
        "Điểm cần cân nhắc",
        considerations,
        "Chưa ghi nhận thông số nào thấp nhất trong nhóm tiêu chí có dữ liệu."
      );

      const adviceItems = [];

      if (priorities.length > 0) {
        adviceItems.push(
          `Có thể cân nhắc model này nếu bạn ưu tiên ${priorities.join(" và ")}.`
        );
      }

      if (
        !isAvailable((robot.specs || {}).suction_power) ||
        !isAvailable((robot.specs || {}).battery_capacity)
      ) {
        adviceItems.push(
          "Một số thông số còn thiếu; cần kiểm tra thêm trước khi kết luận."
        );
      }

      adviceItems.push(
        "Nên xem thêm công nghệ lau, khả năng vượt chướng ngại, tính năng trạm sạc, nhu cầu sử dụng và giá bán trước khi quyết định."
      );

      appendList("Tư vấn lựa chọn", adviceItems, "");

      adviceContainer.appendChild(card);
    });
  }

  function alignPairedSections(container) {
    if (!container) return;

    const cards = Array.from(
      container.querySelectorAll(":scope > .compare-feature-card")
    );

    if (cards.length < 2) return;

    const allSections = cards.map((card) =>
      Array.from(
        card.querySelectorAll(":scope > .compare-analysis-section")
      )
    );

    allSections.flat().forEach((section) => {
      section.style.minHeight = "";
    });

    const maxCount = Math.max(
      ...allSections.map((sections) => sections.length)
    );

    for (let i = 0; i < maxCount; i++) {
      const matchingSections = allSections
        .map((sections) => sections[i])
        .filter(Boolean);

      if (matchingSections.length < 2) continue;

      const maxHeight = Math.ceil(
        Math.max(
          ...matchingSections.map(
            (section) => section.getBoundingClientRect().height
          )
        )
      );

      matchingSections.forEach((section) => {
        section.style.minHeight = `${maxHeight}px`;
      });
    }
  }

  function alignAllComparisonSections() {
    alignPairedSections(analysisContainer);
    alignPairedSections(adviceContainer);
  }

  window.addEventListener("resize", () => {
    requestAnimationFrame(alignAllComparisonSections);
  });



  async function fetchRobotDetails(slug) {
    const response = await fetch(
      `/api/robot/${encodeURIComponent(slug)}`
    );

    if (!response.ok) {
      throw new Error(`Không tải được dữ liệu robot: ${slug}`);
    }

    const data = await response.json();

    if (!data.ok || !data.robot) {
      throw new Error(data.error || `Không tìm thấy robot: ${slug}`);
    }

    return data.robot;
  }

  async function compareRobots(updateUrl = true) {
    const selectedSlugs = [
      selectA.value,
      selectB.value,
      selectC.value
    ].filter(Boolean);

    if (selectedSlugs.length < 2) {
      setStatus("Vui lòng chọn ít nhất hai robot để so sánh.");
      return;
    }

    if (new Set(selectedSlugs).size !== selectedSlugs.length) {
      setStatus("Vui lòng chọn các model robot khác nhau.");
      return;
    }

    submitButton.disabled = true;
    setStatus("Đang tải thông số và tính năng robot...");

    try {
      const loadedRobots = await Promise.all(
        selectedSlugs.map((slug) => fetchRobotDetails(slug))
      );

      currentRobots = loadedRobots;
      const columnCount = loadedRobots.length;

      [
        productGrid,
        featuresContainer,
        analysisContainer,
        adviceContainer
      ].forEach((container) => {
        if (container) {
          container.style.setProperty(
            "--compare-column-count",
            String(columnCount)
          );
        }
      });
      productGrid.replaceChildren(
        ...loadedRobots.map((robot) => renderProductCard(robot))
      );

      renderSpecs(loadedRobots);
      renderDifferences(loadedRobots);
      renderFeatures(loadedRobots);
      renderAnalysis(loadedRobots);
      renderAdvice(loadedRobots);

      requestAnimationFrame(alignAllComparisonSections);

      results.hidden = false;
      emptyState.hidden = true;

      setStatus(
        loadedRobots.length === 3
          ? "Đã tải dữ liệu 3 model. Những thông tin chưa có sẽ được ghi rõ."
          : "Đã tải dữ liệu 2 model. Những thông tin chưa có sẽ được ghi rõ."
      );

      if (updateUrl) {
        const shareUrl = new URL(window.location.href);

        shareUrl.searchParams.set("a", selectedSlugs[0]);
        shareUrl.searchParams.set("b", selectedSlugs[1]);

        if (selectedSlugs[2]) {
          shareUrl.searchParams.set("c", selectedSlugs[2]);
        } else {
          shareUrl.searchParams.delete("c");
        }

        window.history.replaceState({}, "", shareUrl);
      }
    } catch (error) {
      console.error("Lỗi so sánh robot:", error);

      results.hidden = true;
      emptyState.hidden = false;

      setStatus(
        error.message || "Không thể tải dữ liệu. Vui lòng thử lại."
      );
    } finally {
      submitButton.disabled = false;
    }
  }

  async function copyShareUrl() {
    if (currentRobots.length < 2) {
      setStatus("Hãy so sánh ít nhất hai robot trước khi chia sẻ.");
      return;
    }

    const shareUrl = new URL(window.location.href);

    shareUrl.searchParams.set("a", currentRobots[0].slug);
    shareUrl.searchParams.set("b", currentRobots[1].slug);

    if (currentRobots[2]) {
      shareUrl.searchParams.set("c", currentRobots[2].slug);
    } else {
      shareUrl.searchParams.delete("c");
    }

    try {
      await navigator.clipboard.writeText(shareUrl.href);
      setStatus("Đã sao chép đường dẫn so sánh.");
    } catch (error) {
      window.prompt(
        "Sao chép đường dẫn so sánh bên dưới:",
        shareUrl.href
      );
    }
  }


  async function loadRobots() {
    try {
      setStatus("Đang tải danh sách robot...");

      const response = await fetch("/api/robots");

      if (!response.ok) {
        throw new Error("Không thể tải danh sách robot.");
      }

      const data = await response.json();

      if (!data.ok || !Array.isArray(data.robots)) {
        throw new Error(
          data.error || "Dữ liệu danh sách robot không hợp lệ."
        );
      }

      robots = data.robots.filter(
        (robot) => robot.slug && robot.model
      );

      if (robots.length < 2) {
        throw new Error("Cần có ít nhất hai robot để so sánh.");
      }

      const params = new URLSearchParams(window.location.search);

      const requestedSlugs = [
        params.get("a") || "",
        params.get("b") || "",
        params.get("c") || ""
      ];

      const selectedRobots = [];
      const selectedSlugs = new Set();

      requestedSlugs.forEach((slug, index) => {
        if (!slug || selectedSlugs.has(slug)) {
          return;
        }

        const robot = getSelectedRobot(slug);

        if (!robot) {
          return;
        }

        selectedSlugs.add(robot.slug);
        selectedRobots.push({
          side: ["a", "b", "c"][index],
          robot
        });
      });

      selectedRobots.forEach(({ side, robot }) => {
        chooseRobot(side, robot);
      });



      if (selectedRobots.length >= 2) {
        await compareRobots(false);
      }
    } catch (error) {
      console.error("Lỗi tải danh sách robot:", error);

      setStatus(
        error.message ||
          "Không thể tải danh sách robot. Vui lòng thử lại."
      );
    }
  }

  searchA.addEventListener("input", () => {
    if (!searchA.value.trim()) {
      selectA.value = "";
      selectedA.textContent = "Chưa chọn robot";
    }

    renderSuggestions("a");
  });

  searchB.addEventListener("input", () => {
    if (!searchB.value.trim()) {
      selectB.value = "";
      selectedB.textContent = "Chưa chọn robot";
    }

    renderSuggestions("b");
  });

  searchC.addEventListener("input", () => {
    if (!searchC.value.trim()) {
      selectC.value = "";
      selectedC.textContent = "Chưa chọn robot";
    }

    renderSuggestions("c");
  });

  searchA.addEventListener("focus", () => {
    if (searchA.value.trim()) {
      renderSuggestions("a");
    }
  });

  searchB.addEventListener("focus", () => {
    if (searchB.value.trim()) {
      renderSuggestions("b");
    }
  });

  searchC.addEventListener("focus", () => {
    if (searchC.value.trim()) {
      renderSuggestions("c");
    }
  });

  document.addEventListener("click", (event) => {
    if (!event.target.closest("#compare-search-a, #compare-suggestions-a")) {
      closeSuggestions(searchA, suggestionsA);
    }

    if (!event.target.closest("#compare-search-b, #compare-suggestions-b")) {
      closeSuggestions(searchB, suggestionsB);
    }

    if (!event.target.closest("#compare-search-c, #compare-suggestions-c")) {
      closeSuggestions(searchC, suggestionsC);
    }
  });

  submitButton.addEventListener("click", () => {
    compareRobots(true);
  });

  if (shareButton) {
    shareButton.addEventListener("click", copyShareUrl);
  }

  loadRobots();
});
